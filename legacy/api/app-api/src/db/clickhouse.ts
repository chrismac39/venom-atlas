import { createClient, type ClickHouseClient } from '@clickhouse/client';
import { env } from '../config/env';

let clickhouseClient: ClickHouseClient | null = null;

export const getClickHouseClient = (): ClickHouseClient => {
  if (!clickhouseClient) {
    clickhouseClient = createClient({
      url: env.CLICKHOUSE_URL,
      username: env.CLICKHOUSE_USERNAME,
      password: env.CLICKHOUSE_PASSWORD,
      request_timeout: 30_000,
    });
  }
  return clickhouseClient;
};

export const closeClickHouseClient = async (): Promise<void> => {
  if (clickhouseClient) {
    await clickhouseClient.close();
    clickhouseClient = null;
  }
};
