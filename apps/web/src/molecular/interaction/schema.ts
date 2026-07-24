import { z } from 'zod';

export const interactionResidueRefSchema = z.object({
  chain: z.string().min(1),
  residueName: z.string().min(1),
  residueNumber: z.number().int(),
});

export const structureInteractionAnnotationSchema = z.object({
  id: z.string(),
  label: z.string(),
  target: z.object({
    name: z.string(),
    structureId: z.string(),
    chains: z.array(z.string().min(1)).min(1),
  }),
  venomComponent: z.object({
    name: z.string(),
    chains: z.array(z.string().min(1)).min(1),
  }),
  evidence: z.object({
    level: z.enum(['experimental', 'computed', 'illustrative']),
    source: z.string(),
    notes: z.string().optional(),
  }),
  ions: z
    .array(
      z.object({
        element: z.string().min(1),
        chain: z.string().min(1).optional(),
        residueNumber: z.number().int().optional(),
        label: z.string().optional(),
      }),
    )
    .optional(),
  interactions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['hydrogen_bond', 'ionic', 'hydrophobic', 'contact', 'other']),
      toxinResidue: interactionResidueRefSchema,
      targetResidue: interactionResidueRefSchema,
      distanceAngstroms: z.number().positive().optional(),
      evidenceNote: z.string().optional(),
    }),
  ),
  cameraPresets: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
      selection: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  electrostaticPotential: z
    .object({
      localPath: z.string(),
      format: z.enum(['dx', 'cube']),
      notes: z.string().optional(),
    })
    .optional(),
});

export type StructureInteractionAnnotation = z.infer<typeof structureInteractionAnnotationSchema>;
