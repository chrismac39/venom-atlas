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

  const toxicMaterial = getToxicMaterialByOrganismSlug(slug);
  if (toxicMaterial?.toxicMaterial.slug) {
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
for (const toxinBundle of getAllToxins()) {
  const slug = toxinBundle.toxin.slug;
  if (!slug) {
    fail(`Toxin missing slug: ${toxinBundle.toxin.id}`);
  }

  if (toxinSlugs.has(slug)) {
    fail(`Duplicate toxin slug: ${slug}`);
  }
  toxinSlugs.add(slug);

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
