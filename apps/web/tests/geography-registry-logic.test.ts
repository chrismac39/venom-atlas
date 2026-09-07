import { describe, expect, it } from 'vitest';
import {
  classifyOccurrenceStatus,
  mergeEvidenceIds,
} from '../../../scripts/geography-registry-logic.js';

describe('geography registry evidence semantics', () => {
  it('classifies native-country occurrence evidence as native', () => {
    expect(classifyOccurrenceStatus({ isNativeEvidence: true })).toBe('native');
  });

  it('classifies an otherwise unsupported occurrence as recorded presence', () => {
    expect(classifyOccurrenceStatus({ isNativeEvidence: false })).toBe('recorded_presence');
  });

  it('preserves an existing introduced or uncertain status', () => {
    expect(classifyOccurrenceStatus({
      isNativeEvidence: false,
      existingStatus: 'introduced',
      existingDerivation: 'occurrence_point_aggregation',
    })).toBe('introduced');
    expect(classifyOccurrenceStatus({
      isNativeEvidence: false,
      existingStatus: 'uncertain',
      existingDerivation: 'occurrence_point_aggregation',
    })).toBe('uncertain');
  });

  it('preserves curated source status over point-derived native evidence', () => {
    expect(classifyOccurrenceStatus({
      isNativeEvidence: true,
      existingStatus: 'introduced',
      existingDerivation: 'curated_source',
    })).toBe('introduced');
  });

  it('deduplicates evidence IDs while preserving insertion order', () => {
    expect(mergeEvidenceIds(['native-range', 'gbif'], 'gbif', ['citation'])).toEqual([
      'native-range',
      'gbif',
      'citation',
    ]);
  });
});
