import path from 'node:path';
import { closeClickHouseClient } from './clickhouse';
import { executeSqlDirectory } from './sqlRunner';

const main = async (): Promise<void> => {
  const migrationsPath = path.resolve(process.cwd(), '../../database/migrations');
  await executeSqlDirectory(migrationsPath);
  console.log('Migrations complete.');
};

main()
  .catch((error) => {
    console.error('Migration failure', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeClickHouseClient();
  });
