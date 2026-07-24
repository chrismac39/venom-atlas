import {
  getAllOrganisms,
  getAllToxins,
  getCitationById,
  getGeographyByOrganismSlug,
  getMechanismByToxinSlug,
  getPhysiologyByToxinSlug,
  getVenomByOrganismSlug,
} from '../apps/web/src/lib/content';

const fail = (message: string): never => {
  throw new Error(message);
};

const allCitationIds = new Set<string>();

for (const organismBundle of getAllOrganisms()) {
  organismBundle.organism.evidence.citationIds.forEach((id) => allCitationIds.add(id));
  organismBundle.habitats.forEach((entry) => entry.evidence.citationIds.forEach((id) => allCitationIds.add(id)));
  organismBundle.ecologicalRoles.forEach((entry) => entry.evidence.citationIds.forEach((id) => allCitationIds.add(id)));

  const venomBundle = getVenomByOrganismSlug(organismBundle.organism.slug ?? '');
  venomBundle?.venom.evidence.citationIds.forEach((id) => allCitationIds.add(id));
  venomBundle?.components.forEach((entry) => entry.evidence.citationIds.forEach((id) => allCitationIds.add(id)));

  const geographyBundle = getGeographyByOrganismSlug(organismBundle.organism.slug ?? '');
  geographyBundle?.ranges.forEach((entry) => entry.evidence.citationIds.forEach((id) => allCitationIds.add(id)));
}

for (const toxinBundle of getAllToxins()) {
  toxinBundle.toxin.evidence.citationIds.forEach((id) => allCitationIds.add(id));
  toxinBundle.molecularEntity.evidence.citationIds.forEach((id) => allCitationIds.add(id));
  toxinBundle.targets.forEach((entry) => entry.evidence.citationIds.forEach((id) => allCitationIds.add(id)));

  const mechanism = getMechanismByToxinSlug(toxinBundle.toxin.slug ?? '');
  mechanism?.steps.forEach((entry) => entry.evidence.citationIds.forEach((id) => allCitationIds.add(id)));

  const physiology = getPhysiologyByToxinSlug(toxinBundle.toxin.slug ?? '');
  physiology?.effects.forEach((entry) => entry.evidence.citationIds.forEach((id) => allCitationIds.add(id)));
  physiology?.symptoms.forEach((entry) => entry.evidence.citationIds.forEach((id) => allCitationIds.add(id)));
}

const missing: string[] = [];
for (const citationId of allCitationIds) {
  if (!getCitationById(citationId)) {
    missing.push(citationId);
  }
}

if (missing.length > 0) {
  fail(`Missing citation IDs: ${missing.join(', ')}`);
}

console.log(`Citation validation passed (${allCitationIds.size} references).`);
