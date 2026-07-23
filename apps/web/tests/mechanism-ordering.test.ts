import { describe, expect, it } from 'vitest';
import { atlasSeedData } from '@venom-atlas/domain';
import { sortMechanismSteps } from '../src/features/mechanism/sortMechanism';

describe('mechanism ordering', () => {
  it('sorts by order and preserves evidence links', () => {
    const shuffled = [...atlasSeedData.mechanismSteps].reverse();
    const sorted = sortMechanismSteps(shuffled);

    expect(sorted[0]?.order).toBe(1);
    expect(sorted[0]?.evidence.citationIds.length).toBeGreaterThan(0);
    expect(sorted[sorted.length - 1]?.order).toBe(6);
  });
});
