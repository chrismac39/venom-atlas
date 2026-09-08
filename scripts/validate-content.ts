import {
  getAllOrganisms,
  getAllMechanisms,
  getAllPhysiology,
  getAllRoutes,
  getAllToxins,
  getGeographyByOrganismSlug,
  getMechanismByOrganismExposureSlug,
  getPhysiologyByOrganismExposureSlug,
  getToxicMaterialByOrganismSlug,
} from '../apps/web/src/lib/content';

const fail = (message: string): never => {
  throw new Error(message);
};

const organismSlugs = new Set<string>();
const organismIds = new Set<string>();
const toxicMaterialIds = new Set<string>();
const toxicMaterialSlugs = new Set<string>();
for (const organismBundle of getAllOrganisms()) {
  const slug = organismBundle.organism.slug;
  if (!slug) {
    fail(`Organism missing slug: ${organismBundle.organism.id}`);
  }
  if (organismSlugs.has(slug)) {
    fail(`Duplicate organism slug: ${slug}`);
  }
  organismSlugs.add(slug);
  if (organismIds.has(organismBundle.organism.id)) {
    fail(`Duplicate organism ID: ${organismBundle.organism.id}`);
  }
  organismIds.add(organismBundle.organism.id);

  const toxicMaterial = getToxicMaterialByOrganismSlug(slug);
  if (toxicMaterial) {
    if (toxicMaterial.toxicMaterial.organismId !== organismBundle.organism.id) {
      fail(`Toxic material is linked to the wrong organism: ${toxicMaterial.toxicMaterial.id}`);
    }
    if (toxicMaterialIds.has(toxicMaterial.toxicMaterial.id)) {
      fail(`Duplicate toxic material ID: ${toxicMaterial.toxicMaterial.id}`);
    }
    toxicMaterialIds.add(toxicMaterial.toxicMaterial.id);
    if (toxicMaterialSlugs.has(toxicMaterial.toxicMaterial.slug)) {
      fail(`Duplicate toxic material slug: ${toxicMaterial.toxicMaterial.slug}`);
    }
    toxicMaterialSlugs.add(toxicMaterial.toxicMaterial.slug);
  }
  if (toxicMaterial?.toxicMaterial.featuredToxinSlug && !getAllToxins().some((toxin) => {
    return toxin.toxin.slug === toxicMaterial.toxicMaterial.featuredToxinSlug
      && toxin.toxin.toxicMaterialId === toxicMaterial.toxicMaterial.id;
  })) {
    fail(
      `Featured toxin is not linked to toxic material ${toxicMaterial.toxicMaterial.slug}: ${toxicMaterial.toxicMaterial.featuredToxinSlug}`,
    );
  }

}

const toxinSlugs = new Set<string>();
const toxinIds = new Set<string>();
for (const toxinBundle of getAllToxins()) {
  const slug = toxinBundle.toxin.slug;
  if (!slug) {
    fail(`Toxin missing slug: ${toxinBundle.toxin.id}`);
  }

  if (toxinSlugs.has(slug)) {
    fail(`Duplicate toxin slug: ${slug}`);
  }
  toxinSlugs.add(slug);
  if (toxinIds.has(toxinBundle.toxin.id)) {
    fail(`Duplicate toxin ID: ${toxinBundle.toxin.id}`);
  }
  toxinIds.add(toxinBundle.toxin.id);
  if (!toxicMaterialIds.has(toxinBundle.toxin.toxicMaterialId)) {
    fail(`Toxin references unknown toxic material: ${toxinBundle.toxin.id}`);
  }

}

for (const record of [...getAllMechanisms(), ...getAllPhysiology()]) {
  if (record.subject.kind === 'organism_exposure' && !organismSlugs.has(record.subject.slug)) {
    fail(`Unknown organism exposure subject: ${record.subject.slug}`);
  }
  if (record.subject.kind === 'isolated_compound' && !toxinSlugs.has(record.subject.slug)) {
    fail(`Unknown isolated compound subject: ${record.subject.slug}`);
  }
  if (record.subject.kind === 'whole_material' && !toxicMaterialSlugs.has(record.subject.slug)) {
    fail(`Unknown whole material subject: ${record.subject.slug}`);
  }
}

const routes = getAllRoutes();
const uniqueRoutes = new Set(routes);
if (uniqueRoutes.size !== routes.length) {
  fail('Generated route collision detected in static route plan.');
}

console.log(`Content validation passed (${routes.length} routes).`);
