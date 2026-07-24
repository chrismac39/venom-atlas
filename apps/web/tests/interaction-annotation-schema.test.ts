import { describe, expect, it } from 'vitest';
import { structureInteractionAnnotationSchema } from '../src/molecular/interaction/schema';

describe('structure interaction annotation schema', () => {
  it('accepts valid annotation payloads', () => {
    const parsed = structureInteractionAnnotationSchema.parse({
      id: 'iv-1',
      label: 'Demo interaction',
      target: {
        name: 'Voltage-gated sodium channel',
        structureId: 'PDB:demo',
        chains: ['A'],
      },
      venomComponent: {
        name: 'Demo toxin',
        chains: ['T'],
      },
      evidence: {
        level: 'illustrative',
        source: 'unit-test fixture',
      },
      interactions: [
        {
          id: 'int-1',
          type: 'ionic',
          toxinResidue: {
            chain: 'T',
            residueName: 'ARG',
            residueNumber: 12,
          },
          targetResidue: {
            chain: 'A',
            residueName: 'GLU',
            residueNumber: 818,
          },
          distanceAngstroms: 3.2,
        },
      ],
      cameraPresets: [
        {
          id: 'full',
          label: 'Full complex',
          selection: {},
        },
      ],
    });

    expect(parsed.id).toBe('iv-1');
    expect(parsed.interactions[0]?.type).toBe('ionic');
  });

  it('rejects invalid evidence levels', () => {
    const result = structureInteractionAnnotationSchema.safeParse({
      id: 'iv-1',
      label: 'Demo interaction',
      target: {
        name: 'Voltage-gated sodium channel',
        structureId: 'PDB:demo',
        chains: ['A'],
      },
      venomComponent: {
        name: 'Demo toxin',
        chains: ['T'],
      },
      evidence: {
        level: 'unknown',
        source: 'unit-test fixture',
      },
      interactions: [],
      cameraPresets: [],
    });

    expect(result.success).toBe(false);
  });
});
