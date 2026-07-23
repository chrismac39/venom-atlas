import { describe, expect, it } from 'vitest';
import { pickMolecularRenderer } from '../src/molecular/adapters/selectRenderer';
import type { MolecularRepresentation } from '@venom-atlas/visualization-contracts';

const baseModel = {
  entityId: 'entity-1',
  displayName: 'Model',
  defaultRepresentation: 'stick' as const,
  supportedRepresentations: ['stick'] as MolecularRepresentation[],
  annotations: [],
};

describe('molecular renderer selection', () => {
  it('selects 3Dmol for small molecules with structure assets', () => {
    const renderer = pickMolecularRenderer({
      ...baseModel,
      molecularClass: 'small_molecule',
      structureFormat: 'sdf',
      structureUrl: '/structures/small.sdf',
    });
    expect(renderer?.rendererId).toBe('3dmol');
  });

  it('selects Mol* boundary for protein and complex classes', () => {
    const renderer = pickMolecularRenderer({
      ...baseModel,
      molecularClass: 'protein',
      structureFormat: 'pdb',
      structureUrl: '/structures/protein.pdb',
    });
    expect(renderer?.rendererId).toBe('molstar-boundary');
  });

  it('returns fallback null for unsupported model', () => {
    const renderer = pickMolecularRenderer({
      ...baseModel,
      molecularClass: 'small_molecule',
      structureFormat: 'sdf',
      structureUrl: undefined,
    });
    expect(renderer).toBeNull();
  });
});
