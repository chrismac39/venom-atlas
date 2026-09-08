import type { AtlasOrganismData } from '../features/atlas/atlas-types';
import {
  getAllOrganisms,
  getAllToxins,
  getCitationsByIds,
  getGeographyByOrganismSlug,
  getMechanismByOrganismExposureSlug,
  getPhysiologyByOrganismExposureSlug,
  getPublishedMediaAssets,
  getToxicMaterialByOrganismSlug,
} from './content';
import { pickPreferred2dAsset, pickPreferred3dAsset } from './structure-assets';

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
          molecularClass: toxinEntry.molecularEntity.molecularClass,
          formula: toxinEntry.molecularEntity.formula,
          molecularWeight: toxinEntry.molecularEntity.molecularWeight,
          structureDataSource: toxinEntry.molecularEntity.structureDataSource,
          ...(threeDimensionalAsset?.localPath ? { structure3dUrl: threeDimensionalAsset.localPath } : {}),
          ...(threeDimensionalFormat ? { structure3dFormat: threeDimensionalFormat } : {}),
          ...(twoDimensionalAsset?.localPath ? { structure2dUrl: twoDimensionalAsset.localPath } : {}),
          ...(toxinEntry.interactionVisualization
            ? {
                interactionVisualization: {
                  id: toxinEntry.interactionVisualization.id,
                  label: toxinEntry.interactionVisualization.label,
                  annotationPath: toxinEntry.interactionVisualization.annotationPath,
                  structureAssetPath: toxinEntry.interactionVisualization.structureAssetPath,
                  structureFormat: toxinEntry.interactionVisualization.structureFormat,
                  evidence: toxinEntry.interactionVisualization.evidence,
                },
              }
            : {}),
          evidence: toxinEntry.molecularEntity.evidence,
          citations: getCitationsByIds(toxinEntry.molecularEntity.evidence.citationIds),
        },
      ];
    });

    const featuredToxin = toxicMaterialBundle?.toxicMaterial.featuredToxinSlug
      ? mappedToxins.find((toxin) => toxin.slug === toxicMaterialBundle.toxicMaterial.featuredToxinSlug)
      : undefined;
    const mechanism = getMechanismByOrganismExposureSlug(organismSlug);
    const physiology = getPhysiologyByOrganismExposureSlug(organismSlug);
    const geography = getGeographyByOrganismSlug(organismSlug);
    const geographyRanges =
      geography?.ranges
        .filter((range) => range.evidence.evidenceType !== 'editorial_normalization')
        .map((range) => ({
          id: range.id,
          layerType: range.layerType,
          summary: range.summary,
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

    if (toxicMaterialBundle?.toxicMaterial.featuredToxinSlug && !featuredToxin) {
      return [];
    }

    return [
      {
        slug: organismSlug,
        scientificName: entry.organism.scientificName,
        commonName: entry.organism.commonName,
        toxicStrategy: entry.organism.toxicStrategy,
        overview: entry.organism.overview,
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
        deliveryMechanism: entry.deliveryMechanism,
        habitats: entry.habitats,
        ecologicalRoles: entry.ecologicalRoles,
        geographyRanges,
          geographyKind,
        toxicMaterial: toxicMaterialBundle
          ? {
              slug: toxicMaterialSlug as string,
              name: toxicMaterialBundle.toxicMaterial.name,
              description: toxicMaterialBundle.toxicMaterial.description,
              ecologicalRoleSummary: toxicMaterialBundle.toxicMaterial.ecologicalRoleSummary,
              materialKind: toxicMaterialBundle.toxicMaterial.materialKind,
              evidence: toxicMaterialBundle.toxicMaterial.evidence,
              components: toxicMaterialBundle.components,
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
        mechanismSteps: mechanism?.steps ?? [],
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
                citations: getCitationsByIds(symptom.evidence.citationIds),
              })),
              effects: physiology.effects.map((effect) => ({
                id: effect.id,
                order: effect.order,
                title: effect.title,
                description: effect.description,
                pathwayType: effect.pathwayType,
                anatomicalSystemId: effect.anatomicalSystemId,
                evidence: effect.evidence,
                citations: getCitationsByIds(effect.evidence.citationIds),
              })),
            }
          : null,
        citations: featuredToxin?.citations ?? [],
      },
    ];
  });
};
