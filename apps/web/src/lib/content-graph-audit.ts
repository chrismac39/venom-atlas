import type { EvidenceAssessment } from '@venom-atlas/domain';
import type { ContentRecords } from './content';
import { buildRouteInventory } from './content-routes';

export interface GraphIssue {
  code: string;
  path: string;
  message: string;
}

export interface ClaimAudit {
  path: string;
  evidenceId: string;
  support: 'public_source' | 'explicit_uncertainty' | 'unsupported';
  reviewed: boolean;
}

// Evidence IDs denote reusable assessments, not individual claims. Repeated
// identical definitions are legal; divergent definitions are never first-wins.
const stableValue = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableValue(entry)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
};

const sourceIdentity = (citation: ContentRecords['citations'][number]): string => {
  if (citation.doi) return `doi:${citation.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim().toLowerCase()}`;
  if (citation.url) {
    try {
      const url = new URL(citation.url);
      url.hash = '';
      url.hostname = url.hostname.toLowerCase();
      url.pathname = url.pathname.replace(/\/+$/, '') || '/';
      return url.href;
    } catch { /* Invalid URLs are handled by source validation, not guessed. */ }
  }
  return `id:${citation.id}`;
};

export const auditContentGraph = (content: ContentRecords) => {
  const issues: GraphIssue[] = [];
  const claims: ClaimAudit[] = [];
  const issue = (code: string, path: string, message: string) => issues.push({ code, path, message });
  const entities = new Map<string, string>();
  const evidence = new Map<string, { value: string; path: string }>();
  const citations = new Map(content.citations.map((entry) => [entry.id, entry]));
  const citedIds = new Set<string>();
  const register = (id: string, location: string) => {
    const previous = entities.get(id);
    if (previous) issue('duplicate_id', location, `${id} already defined at ${previous}`);
    else entities.set(id, location);
  };
  const unique = (values: Array<{ value: string; path: string }>, code: string) => {
    const seen = new Map<string, string>();
    for (const entry of values) {
      if (seen.has(entry.value)) issue(code, entry.path, `${entry.value} already defined at ${seen.get(entry.value)}`);
      else seen.set(entry.value, entry.path);
    }
  };
  const reference = (valid: boolean, location: string, kind: string, id: string) => {
    if (!valid) issue('invalid_reference', location, `Unknown or out-of-scope ${kind}: ${id}`);
  };

  // Traverse the entire authored graph, including assets and source audits that
  // the display bundles previously dropped. Scope IDs (e.g. country IDs) are references.
  const walk = (value: unknown, location: string, parent?: Record<string, unknown>): void => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => walk(entry, `${location}[${index}]`));
      return;
    }
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    if (typeof record.id === 'string' && !('type' in record)) {
      if (!record.id.trim()) issue('invalid_id', location, 'Entity and evidence IDs must not be blank.');
      if ('evidenceType' in record) {
        const assessment = record as unknown as EvidenceAssessment;
        const previous = evidence.get(assessment.id);
        const definition = stableValue(assessment);
        if (previous && previous.value !== definition) {
          issue('conflicting_evidence_id', location, `${assessment.id} differs from ${previous.path}`);
        } else if (!previous) evidence.set(assessment.id, { value: definition, path: location });

        const publicSupport = assessment.evidenceType !== 'editorial_normalization'
          && assessment.citationIds.some((id) => citations.has(id) && citations.get(id)?.visibility !== 'internal');
        // This is an explicit author declaration, not a keyword classifier or a
        // scientific review. The declared statement must be the displayed claim,
        // not hidden evidence notes attached to positive molecular assertions.
        const statement = assessment.publicUncertaintyStatement;
        const uncertainty = Boolean(statement && parent
          && (parent.summary === statement || parent.description === statement)
          && (assessment.confidence === 'unknown' || assessment.confidence === 'low')
          && (parent.targetType === undefined || parent.targetType === 'unknown')
          && parent.formula == null && parent.molecularWeight == null);
        if (statement && !uncertainty) issue('invalid_uncertainty', location, 'Uncertainty must be the displayed claim, with low/unknown confidence and no positive molecular properties.');
        const support = publicSupport ? 'public_source' : uncertainty ? 'explicit_uncertainty' : 'unsupported';
        const reviewed = assessment.reviewStatus === 'reviewed' && Boolean(assessment.reviewedAt?.trim());
        if (assessment.reviewStatus === 'reviewed' && !reviewed) {
          issue('invalid_review', location, 'A reviewed assessment requires reviewedAt; do not infer review from source access dates.');
        }
        claims.push({ path: location.replace(/\.evidence$/, ''), evidenceId: assessment.id, support, reviewed });
        if (support === 'unsupported') issue('unsupported_claim', location, `${assessment.id} has no public non-editorial source support. Review labels alone do not supply evidence.`);
      } else register(record.id, location);
    }
    for (const [key, entry] of Object.entries(record)) {
      if (key === 'citationId' || key === 'citationIds') {
        for (const id of Array.isArray(entry) ? entry : entry ? [entry] : []) {
          if (typeof id !== 'string') continue;
          citedIds.add(id);
          reference(citations.has(id), `${location}.${key}`, 'citation', id);
        }
      }
      walk(entry, `${location}.${key}`, record);
    }
  };
  Object.entries(content).forEach(([kind, records]) => walk(records, kind));

  for (const [kind, records] of Object.entries(content)) {
    unique(records.flatMap((entry, index) => 'slug' in entry && entry.slug
      ? [{ value: entry.slug, path: `${kind}[${index}].slug` }] : []), 'duplicate_slug');
  }
  unique(content.citations.flatMap((entry) => [entry.slug, ...entry.aliases].map((slug) => ({
    value: slug, path: `citations.${entry.id}`,
  }))), 'duplicate_source_slug');
  const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  for (const [kind, records] of Object.entries(content)) {
    for (const entry of records) {
      const slugs = 'slug' in entry && typeof entry.slug === 'string' ? [entry.slug] : [];
      if ('aliases' in entry) slugs.push(...entry.aliases);
      for (const slug of slugs) if (!safeSlug.test(slug)) issue('invalid_slug', `${kind}.${entry.id}`, `Unsafe route slug: ${slug}`);
    }
  }

  const organismSlugs = new Set(content.organisms.map((entry) => entry.slug));
  const materialIds = new Set(content.toxicMaterials.map((entry) => entry.id));
  const materialSlugs = new Set(content.toxicMaterials.map((entry) => entry.slug));
  const toxinSlugs = new Set(content.toxins.map((entry) => entry.slug));
  // The active bundle mapper derives organism foreign keys from slugs.
  // Preserve the former validator's protection against a mismatched authored ID.
  for (const organism of content.organisms) {
    if (organism.id !== `org-${organism.slug}`) {
      issue('organism_id_mismatch', organism.id, `Bundle mapping requires org-${organism.slug}`);
    }
  }
  for (const entry of content.toxicMaterials) {
    reference(organismSlugs.has(entry.organismSlug), entry.id, 'organism', entry.organismSlug);
    if (entry.featuredToxinSlug) reference(content.toxins.some((toxin) => toxin.slug === entry.featuredToxinSlug && toxin.toxicMaterialId === entry.id), entry.id, 'featured toxin', entry.featuredToxinSlug);
  }
  unique(content.toxicMaterials.map((entry) => ({ value: entry.organismSlug, path: entry.id })), 'duplicate_material_owner');
  for (const toxin of content.toxins) reference(materialIds.has(toxin.toxicMaterialId), toxin.id, 'toxic material', toxin.toxicMaterialId);

  for (const kind of ['mechanisms', 'physiology'] as const) {
    unique(content[kind].map((entry) => ({ value: `${entry.subject.kind}:${entry.subject.slug}`, path: entry.id })), 'duplicate_subject');
    for (const entry of content[kind]) {
      const subject = entry.subject;
      const subjects = subject.kind === 'organism_exposure' ? organismSlugs : subject.kind === 'whole_material' ? materialSlugs : toxinSlugs;
      reference(subjects.has(subject.slug), entry.id, subject.kind, subject.slug);
      const children = 'steps' in entry ? entry.steps : [...entry.symptoms, ...entry.effects];
      for (const child of children) if (child.evidence.causalScope && child.evidence.causalScope !== subject.kind) {
        issue('causal_scope_mismatch', child.id, `Evidence scope does not match ${subject.kind}`);
      }
    }
  }
  for (const physiology of content.physiology) {
    for (const effect of physiology.effects) {
      reference(physiology.anatomicalSystems.some((entry) => entry.id === effect.anatomicalSystemId), effect.id, 'anatomical system', effect.anatomicalSystemId);
      if (effect.symptomId) reference(physiology.symptoms.some((entry) => entry.id === effect.symptomId), effect.id, 'symptom', effect.symptomId);
    }
  }
  for (const mechanism of content.mechanisms) for (const step of mechanism.steps) {
    if (!step.targetId) continue;
    const toxin = content.toxins.find((entry) => entry.targets.some((target) => target.id === step.targetId));
    const material = content.toxicMaterials.find((entry) => entry.id === toxin?.toxicMaterialId);
    const subject = mechanism.subject;
    const inScope = subject.kind === 'isolated_compound' ? toxin?.slug === subject.slug
      : subject.kind === 'whole_material' ? material?.slug === subject.slug : material?.organismSlug === subject.slug;
    reference(Boolean(toxin && inScope), step.id, 'molecular target', step.targetId);
  }
  unique(content.geography.map((entry) => ({ value: entry.organismSlug, path: entry.id })), 'duplicate_geography_owner');
  for (const geography of content.geography) {
    reference(organismSlugs.has(geography.organismSlug), geography.id, 'organism', geography.organismSlug);
    const localEvidence = new Set(geography.ranges.map((range) => range.evidence.id));
    const checkEvidence = (ids: string[], location: string) => ids.forEach((id) => reference(localEvidence.has(id), location, 'geography evidence', id));
    checkEvidence(geography.sourceAudit.evidenceIds, `${geography.id}.sourceAudit`);
    checkEvidence(geography.distribution?.nativeEvidenceIds ?? [], `${geography.id}.distribution.nativeEvidenceIds`);
    geography.distribution?.nativeScopes?.forEach((scope, index) => checkEvidence(scope.evidenceIds, `${geography.id}.nativeScopes[${index}]`));
    geography.distribution?.sourceRanges?.forEach((range, index) => checkEvidence(range.evidenceIds, `${geography.id}.sourceRanges[${index}]`));
  }

  const routes = buildRouteInventory(content);
  unique(routes.map((route) => ({ value: route, path: route })), 'route_collision');
  const resolvedCitations = content.citations.filter((entry) => citedIds.has(entry.id));
  return {
    issues,
    claims,
    summary: {
      sourceRows: content.citations.length,
      uniqueCitationIds: citations.size,
      uniqueSources: new Set(content.citations.map(sourceIdentity)).size,
      publicSourceRows: content.citations.filter((entry) => entry.visibility !== 'internal').length,
      citedCitationIds: new Set(resolvedCitations.map((entry) => entry.id)).size,
      citedSources: new Set(resolvedCitations.map(sourceIdentity)).size,
      citationReferences: citedIds.size,
      claimRecords: claims.length,
      uniqueEvidenceAssessments: evidence.size,
      unsupportedClaims: claims.filter((claim) => claim.support === 'unsupported').length,
      explicitUncertaintyClaims: claims.filter((claim) => claim.support === 'explicit_uncertainty').length,
      reviewedClaims: claims.filter((claim) => claim.reviewed).length,
      routes: routes.length,
    },
  };
};