import type { AtlasOrganismData } from '../islands/AtlasMonopageIsland';
import {
  getAllOrganisms,
  getAllToxins,
  getCitationsByIds,
  getGeographyByOrganismSlug,
  getMechanismByToxinSlug,
  getPhysiologyByToxinSlug,
  getVenomByOrganismSlug,
} from './content';
import { pickPreferred2dAsset, pickPreferred3dAsset } from './structure-assets';

export const buildAtlasMonopageOrganisms = (): AtlasOrganismData[] => {
  const toxins = getAllToxins();

  return getAllOrganisms().flatMap((entry) => {
    const organismSlug = entry.organism.slug ?? entry.organism.id.replace(/^org-/, '');
    if (!organismSlug) {
      return [];
    }

    const venomBundle = getVenomByOrganismSlug(organismSlug);
    const venomSlug = venomBundle?.venom.slug ?? venomBundle?.venom.id.replace(/^ven-/, '');
    const relatedToxins = venomBundle
      ? toxins.filter((toxinEntry) => toxinEntry.toxin.venomId === `ven-${venomBundle.venom.slug}`)
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

    const primaryToxin = mappedToxins[0];
    const primaryToxinSlug = primaryToxin?.slug;
    const mechanism = primaryToxinSlug ? getMechanismByToxinSlug(primaryToxinSlug) : undefined;
    const physiology = primaryToxinSlug ? getPhysiologyByToxinSlug(primaryToxinSlug) : undefined;
    const geography = getGeographyByOrganismSlug(organismSlug);

    if (venomBundle && !venomSlug) {
      return [];
    }

    if (relatedToxins[0] && !primaryToxinSlug) {
      return [];
    }

    return [
      {
        slug: organismSlug,
        scientificName: entry.organism.scientificName,
        commonName: entry.organism.commonName,
        overview: entry.organism.overview,
        taxonomy: entry.taxonomy,
        naturalHistory: entry.organism.naturalHistory,
        externalProfile: entry.externalProfile,
        deliveryMechanism: entry.deliveryMechanism,
        habitats: entry.habitats,
        ecologicalRoles: entry.ecologicalRoles,
        geographyRanges:
          geography?.ranges.map((range) => ({
            id: range.id,
            layerType: range.layerType,
            summary: range.summary,
          })) ?? [],
        venom: venomBundle
          ? {
              slug: venomSlug as string,
              name: venomBundle.venom.name,
              description: venomBundle.venom.description,
              ecologicalRoleSummary: venomBundle.venom.ecologicalRoleSummary,
              evidence: venomBundle.venom.evidence,
              components: venomBundle.components,
            }
          : null,
        toxins: mappedToxins,
        primaryToxin: primaryToxin
          ? {
              slug: primaryToxin.slug,
              displayName: primaryToxin.displayName,
              molecularClass: primaryToxin.molecularClass,
              formula: primaryToxin.formula,
              molecularWeight: primaryToxin.molecularWeight,
              structureDataSource: primaryToxin.structureDataSource,
              evidence: primaryToxin.evidence,
              ...(primaryToxin.structure3dUrl ? { structureUrl: primaryToxin.structure3dUrl } : {}),
              ...(primaryToxin.structure3dFormat ? { structureFormat: primaryToxin.structure3dFormat } : {}),
            }
          : null,
        mechanismSteps: mechanism?.steps ?? [],
        physiology: physiology
          ? {
              symptoms: physiology.symptoms.map((symptom) => ({
                id: symptom.id,
                name: symptom.name,
                description: symptom.description,
              })),
              effects: physiology.effects.map((effect) => ({
                id: effect.id,
                order: effect.order,
                title: effect.title,
                description: effect.description,
                pathwayType: effect.pathwayType,
              })),
            }
          : null,
        citations: primaryToxin?.citations ?? [],
      },
    ];
  });
};
