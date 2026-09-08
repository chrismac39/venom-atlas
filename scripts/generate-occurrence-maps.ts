import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFeatureCollection } from './geography-asset-validation.js';

interface OccurrenceCollection {
  metadata: { sourceUrl: string; note: string };
  features: Array<{ geometry: { type: 'Point'; coordinates: [number, number] } }>;
}

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const geographyRoot = path.join(repoRoot, 'apps', 'web', 'public', 'geography');

for (const fileName of ['solenopsis-invicta', 'phyllobates-terribilis', 'oxyuranus-microlepidotus', 'synanceia-verrucosa', 'ornithorhynchus-anatinus']) {
  const inputPath = path.join(geographyRoot, `${fileName}-occurrences.geojson`);
  const collection = JSON.parse(readFileSync(inputPath, 'utf8')) as OccurrenceCollection;
  validateFeatureCollection({
    assetPath: inputPath,
    data: collection,
    allowedGeometryTypes: ['Point'],
    requireSourceMetadata: true,
  });
  console.log(`[generate-occurrence-maps] ${fileName}: ${collection.features.length} points`);
}
