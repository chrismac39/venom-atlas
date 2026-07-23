import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { getClickHouseClient } from './clickhouse';

const splitStatements = (sql: string): string[] =>
  sql
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

export const executeSqlDirectory = async (dirPath: string): Promise<void> => {
  const client = getClickHouseClient();
  const files = readdirSync(dirPath)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const content = readFileSync(path.join(dirPath, file), 'utf-8');
    const statements = splitStatements(content);
    for (const statement of statements) {
      await client.command({ query: statement });
    }
  }
};
