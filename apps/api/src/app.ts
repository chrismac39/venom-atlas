import Fastify, { type FastifyInstance } from 'fastify';
import { createRepository } from './services/repositoryFactory';
import { registerAtlasRoutes } from './routes/atlasRoutes';
import { registerErrorHandler } from './plugins/errorHandler';
import type { AtlasRepository } from './repositories/types';

export const buildApp = (repositoryArg?: AtlasRepository): FastifyInstance => {
  const app = Fastify({ logger: false });
  const repository = repositoryArg ?? createRepository();

  registerAtlasRoutes(app, repository);
  registerErrorHandler(app);

  return app;
};
