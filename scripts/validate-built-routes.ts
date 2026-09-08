import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllRoutes } from '../apps/web/src/lib/content';
import { compareBuiltRoutes } from '../apps/web/src/lib/content-routes';

const dist = fileURLToPath(new URL('../apps/web/dist/', import.meta.url));
const htmlFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
});
const built = htmlFiles(dist).map((file) => {
  const relative = path.relative(dist, file).replace(/\\/g, '/');
  return `/${relative.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '').replace(/\/$/, '')}`;
});
const comparison = compareBuiltRoutes(getAllRoutes(), built);
if (Object.values(comparison).some((entries) => entries.length)) {
  throw new Error(`Built route inventory mismatch: ${JSON.stringify(comparison, null, 2)}`);
}
console.log(`Built route validation passed (${built.length} HTML routes, including aliases and 404).`);