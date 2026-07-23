import { env } from './config/env';
import { buildApp } from './app';

const app = buildApp();

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
    console.log(`API listening on ${env.API_PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
