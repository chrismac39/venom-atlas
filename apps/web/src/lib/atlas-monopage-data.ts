import type { EvidenceAssessment } from '@venom-atlas/domain';
import type { AtlasMechanismStep, AtlasOrganismData, AtlasProvenance } from '../features/atlas/atlas-types';
import {
  getAllMechanisms,
  getAllOrganisms,
  getAllToxins,
  getCitationsByIds,
  getGeographyByOrganismSlug,
  getMechanismByToxinSlug,
  getPhysiologyByOrganismExposureSlug,
  getPublishedMediaAssets,
  getToxicMaterialByOrganismSlug,
} from './content';
import type { MechanismBundle } from './content';
import { appPath } from './paths';
import { pickPreferred2dAsset, pickPreferred3dAsset } from './structure-assets';

const publicCitations = (ids: string[]) =>
  getCitationsByIds([...new Set(ids)]).filter((citation) => citation.visibility !== 'internal');

const provenance = (evidence: EvidenceAssessment): AtlasProvenance => ({
  evidence,
  citations: publicCitations(evidence.citationIds),
});

const mechanismSteps = (bundle: MechanismBundle | undefined): AtlasMechanismStep[] =>
  (bundle?.steps ?? []).map((step) => ({
    ...step,
    subject: bundle!.subject,
    provenance: provenance(step.evidence),
  })).sort((a, b) => a.order - b.order);

export const buildAtlasMonopageOrganisms = (): AtlasOrganismData[] => {
  const toxins = getAllToxins();
  const publishedMediaPaths = new Set(getPublishedMediaAssets().map((asset) => asset.localPath));

  return getAllOrganisms().flatMap((entry) => {
    const organismSlug = entry.organism.slug ?? entry.organism.id.replace(/^org-/, '');
    if (!organismSlug) {
      return [];
    }

    const toxicMaterialBundle = getToxicMaterialByOrganismSlug(organismSlug);
    const toxicMaterialSlug =
      toxicMaterialBundle?.toxicMaterial.slug ?? toxicMaterialBundle?.toxicMaterial.id.replace(/^ven-/, '');
    const relatedToxins = toxicMaterialBundle
      ? toxins.filter(
          (toxinEntry) => toxinEntry.toxin.toxicMaterialId === toxicMaterialBundle.toxicMaterial.id,
        )
      : [];

    const mappedToxins = relatedToxins.flatMap((toxinEntry) => {
      const toxinSlug = toxinEntry.toxin.slug ?? toxinEntry.toxin.id.replace(/^tox-/, '');
      if (!toxinSlug) {
        return [];
      }

      const threeDimensionalAsset = pickPreferred3dAsset(toxinEntry.structureAssets);
      const twoDimensionalAsset = pickPreferred2dAsset(toxinEntry.structureAssets);
      const threeDimensionalFormat =
        threeDimensionalAsset && threeDimensionalAsset.format !== 'svg'
          ? threeDimensionalAsset.format
          : undefined;

      return [
        {
          id: toxinEntry.toxin.id,
          slug: toxinSlug,
          displayName: toxinEntry.toxin.displayName,
          family: toxinEntry.toxin.family,
          notes: toxinEntry.toxin.notes,
          provenance: provenance(toxinEntry.toxin.evidence),
          identityProvenance: provenance(toxinEntry.molecularEntity.evidence),
          targets: toxinEntry.targets.map((target) => ({
            id: target.id,
            targetName: target.targetName,
            summary: target.summary,
            provenance: provenance(target.evidence),
          })),
          mechanismSteps: mechanismSteps(getMechanismByToxinSlug(toxinSlug)),
          structureSources: [twoDimensionalAsset, threeDimensionalAsset].flatMap((asset) => asset ? [{
            id: asset.id,
            format: asset.format,
            status: asset.structureStatus ?? 'not specified',
            ...(asset.sourceUrl ? { sourceUrl: asset.sourceUrl } : {}),
            citations: publicCitations(asset.citationId ? [asset.citationId] : []),
          }] : []),
          molecularClass: toxinEntry.molecularEntity.molecularClass,
          formula: toxinEntry.molecularEntity.formula,
          molecularWeight: toxinEntry.molecularEntity.molecularWeight,
          structureDataSource: toxinEntry.molecularEntity.structureDataSource,
          ...(threeDimensionalAsset?.localPath ? { structure3dUrl: appPath(threeDimensionalAsset.localPath) } : {}),
          ...(threeDimensionalFormat ? { structure3dFormat: threeDimensionalFormat } : {}),
          ...(twoDimensionalAsset?.localPath ? { structure2dUrl: appPath(twoDimensionalAsset.localPath) } : {}),
          ...(toxinEntry.interactionVisualization
            ? {
                interactionVisualization: {
                  id: toxinEntry.interactionVisualization.id,
                  label: toxinEntry.interactionVisualization.label,
                  annotationPath: appPath(toxinEntry.interactionVisualization.annotationPath),
                  structureAssetPath: appPath(toxinEntry.interactionVisualization.structureAssetPath),
                  structureFormat: toxinEntry.interactionVisualization.structureFormat,
                  evidence: toxinEntry.interactionVisualization.evidence,
                },
              }
            : {}),
          evidence: toxinEntry.molecularEntity.evidence,
          citations: publicCitations([
            ...toxinEntry.toxin.evidence.citationIds,
            ...toxinEntry.molecularEntity.evidence.citationIds,
            ...[twoDimensionalAsset, threeDimensionalAsset].flatMap((asset) => asset?.citationId ? [asset.citationId] : []),
          ]),
        },
      ];
    });

    const featuredToxin = toxicMaterialBundle?.toxicMaterial.featuredToxinSlug
      ? mappedToxins.find((toxin) => toxin.slug === toxicMaterialBundle.toxicMaterial.featuredToxinSlug)
      : undefined;
    const exposureAndMaterialSteps = getAllMechanisms().filter((bundle) =>
      (bundle.subject.kind === 'organism_exposure' && bundle.subject.slug === organismSlug) ||
      (bundle.subject.kind === 'whole_material' && bundle.subject.slug === toxicMaterialSlug),
    ).flatMap(mechanismSteps);
    const physiology = getPhysiologyByOrganismExposureSlug(organismSlug);
    const geography = getGeographyByOrganismSlug(organismSlug);
    const geographyRanges =
      geography?.ranges
        .filter((range) => range.evidence.evidenceType !== 'editorial_normalization')
        .map((range) => ({
          id: range.id,
          layerType: range.layerType,
          summary: range.summary,
          provenance: provenance(range.evidence),
          ...(range.geometryAssetId ? { geometryAssetId: range.geometryAssetId } : {}),
          ...(range.sourceGeometryAssetId ? { sourceGeometryAssetId: range.sourceGeometryAssetId } : {}),
          ...(range.geometryFeatureCount !== undefined
            ? { geometryFeatureCount: range.geometryFeatureCount }
            : {}),
        })) ?? [];
    const geographyKind = geography?.geographyKind ?? 'terrestrial';
    const hasPublishedMedia =
      entry.externalProfile?.imagePaths.some((imagePath) => publishedMediaPaths.has(imagePath)) ?? false;

    if (toxicMaterialBundle && !toxicMaterialSlug) {
      return [];
    }

    return [
      {
        slug: organismSlug,
        scientificName: entry.organism.scientificName,
        commonName: entry.organism.commonName,
        toxicStrategy: entry.organism.toxicStrategy,
        overview: entry.organism.overview,
        provenance: provenance(entry.organism.evidence),
        taxonomy: entry.taxonomy,
        naturalHistory: entry.organism.naturalHistory,
        externalProfile: entry.externalProfile
          ? {
              sourceLabel: entry.externalProfile.sourceLabel,
              sourceUrl: entry.externalProfile.sourceUrl,
              summaryPoints: entry.externalProfile.summaryPoints,
            }
          : undefined,
        geographyVisualizations: entry.geographyVisualizations,
        deliveryMechanism: { ...entry.deliveryMechanism, provenance: provenance(entry.organism.evidence) },
        habitats: entry.habitats.map((habitat) => ({ ...habitat, provenance: provenance(habitat.evidence) })),
        ecologicalRoles: entry.ecologicalRoles.map((role) => ({ ...role, provenance: provenance(role.evidence) })),
        geographyRanges,
        geographyKind,
        geographySourceAudit: geography ? {
          ...geography.sourceAudit,
          citations: publicCitations(geography.sourceAudit.citationIds),
        } : null,
        toxicMaterial: toxicMaterialBundle
          ? {
              slug: toxicMaterialSlug as string,
              name: toxicMaterialBundle.toxicMaterial.name,
              description: toxicMaterialBundle.toxicMaterial.description,
              ecologicalRoleSummary: toxicMaterialBundle.toxicMaterial.ecologicalRoleSummary,
              materialKind: toxicMaterialBundle.toxicMaterial.materialKind,
              evidence: toxicMaterialBundle.toxicMaterial.evidence,
              provenance: provenance(toxicMaterialBundle.toxicMaterial.evidence),
              components: toxicMaterialBundle.components.map((component) => ({
                ...component,
                provenance: provenance(component.evidence),
              })),
            }
          : null,
        coverage: {
          identity: 'available',
          geography:
            geographyRanges.length > 0 || entry.geographyVisualizations.length > 0 ? 'available' : 'missing',
          toxicMaterial: toxicMaterialBundle ? 'available' : 'missing',
          chemistry: mappedToxins.length > 0 ? 'available' : 'missing',
          structures: mappedToxins.some((toxin) => toxin.structure2dUrl || toxin.structure3dUrl)
            ? 'available'
            : 'missing',
          physiology: physiology ? 'available' : 'missing',
          media: hasPublishedMedia ? 'available' : 'missing',
        },
        toxins: mappedToxins,
        featuredToxin: featuredToxin
          ? {
              slug: featuredToxin.slug,
              displayName: featuredToxin.displayName,
              molecularClass: featuredToxin.molecularClass,
              formula: featuredToxin.formula,
              molecularWeight: featuredToxin.molecularWeight,
              structureDataSource: featuredToxin.structureDataSource,
              evidence: featuredToxin.evidence,
              ...(featuredToxin.structure3dUrl ? { structureUrl: featuredToxin.structure3dUrl } : {}),
              ...(featuredToxin.structure3dFormat ? { structureFormat: featuredToxin.structure3dFormat } : {}),
            }
          : null,
        mechanismSteps: exposureAndMaterialSteps,
        physiology: physiology
          ? {
              anatomicalSystems: physiology.anatomicalSystems.map((system) => ({
                id: system.id,
                name: system.name,
                description: system.description,
              })),
              symptoms: physiology.symptoms.map((symptom) => ({
                id: symptom.id,
                name: symptom.name,
                description: symptom.description,
                evidence: symptom.evidence,
                citations: publicCitations(symptom.evidence.citationIds),
              })),
              effects: physiology.effects.map((effect) => ({
                id: effect.id,
                order: effect.order,
                title: effect.title,
                description: effect.description,
                pathwayType: effect.pathwayType,
                anatomicalSystemId: effect.anatomicalSystemId,
                evidence: effect.evidence,
                citations: publicCitations(effect.evidence.citationIds),
              })),
            }
          : null,
        citations: publicCitations(entry.organism.evidence.citationIds),
      },
    ];
  });
};
