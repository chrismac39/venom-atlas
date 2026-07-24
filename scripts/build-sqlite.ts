import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { getAllOrganisms, getAllToxins } from '../apps/web/src/lib/content';

const main = async (): Promise<void> => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE organisms (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      scientific_name TEXT NOT NULL,
      common_name TEXT NOT NULL,
      overview TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE toxins (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      display_name TEXT NOT NULL,
      family TEXT
    );
  `);

  const organismInsert = db.prepare(
    'INSERT INTO organisms (id, slug, scientific_name, common_name, overview) VALUES (?, ?, ?, ?, ?)',
  );

  for (const entry of getAllOrganisms()) {
    organismInsert.run([
      entry.organism.id,
      entry.organism.slug ?? entry.organism.id,
      entry.organism.scientificName,
      entry.organism.commonName,
      entry.organism.overview,
    ]);
  }
  organismInsert.free();

  const toxinInsert = db.prepare(
    'INSERT INTO toxins (id, slug, display_name, family) VALUES (?, ?, ?, ?)',
  );

  for (const entry of getAllToxins()) {
    toxinInsert.run([
      entry.toxin.id,
      entry.toxin.slug ?? entry.toxin.id,
      entry.toxin.displayName,
      entry.toxin.family ?? null,
    ]);
  }
  toxinInsert.free();

  const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const dataRoot = path.join(repoRoot, 'apps', 'web', 'public', 'data');
  mkdirSync(dataRoot, { recursive: true });

  const binary = db.export();
  writeFileSync(path.join(dataRoot, 'venom-atlas.sqlite'), Buffer.from(binary));

  db.close();
  console.log('SQLite artifact generated at apps/web/public/data/venom-atlas.sqlite');
};

main().catch((error) => {
  console.error('SQLite build failed', error);
  process.exitCode = 1;
});
