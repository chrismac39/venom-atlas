import { env } from '../config/env';
import { getClickHouseClient } from '../db/clickhouse';
import { ClickHouseAtlasRepository } from '../repositories/clickhouseRepository';
import { MockAtlasRepository } from '../repositories/mockRepository';
import type { AtlasRepository } from '../repositories/types';

export const createRepository = (): AtlasRepository => {
  if (env.API_DATA_MODE === 'mock') {
    return new MockAtlasRepository();
  }

  return new ClickHouseAtlasRepository(getClickHouseClient());
};
