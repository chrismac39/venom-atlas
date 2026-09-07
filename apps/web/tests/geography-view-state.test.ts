import { describe, expect, it } from 'vitest';
import { hasSpeciesSpecificEvidence } from '../src/visualizations/maps/geography-view-state';

describe('geography view state', () => {
  it('shows species evidence when registry records exist', () => {
    expect(hasSpeciesSpecificEvidence({ registryRecordCount: 1, mappedRangeCount: 0 })).toBe(true);
  });

  it('shows species evidence when curated range assets exist', () => {
    expect(hasSpeciesSpecificEvidence({ registryRecordCount: 0, mappedRangeCount: 1 })).toBe(true);
  });

  it('allows a neutral map with an explicit no-evidence state', () => {
    expect(hasSpeciesSpecificEvidence({ registryRecordCount: 0, mappedRangeCount: 0 })).toBe(false);
  });
});
