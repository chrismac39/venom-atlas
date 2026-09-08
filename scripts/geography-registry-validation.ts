import type {
  DistributionDerivation,
  DistributionStatus,
} from './geography-registry-logic.js';

type DistributionRecord = {
  speciesId: string;
  regionId: string;
  countryCode: string;
  adminLevel: number;
  regionName: string;
  distributionStatus: DistributionStatus;
  evidenceIds: string[];
  derivation: DistributionDerivation;
  confidence: 'moderate' | 'high';
  sourceRecordCount: number;
  note: string;
};

export const validateDistributionRegistry = (data: unknown): void => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid distribution registry: expected an object.');
  }

  const registry = data as { dataset?: unknown; release?: unknown; records?: unknown };
  if (registry.dataset !== 'geoBoundaries' || typeof registry.release !== 'string' || !Array.isArray(registry.records)) {
    throw new Error('Invalid distribution registry metadata or records.');
  }

  for (const [index, record] of registry.records.entries()) {
    if (!record || typeof record !== 'object') {
      throw new Error(`Invalid distribution record at index ${index}.`);
    }
    const candidate = record as Partial<DistributionRecord>;
    if (
      typeof candidate.speciesId !== 'string' ||
      typeof candidate.regionId !== 'string' ||
      typeof candidate.countryCode !== 'string' ||
      candidate.adminLevel !== 1 ||
      typeof candidate.regionName !== 'string' ||
      !['native', 'introduced', 'uncertain', 'recorded_presence'].includes(candidate.distributionStatus ?? '') ||
      !Array.isArray(candidate.evidenceIds) ||
      !candidate.evidenceIds.every((evidenceId) => typeof evidenceId === 'string') ||
      !['occurrence_point_aggregation', 'source_native_admin1', 'source_native_scope_to_admin1', 'curated_source'].includes(candidate.derivation ?? '') ||
      !['moderate', 'high'].includes(candidate.confidence ?? '') ||
      typeof candidate.sourceRecordCount !== 'number' ||
      candidate.sourceRecordCount < 0 ||
      typeof candidate.note !== 'string'
    ) {
      throw new Error(`Invalid distribution record at index ${index}.`);
    }
  }
};
