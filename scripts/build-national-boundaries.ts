




import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type NationalFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{ geometry?: { type?: string } }>;
};

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const assetPath = path.join(repoRoot, 'apps', 'web', 'public', 'geography', 'admin1', 'national-boundaries.geojson');
const collection = JSON.parse(readFileSync(assetPath, 'utf8')) as NationalFeatureCollection;
const valid =
  collection.type === 'FeatureCollection' &&
  collection.features.length > 0 &&
  collection.features.every((feature) => feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon');

if (!valid) {
  throw new Error(`Invalid global national boundary asset: ${assetPath}`);
}

console.log(`[build-national-boundaries] validated ${collection.features.length} ADM0 features`);