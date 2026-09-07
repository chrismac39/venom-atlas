import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Coordinate = [number, number];
type Geometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: Coordinate[][] | Coordinate[][][];
};
type Feature = { type: 'Feature'; geometry: Geometry; properties: Record<string, unknown> };
type FeatureCollection = { type: 'FeatureCollection'; features: Feature[] };

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const assetName = process.argv[2] ?? 'global.geojson';
const assetPath = path.join(repoRoot, 'apps', 'web', 'public', 'geography', 'admin1', assetName);
const outputName = process.argv[3] ?? assetName;
const outputPath = path.join(repoRoot, 'apps', 'web', 'public', 'geography', 'admin1', outputName);
const tolerance = Number(process.argv[4] ?? 0.05);

const squaredSegmentDistance = (point: Coordinate, start: Coordinate, end: Coordinate): number => {
  let x = start[0];
  let y = start[1];
  let deltaX = end[0] - x;
  let deltaY = end[1] - y;
  if (deltaX !== 0 || deltaY !== 0) {
    const projection = ((point[0] - x) * deltaX + (point[1] - y) * deltaY) / (deltaX ** 2 + deltaY ** 2);
    if (projection > 1) {
      x = end[0];
      y = end[1];
    } else if (projection > 0) {
      x += deltaX * projection;
      y += deltaY * projection;
    }
  }
  deltaX = point[0] - x;
  deltaY = point[1] - y;
  return deltaX ** 2 + deltaY ** 2;
};

const simplifyLine = (line: Coordinate[]): Coordinate[] => {
  if (line.length <= 4) return line;
  const squaredTolerance = tolerance ** 2;
  const keep = new Uint8Array(line.length);
  keep[0] = 1;
  keep[line.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, line.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop() as [number, number];
    let furthest = squaredTolerance;
    let index = -1;
    for (let position = start + 1; position < end; position += 1) {
      const distance = squaredSegmentDistance(line[position], line[start], line[end]);
      if (distance > furthest) {
        furthest = distance;
        index = position;
      }
    }
    if (index !== -1) {
      keep[index] = 1;
      stack.push([start, index], [index, end]);
    }
  }
  const simplified = line.filter((_, index) => keep[index] === 1);
  return simplified.length >= 4 ? simplified : line.slice(0, 4);
};

const simplifyRing = (ring: Coordinate[]): Coordinate[] => {
  const openRing = ring.slice(0, -1);
  const simplified = simplifyLine([...openRing, openRing[0]]);
  return simplified[simplified.length - 1][0] === simplified[0][0] && simplified[simplified.length - 1][1] === simplified[0][1]
    ? simplified
    : [...simplified, simplified[0]];
};

const simplifyGeometry = (geometry: Geometry): Geometry => {
  if (geometry.type === 'Polygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(simplifyRing) as Coordinate[][] };
  }
  return {
    ...geometry,
    coordinates: geometry.coordinates.map((polygon) => polygon.map(simplifyRing)) as Coordinate[][][],
  };
};

const collection = JSON.parse(readFileSync(assetPath, 'utf8')) as FeatureCollection;
const simplified: FeatureCollection = {
  ...collection,
  features: collection.features.map((feature) => ({ ...feature, geometry: simplifyGeometry(feature.geometry) })),
};
writeFileSync(outputPath, `${JSON.stringify(simplified)}\n`);
console.log(`[simplify-global-geography] simplified ${simplified.features.length} features from ${assetName} to ${outputName} at ${tolerance} degrees`);