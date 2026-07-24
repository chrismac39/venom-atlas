import { describe, expect, it } from 'vitest';
import { pickPreferred2dAsset, pickPreferred3dAsset } from '../src/lib/structure-assets';

describe('structure asset selection', () => {
  it('selects a deterministic preferred 3d asset by format rank then id', () => {
    const picked = pickPreferred3dAsset([
      {
        id: 'b-mol2',
        molecularEntityId: 'm1',
        localPath: '/structures/model.mol2',
        format: 'mol2',
        verified: true,
      },
      {
        id: 'a-sdf',
        molecularEntityId: 'm1',
        localPath: '/structures/model.sdf',
        format: 'sdf',
        verified: true,
      },
      {
        id: 'c-mol',
        molecularEntityId: 'm1',
        localPath: '/structures/model.mol',
        format: 'mol',
        verified: true,
      },
    ]);

    expect(picked?.id).toBe('a-sdf');
  });

  it('selects only verified svg for 2d asset', () => {
    const picked = pickPreferred2dAsset([
      {
        id: 'unverified-svg',
        molecularEntityId: 'm1',
        localPath: '/images/model-unverified.svg',
        format: 'svg',
        verified: false,
      },
      {
        id: 'verified-svg',
        molecularEntityId: 'm1',
        localPath: '/images/model.svg',
        format: 'svg',
        verified: true,
      },
    ]);

    expect(picked?.id).toBe('verified-svg');
  });
});
