import { describe, expect, it } from 'vitest';
import { validateDistributionRegistry } from '../../../scripts/geography-registry-validation.js';

const validRegistry = {
  dataset: 'geoBoundaries',
  release: '9469f09',
  records: [{
    speciesId: 'solenopsis-invicta',
    regionId: 'BRA-SP',
    countryCode: 'BRA',
    adminLevel: 1,
    regionName: 'Sao Paulo',
    distributionStatus: 'native',
    evidenceIds: ['ev-solenopsis-invicta-gbif-occurrences'],
    derivation: 'occurrence_point_aggregation',
    confidence: 'moderate',
    sourceRecordCount: 2,
    note: 'Point evidence assigned to the ADM1 feature.',
  }],
};

describe('distribution registry validation', () => {
  it('accepts a complete generated registry fixture', () => {
    expect(() => validateDistributionRegistry(validRegistry)).not.toThrow();
  });

  it('rejects records with unsupported status or incomplete fields', () => {
    expect(() => validateDistributionRegistry({
      ...validRegistry,
      records: [{ ...validRegistry.records[0], distributionStatus: 'possible' }],
    })).toThrow(/Invalid distribution record/);
  });

  it('rejects negative source counts', () => {
    expect(() => validateDistributionRegistry({
      ...validRegistry,
      records: [{ ...validRegistry.records[0], sourceRecordCount: -1 }],
    })).toThrow(/Invalid distribution record/);
  });
});
