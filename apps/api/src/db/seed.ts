import path from 'node:path';
import { closeClickHouseClient } from './clickhouse';
import { executeSqlDirectory } from './sqlRunner';

const main = async (): Promise<void> => {
  const seedsPath = path.resolve(process.cwd(), '../../database/seeds');
  await executeSqlDirectory(seedsPath);
  console.log('Seed complete.');
};

main()
  .catch((error) => {
    console.error('Seed failure', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeClickHouseClient();
  });
