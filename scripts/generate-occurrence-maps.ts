import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';

interface PositionGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

interface WorldFeatureCollection {
  features: Array<{ geometry: PositionGeometry }>;
}

interface OccurrenceCollection {
  metadata: { sourceUrl: string; note: string };
  features: Array<{ geometry: { type: 'Point'; coordinates: [number, number] } }>;
}

const width = 960;
const height = 480;
const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const geographyRoot = path.join(repoRoot, 'apps', 'web', 'public', 'geography');
const require = createRequire(import.meta.url);
const topology = JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8'));
const land = feature(topology, topology.objects.countries) as unknown as WorldFeatureCollection;

const project = ([longitude, latitude]: number[]): [number, number] => [
  ((longitude + 180) / 360) * width,
  ((90 - latitude) / 180) * height,
];

const ringPath = (ring: number[][]): string =>
  ring.map((position, index) => {
    const [horizontal, vertical] = project(position);
    return `${index === 0 ? 'M' : 'L'}${horizontal.toFixed(1)},${vertical.toFixed(1)}`;
  }).join(' ') + ' Z';

const geometryPath = (geometry: PositionGeometry): string => {
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates as number[][][]).map(ringPath).join(' ');
  }
  return (geometry.coordinates as number[][][][])
    .flatMap((polygon) => polygon.map(ringPath))
    .join(' ');
};

const landPaths = land.features
  .map((landFeature) => `<path d="${geometryPath(landFeature.geometry)}" />`)
  .join('');

for (const fileName of ['solenopsis-invicta', 'phyllobates-terribilis', 'oxyuranus-microlepidotus', 'synanceia-verrucosa', 'ornithorhynchus-anatinus']) {
  const inputPath = path.join(geographyRoot, `${fileName}-occurrences.geojson`);
  const collection = JSON.parse(readFileSync(inputPath, 'utf8')) as OccurrenceCollection;
  const points = collection.features.map((occurrence) => {
    const [horizontal, vertical] = project(occurrence.geometry.coordinates);
    return `<circle cx="${horizontal.toFixed(1)}" cy="${vertical.toFixed(1)}" r="3.4" />`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Documented occurrence records for ${fileName}</title>
  <description id="description">${collection.features.length} reusable-license GBIF occurrence records. Points are observations, not a complete range boundary.</description>
  <rect width="${width}" height="${height}" fill="#101817"/>
  <g fill="#263633" stroke="#58716b" stroke-width="0.6">${landPaths}</g>
  <g fill="#f4b942" stroke="#101817" stroke-width="1.1" opacity="0.88">${points}</g>
  <path d="M0 240 H960 M480 0 V480" stroke="#78908a" stroke-width="0.7" stroke-dasharray="4 7" opacity="0.55"/>
</svg>\n`;
  writeFileSync(path.join(geographyRoot, `${fileName}-occurrences.svg`), svg);
  console.log(`[generate-occurrence-maps] ${fileName}: ${collection.features.length} points`);
}
