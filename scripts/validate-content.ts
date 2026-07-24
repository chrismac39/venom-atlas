import {
  getAllOrganisms,
  getAllRoutes,
  getAllToxins,
  getGeographyByOrganismSlug,
  getMechanismByToxinSlug,
  getPhysiologyByToxinSlug,
  getVenomByOrganismSlug,
} from '../apps/web/src/lib/content';

const fail = (message: string): never => {
  throw new Error(message);
};

const organismSlugs = new Set<string>();
for (const organismBundle of getAllOrganisms()) {
  const slug = organismBundle.organism.slug;
  if (!slug) {
    fail(`Organism missing slug: ${organismBundle.organism.id}`);
  }
  if (organismSlugs.has(slug)) {
    fail(`Duplicate organism slug: ${slug}`);
  }
  organismSlugs.add(slug);

  if (!getVenomByOrganismSlug(slug)) {
    fail(`Missing venom for organism slug: ${slug}`);
  }

  if (!getGeographyByOrganismSlug(slug)) {
    fail(`Missing geography for organism slug: ${slug}`);
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

  if (!getMechanismByToxinSlug(slug)) {
    fail(`Missing mechanism record for toxin slug: ${slug}`);
  }

  if (!getPhysiologyByToxinSlug(slug)) {
    fail(`Missing physiology record for toxin slug: ${slug}`);
  }
}

const routes = getAllRoutes();
const uniqueRoutes = new Set(routes);
if (uniqueRoutes.size !== routes.length) {
  fail('Generated route collision detected in static route plan.');
}

console.log(`Content validation passed (${routes.length} routes).`);
