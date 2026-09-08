// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildIngestionImpactReport, type IngestionStageResult } from '../../../scripts/ingestion-pipeline';

const passedStages: IngestionStageResult[] = [
  'discover', 'retrieve_cache', 'extract', 'summarize', 'validate', 'readiness',
].map((stage) => ({ stage: stage as IngestionStageResult['stage'], status: 'passed', detail: 'ok' }));

describe('ingestion publication gate', () => {
  it('publishes only when extraction, validation, and four-section readiness pass', () => {
    const passed = buildIngestionImpactReport({
      subjects: ['organism'], identifiers: ['pmid:1'], claims: [{ id: 'claim', status: 'passed' }],
      stages: passedStages, readinessBySubject: { organism: true }, publishRequested: true,
    });
    expect(passed.publication).toEqual(expect.objectContaining({ allowed: true, performed: true }));

    const blocked = buildIngestionImpactReport({
      subjects: ['organism'], identifiers: ['pmid:1'], claims: [{ id: 'claim', status: 'quarantined' }],
      stages: passedStages, readinessBySubject: { organism: true }, publishRequested: true,
    });
    expect(blocked.publication).toEqual(expect.objectContaining({ allowed: false, performed: false }));
  });
});