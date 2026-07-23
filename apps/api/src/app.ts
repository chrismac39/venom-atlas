import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { createRepository } from './services/repositoryFactory';
import { registerAtlasRoutes } from './routes/atlasRoutes';
import { registerErrorHandler } from './plugins/errorHandler';
import type { AtlasRepository } from './repositories/types';

export const buildApp = (repositoryArg?: AtlasRepository): FastifyInstance => {
  const app = Fastify({ logger: false });
  const repository = repositoryArg ?? createRepository();

  // Web UI runs on a separate origin during local development.
  app.register(cors, { origin: true });

  registerAtlasRoutes(app, repository);
  registerErrorHandler(app);

  return app;
};
