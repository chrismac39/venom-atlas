import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  API_PORT: z.coerce.number().default(3001),
  CLICKHOUSE_URL: z.string().url().default('http://localhost:38123'),
  CLICKHOUSE_DATABASE: z.string().default('venom_atlas'),
  CLICKHOUSE_USERNAME: z.string().default('default'),
  CLICKHOUSE_PASSWORD: z.string().default(''),
  API_DATA_MODE: z.enum(['clickhouse', 'mock']).default('clickhouse'),
});

export const env = envSchema.parse(process.env);
