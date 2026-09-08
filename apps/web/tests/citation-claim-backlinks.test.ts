// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getPublicClaimReferencesByCitationId } from '../src/lib/content';

describe('citation claim backlinks', () => {
  it('indexes published molecular and clinical assertions by stable claim anchor', () => {
    const molecular = getPublicClaimReferencesByCitationId('cit-pubchem-solenopsin-a');
    expect(molecular).toEqual(expect.arrayContaining([
      expect.objectContaining({ assertionId: 'claim-solenopsin-a-molecular-weight', route: '/toxins/solenopsin-a#claim-solenopsin-a-molecular-weight' }),
    ]));

    const clinical = getPublicClaimReferencesByCitationId('cit-ncbi-fire-ant-bites');
    expect(clinical).toEqual(expect.arrayContaining([
      expect.objectContaining({ assertionId: 'claim-fire-ant-systemic-allergy', route: '/atlas/solenopsis-invicta#claim-fire-ant-systemic-allergy' }),
    ]));
  });
});