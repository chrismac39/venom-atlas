import { getPublicationReadinessReport } from '../apps/web/src/lib/content';

const organisms = getPublicationReadinessReport();
console.log(JSON.stringify({
  contractVersion: 1,
  notice: 'Automated completeness and traceability checks do not certify scientific accuracy. No human approval gate.',
  eligible: organisms.filter((entry) => entry.eligible).map((entry) => entry.slug),
  draftCount: organisms.filter((entry) => !entry.eligible).length,
  organisms,
}, null, 2));