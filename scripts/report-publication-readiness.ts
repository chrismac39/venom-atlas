import { getContentRecords, getPublicationReadinessReport } from '../apps/web/src/lib/content';

const organisms = getPublicationReadinessReport();
const content = getContentRecords();
const assertionCoverage = content.organisms.map((organism) => {
  const materialIds = content.toxicMaterials.filter((entry) => entry.organismSlug === organism.slug).map((entry) => entry.id);
  const chemistry = content.toxins
    .filter((entry) => materialIds.includes(entry.toxicMaterialId))
    .flatMap((entry) => entry.molecularEntity.assertions ?? []);
  const medicalEffects = content.physiology
    .filter((entry) => entry.subject.kind === 'organism_exposure' && entry.subject.slug === organism.slug)
    .flatMap((entry) => entry.effects.flatMap((effect) => effect.assertions ?? []));
  const summarize = (assertions: typeof chemistry) => ({
    claims: assertions.map((assertion) => ({ id: assertion.id, status: assertion.validation.status })),
    counts: {
      total: assertions.length,
      passed: assertions.filter((assertion) => assertion.validation.status === 'passed').length,
      failed: assertions.filter((assertion) => assertion.validation.status === 'failed').length,
      quarantined: assertions.filter((assertion) => assertion.validation.status === 'quarantined').length,
    },
  });
  return { slug: organism.slug, sections: { chemistry: summarize(chemistry), 'medical-effects': summarize(medicalEffects) } };
});

console.log(JSON.stringify({
  contractVersion: 2,
  notice: 'Automated completeness and traceability checks do not certify scientific accuracy. No human approval gate.',
  eligible: organisms.filter((entry) => entry.eligible).map((entry) => entry.slug),
  draftCount: organisms.filter((entry) => !entry.eligible).length,
  organisms,
  assertionCoverage,
}, null, 2));