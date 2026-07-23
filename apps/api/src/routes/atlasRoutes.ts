import {
  citationSchema,
  geographicRangeSchema,
  mechanismStepSchema,
  molecularStructureAssetSchema,
  organismSchema,
  physiologicalEffectSchema,
  toxinSchema,
  venomSchema,
} from '@venom-atlas/schemas';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../services/apiEnvelope';
import type { AtlasRepository } from '../repositories/types';

const idParamSchema = z.object({
  organismId: z.string().min(1).optional(),
  venomId: z.string().min(1).optional(),
  toxinId: z.string().min(1).optional(),
  citationId: z.string().min(1).optional(),
});

const notFound = (entity: string): { error: { message: string } } => ({
  error: { message: `${entity} not found` },
});

const envelope = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    data: schema,
    meta: z
      .object({
        generatedAt: z.string(),
      })
      .optional(),
  });

export const registerAtlasRoutes = (app: FastifyInstance, repository: AtlasRepository): void => {
  app.get('/health', async (_request, reply) => {
    const health = await repository.health();
    return reply.send(ok(health));
  });

  app.get('/api/organisms', async (_request, reply) => {
    const organisms = await repository.listOrganisms();
    const payload = ok(organisms);
    envelope(z.array(organismSchema)).parse(payload);
    return reply.send(payload);
  });

  app.get('/api/organisms/:organismId', async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const organism = await repository.getOrganism(params.organismId as string);
    if (!organism) {
      return reply.status(404).send(notFound('Organism'));
    }

    const payload = ok(organism);
    return reply.send(payload);
  });

  app.get('/api/organisms/:organismId/venoms', async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const venoms = await repository.getOrganismVenoms(params.organismId as string);
    const payload = ok(venoms);
    envelope(z.array(venomSchema)).parse(payload);
    return reply.send(payload);
  });

  app.get('/api/venoms/:venomId', async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const venom = await repository.getVenom(params.venomId as string);
    if (!venom) {
      return reply.status(404).send(notFound('Venom'));
    }
    const payload = ok(venom);
    return reply.send(payload);
  });

  app.get('/api/toxins/:toxinId', async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const toxin = await repository.getToxin(params.toxinId as string);
    if (!toxin) {
      return reply.status(404).send(notFound('Toxin'));
    }
    const payload = ok(toxin);
    envelope(
      z.object({
        toxin: toxinSchema,
        molecularEntity: z.unknown().nullable(),
        structureAssets: z.array(molecularStructureAssetSchema),
        targets: z.array(z.unknown()),
      }),
    ).parse(payload);
    return reply.send(payload);
  });

  app.get('/api/toxins/:toxinId/structure', async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const structure = await repository.getToxinStructure(params.toxinId as string);
    if (structure === null) {
      return reply.status(404).send(notFound('Toxin'));
    }
    const payload = ok(structure);
    envelope(z.array(molecularStructureAssetSchema)).parse(payload);
    return reply.send(payload);
  });

  app.get('/api/toxins/:toxinId/mechanism', async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const mechanism = await repository.getToxinMechanism(params.toxinId as string);
    if (!mechanism) {
      return reply.status(404).send(notFound('Toxin mechanism'));
    }
    const payload = ok(mechanism);
    envelope(
      z.object({
        toxin: toxinSchema,
        mechanismSteps: z.array(mechanismStepSchema),
        targets: z.array(z.unknown()),
      }),
    ).parse(payload);
    return reply.send(payload);
  });

  app.get('/api/toxins/:toxinId/physiology', async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const physiology = await repository.getToxinPhysiology(params.toxinId as string);
    if (!physiology) {
      return reply.status(404).send(notFound('Toxin physiology'));
    }
    const payload = ok(physiology);
    envelope(
      z.object({
        toxin: toxinSchema,
        physiologicalEffects: z.array(physiologicalEffectSchema),
        anatomicalSystems: z.array(z.unknown()),
      }),
    ).parse(payload);
    return reply.send(payload);
  });

  app.get('/api/organisms/:organismId/range', async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const range = await repository.getOrganismRange(params.organismId as string);
    const payload = ok(range);
    envelope(z.array(geographicRangeSchema)).parse(payload);
    return reply.send(payload);
  });

  app.get('/api/citations/:citationId', async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const citation = await repository.getCitation(params.citationId as string);
    if (!citation) {
      return reply.status(404).send(notFound('Citation'));
    }
    const payload = ok(citation);
    envelope(citationSchema).parse(payload);
    return reply.send(payload);
  });
};
