import type { EvidenceAssessment } from '@venom-atlas/domain';
import type { ContentRecords } from './content';
import { auditContentGraph } from './content-graph-audit';

export const publicationSections = ['summary', 'geography', 'chemistry', 'medical-effects'] as const;
export type PublicationSection = typeof publicationSections[number];
export interface ReadinessFailure { section: PublicationSection | 'pipeline'; code: string; path: string }
export interface PublicationReadiness {
  slug: string;
  eligible: boolean;
  sections: Record<PublicationSection, { ready: boolean; failures: ReadinessFailure[] }>;
  failures: ReadinessFailure[];
}
export type AssetCheck = (publicPath: string) => boolean;

const meaningful = (value: string | null | undefined) => Boolean(value && value.trim().split(/\s+/).length >= 4);
const citationIdsIn = (value: unknown, ids = new Set<string>()): Set<string> => {
  if (!value || typeof value !== 'object') return ids;
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'citationId' && typeof entry === 'string') ids.add(entry);
    else if (key === 'citationIds' && Array.isArray(entry)) entry.forEach((id: string) => ids.add(id));
    else citationIdsIn(entry, ids);
  }
  return ids;
};

/** Raw drafts remain untouched. The same projection feeds routes, selectors and exports. */
export const selectPublicationContent = (content: ContentRecords, slugs: Set<string>): ContentRecords => {
  const organisms = content.organisms.filter((entry) => slugs.has(entry.slug));
  const toxicMaterials = content.toxicMaterials.filter((entry) => slugs.has(entry.organismSlug));
  const toxins = content.toxins.filter((entry) => toxicMaterials.some((material) => material.id === entry.toxicMaterialId));
  const subjectAllowed = (subject: ContentRecords['mechanisms'][number]['subject']) => subject.kind === 'organism_exposure'
    ? slugs.has(subject.slug) : subject.kind === 'whole_material'
      ? toxicMaterials.some((entry) => entry.slug === subject.slug) : toxins.some((entry) => entry.slug === subject.slug);
  const records = {
    organisms, toxicMaterials, toxins,
    mechanisms: content.mechanisms.filter((entry) => subjectAllowed(entry.subject)),
    physiology: content.physiology.filter((entry) => subjectAllowed(entry.subject)),
    geography: content.geography.filter((entry) => slugs.has(entry.organismSlug)),
  };
  const assetPaths = new Set([
    ...organisms.flatMap((entry) => entry.externalProfile?.imagePaths ?? []),
    ...toxins.flatMap((entry) => entry.structureAssets.map((asset) => asset.localPath)),
  ]);
  const media = content.media.filter((entry) => assetPaths.has(entry.localPath) && entry.redistributionVerified);
  const ids = citationIdsIn({ ...records, media });
  return { ...records, media, citations: content.citations.filter((entry) => ids.has(entry.id)) };
};

/** Deterministic minimum completeness/traceability checks, NOT scientific certification.
 * No review, approval or author identity participates in eligibility. Asset checks
 * are injected so tests and offline publication use exactly the same contract.
 */
export const evaluatePublicationReadiness = (content: ContentRecords, assetValid: AssetCheck): PublicationReadiness[] =>
  content.organisms.map((organism) => {
    const slice = selectPublicationContent(content, new Set([organism.slug]));
    const failures: ReadinessFailure[] = [];
    const fail = (section: ReadinessFailure['section'], code: string, path: string) => failures.push({ section, code, path });
    const citationPublic = (id: string) => {
      const matches = content.citations.filter((entry) => entry.id === id);
      if (matches.length !== 1) return false;
      const citation = matches[0]!;
      return citation.visibility !== 'internal' && Boolean(citation.title.trim())
        && (Boolean(citation.url && /^https?:\/\//.test(citation.url)) || Boolean(citation.doi && /^10\.\d{4,9}\//.test(citation.doi)));
    };
    const support = (evidence: EvidenceAssessment) => evidence.evidenceType !== 'editorial_normalization'
      && evidence.citationIds.length > 0 && evidence.citationIds.every(citationPublic);
    const requireSupport = (section: PublicationSection, evidence: EvidenceAssessment, location: string) => {
      if (!support(evidence)) fail(section, 'public_source_required', location);
    };
    const checkAsset = (section: PublicationSection, publicPath: string) => {
      if (!assetValid(publicPath)) fail(section, 'invalid_asset', publicPath);
    };

    if (!meaningful(organism.overview) || !organism.naturalHistory.some(meaningful)
      || !meaningful(organism.deliveryMechanism.summary) || organism.deliveryMechanism.route === 'unknown') {
      fail('summary', 'substantive_summary_required', organism.id);
    }
    requireSupport('summary', organism.evidence, organism.id);
    // A selected image must not disappear from validation just because the
    // public projection omits missing or redistribution-unverified media.
    for (const imagePath of organism.externalProfile?.imagePaths ?? []) {
      if (!slice.media.some((media) => media.localPath === imagePath)) {
        checkAsset('summary', imagePath);
        fail('summary', 'media_provenance_required', imagePath);
      }
    }
    for (const media of slice.media) {
      checkAsset('summary', media.localPath);
      if (!media.license || !media.attributionText || !media.citationId || !citationPublic(media.citationId)) {
        fail('summary', 'media_provenance_required', media.id);
      }
    }

    const geography = slice.geography[0];
    if (!geography || !meaningful(geography.sourceAudit.note) || !geography.ranges.some((range) => meaningful(range.summary) && support(range.evidence))) {
      fail('geography', 'substantive_geography_required', organism.id);
    }
    if (geography) {
      if (!geography.sourceAudit.citationIds.length || !geography.sourceAudit.citationIds.every(citationPublic)) fail('geography', 'public_source_required', geography.id);
      for (const range of geography.ranges) {
        requireSupport('geography', range.evidence, range.id);
        if (range.geometryAssetPath) checkAsset('geography', range.geometryAssetPath);
        if (range.sourceGeometryAssetPath) checkAsset('geography', range.sourceGeometryAssetPath);
      }
      for (const range of geography.distribution?.sourceRanges ?? []) checkAsset('geography', range.geometryAssetPath);
      // Bounded native polygons are deliberately NOT required for marine or ubiquitous organisms.
    }

    const material = slice.toxicMaterials[0];
    if (!material || !meaningful(material.description) || !material.components.some((entry) => meaningful(entry.summary) && support(entry.evidence)) || !slice.toxins.length) {
      fail('chemistry', 'substantive_chemistry_required', organism.id);
    }
    if (material) requireSupport('chemistry', material.evidence, material.id);
    for (const toxin of slice.toxins) {
      requireSupport('chemistry', toxin.evidence, toxin.id);
      requireSupport('chemistry', toxin.molecularEntity.evidence, toxin.molecularEntity.id);
      const molecule = toxin.molecularEntity;
      if (!molecule.displayName.trim() || !meaningful(toxin.notes)) fail('chemistry', 'identity_context_required', toxin.id);
      if (molecule.molecularClass === 'small_molecule' && (!molecule.formula || !(Number(molecule.molecularWeight) > 0) || !molecule.structureDataSource)) {
        fail('chemistry', 'small_molecule_identity_required', toxin.id);
      }
      // Protein/group dossiers need not pretend that one exact 3D molecule exists.
      for (const asset of toxin.structureAssets.filter((entry) => entry.structureStatus !== 'illustrative' && entry.structureStatus !== 'placeholder')) {
        checkAsset('chemistry', asset.localPath);
        if (!asset.verified || !asset.citationId || !citationPublic(asset.citationId) || !asset.sourceUrl) fail('chemistry', 'structure_provenance_required', asset.id);
      }
    }

    const physiology = slice.physiology.find((entry) => entry.subject.kind === 'organism_exposure' && entry.subject.slug === organism.slug);
    if (!physiology || !physiology.effects.some((effect) => meaningful(effect.description) && support(effect.evidence))) {
      fail('medical-effects', 'substantive_effects_required', organism.id);
    }
    if (physiology) {
      if (!physiology.applicability || !meaningful(physiology.applicability.summary)) fail('medical-effects', 'applicability_required', physiology.id);
      for (const effect of physiology.effects) requireSupport('medical-effects', effect.evidence, effect.id);
    }
    for (const issue of auditContentGraph(slice).issues) fail('pipeline', issue.code, issue.path);
    const sections = Object.fromEntries(publicationSections.map((section) => {
      const sectionFailures = failures.filter((entry) => entry.section === section);
      return [section, { ready: sectionFailures.length === 0, failures: sectionFailures }];
    })) as PublicationReadiness['sections'];
    return { slug: organism.slug, eligible: failures.length === 0, sections, failures };
  });