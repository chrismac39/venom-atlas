import type { FastifyInstance } from 'fastify';

export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error, request, reply) => {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    request.log.error(error);
    reply.status(500).send({
      error: {
        message,
      },
    });
  });
};
