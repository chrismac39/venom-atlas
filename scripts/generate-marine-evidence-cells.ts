import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Webdggrid } from 'webdggrid';

interface OccurrenceCollection {
  features: Array<{ geometry: { type: 'Point'; coordinates: [number, number] } }>;
}

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const geographyRoot = path.join(repoRoot, 'apps', 'web', 'public', 'geography');
const inputPath = path.join(geographyRoot, 'synanceia-verrucosa-occurrences.geojson');
const outputPath = path.join(geographyRoot, 'synanceia-verrucosa-isea3h-evidence.geojson');
const resolution = 6;

const main = async (): Promise<void> => {
  const occurrences = JSON.parse(readFileSync(inputPath, 'utf8')) as OccurrenceCollection;
  const coordinates = occurrences.features.map((feature) => feature.geometry.coordinates);
  const dggs = await Webdggrid.load();
  dggs.setDggs({
    poleCoordinates: { lat: 0, lng: 0 },
    azimuth: 0,
    aperture: 3,
    topology: 'HEXAGON',
    projection: 'ISEA',
  }, resolution);

  const cellIds = [...new Set(dggs.geoToSequenceNum(coordinates, resolution))];
  const collection = dggs.sequenceNumToGridFeatureCollection(cellIds, resolution, false);
  for (const feature of collection.features) {
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
      source: '/geography/synanceia-verrucosa-occurrences.geojson',
      note: 'Only ISEA3H cells containing a grid-deduplicated reusable-license GBIF observation are included.',
    },
    features: collection.features,
  };

  writeFileSync(
    outputPath,
    `${JSON.stringify(output, (_key, value: unknown) => typeof value === 'bigint' ? value.toString() : value, 2)}\n`,
  );
  console.log(`Generated ${cellIds.length} ISEA3H evidence cells at resolution ${resolution}.`);
};

void main();