export interface IngestionStageResult {
  stage: 'discover' | 'retrieve_cache' | 'extract' | 'summarize' | 'validate' | 'readiness';
  status: 'passed' | 'quarantined' | 'failed';
  detail: string;
}

export interface IngestionImpactReport {
  pipelineVersion: 1;
  subjects: string[];
  identifiers: string[];
  claims: Array<{ id: string; status: 'passed' | 'quarantined' }>;
  stages: IngestionStageResult[];
  publication: { allowed: boolean; requested: boolean; performed: boolean; reason: string };
}

export const buildIngestionImpactReport = (input: {
  subjects: string[];
  identifiers: string[];
  claims: Array<{ id: string; status: 'passed' | 'quarantined' }>;
  stages: IngestionStageResult[];
  readinessBySubject: Record<string, boolean>;
  publishRequested: boolean;
}): IngestionImpactReport => {
  const stagesPassed = input.stages.every((stage) => stage.status === 'passed');
  const claimsPassed = input.claims.every((claim) => claim.status === 'passed');
  const subjectsReady = input.subjects.every((subject) => input.readinessBySubject[subject] === true);
  const allowed = stagesPassed && claimsPassed && subjectsReady;
  return {
    pipelineVersion: 1,
    subjects: [...input.subjects].sort(), identifiers: [...input.identifiers].sort(),
    claims: [...input.claims].sort((left, right) => left.id.localeCompare(right.id)), stages: input.stages,
    publication: {
      allowed, requested: input.publishRequested, performed: allowed && input.publishRequested,
      reason: allowed ? (input.publishRequested ? 'All ingestion and readiness gates passed.' : 'All gates passed; publication was not requested.') : 'Publication blocked by ingestion or readiness failure.',
    },
  };
};