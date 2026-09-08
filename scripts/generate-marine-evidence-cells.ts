import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Webdggrid } from 'webdggrid';
import { load } from 'js-yaml';

interface OccurrenceCollection {
  features: Array<{ geometry: { type: 'Point'; coordinates: [number, number] } }>;
}

type Position = [number, number];

const unwrapRing = (ring: Position[]): Position[] => ring.reduce<Position[]>((unwrapped, position) => {
  if (unwrapped.length === 0) return [[position[0], position[1]]];
  let longitude = position[0];
  const previousLongitude = unwrapped[unwrapped.length - 1][0];
  while (longitude - previousLongitude > 180) longitude -= 360;
  while (longitude - previousLongitude < -180) longitude += 360;
  return [...unwrapped, [longitude, position[1]]];
}, []);

const clipRing = (ring: Position[], boundary: number, keepBelow: boolean): Position[] => {
  const clipped: Position[] = [];
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const previous = ring[(index + ring.length - 1) % ring.length];
    const currentInside = keepBelow ? current[0] <= boundary : current[0] >= boundary;
    const previousInside = keepBelow ? previous[0] <= boundary : previous[0] >= boundary;
    if (currentInside !== previousInside) {
      const ratio = (boundary - previous[0]) / (current[0] - previous[0]);
      clipped.push([boundary, previous[1] + (current[1] - previous[1]) * ratio]);
    }
    if (currentInside) clipped.push(current);
  }
  return clipped;
};

const splitAntimeridianPolygon = (coordinates: Position[][]): { type: 'Polygon' | 'MultiPolygon'; coordinates: Position[][] | Position[][][] } => {
  const ring = unwrapRing(coordinates[0]);
  const minLongitude = Math.min(...ring.map(([longitude]) => longitude));
  const maxLongitude = Math.max(...ring.map(([longitude]) => longitude));
  if (maxLongitude <= 180 && minLongitude >= -180) {
    return { type: 'Polygon', coordinates: [ring] };
  }

  const boundary = maxLongitude > 180 ? 180 : -180;
  const below = clipRing(ring, boundary, true);
  const above = clipRing(ring, boundary, false).map(([longitude, latitude]) => [longitude >= 180 ? longitude - 360 : longitude + 360, latitude] as Position);
  const polygons = [below, above].filter((part) => part.length >= 4).map((part) => [part]);
  return { type: 'MultiPolygon', coordinates: polygons };
};

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const geographyRoot = path.join(repoRoot, 'apps', 'web', 'public', 'geography');
const geographySourceRoot = path.join(repoRoot, 'content-source', 'geography');
const resolution = 6;

const main = async (): Promise<void> => {
  const marineSlugs = readdirSync(geographySourceRoot)
    .filter((fileName) => fileName.endsWith('.yaml'))
    .map((fileName) => load(readFileSync(path.join(geographySourceRoot, fileName), 'utf8')) as { organismSlug?: string; geographyKind?: string })
    .filter((record) => record.geographyKind === 'marine' && record.organismSlug)
    .map((record) => record.organismSlug as string);
  const dggs = await Webdggrid.load();
  dggs.setDggs({
    poleCoordinates: { lat: 0, lng: 0 },
    azimuth: 0,
    aperture: 3,
    topology: 'HEXAGON',
    projection: 'ISEA',
  }, resolution);

  for (const slug of marineSlugs) {
    const inputPath = path.join(geographyRoot, `${slug}-occurrences.geojson`);
    const outputPath = path.join(geographyRoot, `${slug}-isea3h-evidence.geojson`);
    const occurrences = JSON.parse(readFileSync(inputPath, 'utf8')) as OccurrenceCollection;
    const coordinates = occurrences.features.map((feature) => feature.geometry.coordinates);
    const cellIds = [...new Set(dggs.geoToSequenceNum(coordinates, resolution))];
    const collection = dggs.sequenceNumToGridFeatureCollection(cellIds, resolution, false);
    for (const feature of collection.features) {
      if (feature.geometry.type === 'Polygon') {
        feature.geometry = splitAntimeridianPolygon(feature.geometry.coordinates as Position[][]);
      }
      const id = feature.properties?.id;
      feature.properties = {
        ...feature.properties,
        ...(typeof id === 'bigint' ? { id: id.toString() } : {}),
        license: 'ISC',
        sourceUrl: 'https://github.com/am2222/webDggrid',
      };
    }

    const output = {
      type: collection.type,
      metadata: {
        dggrs: 'https://www.opengis.net/def/dggrs/OGC/1.0/ISEA3H',
        projection: 'ISEA',
        topology: 'HEXAGON',
        aperture: 3,
        resolution,
        source: `/geography/${slug}-occurrences.geojson`,
        note: 'Only ISEA3H cells containing a grid-deduplicated reusable-license GBIF observation are included.',
      },
      features: collection.features,
    };

    writeFileSync(
      outputPath,
      `${JSON.stringify(output, (_key, value: unknown) => typeof value === 'bigint' ? value.toString() : value, 2)}\n`,
    );
    console.log(`Generated ${cellIds.length} ISEA3H evidence cells for ${slug} at resolution ${resolution}.`);
  }
};

void main();