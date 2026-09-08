import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface GbifOccurrence {
  key: number;
  scientificName?: string;
  decimalLatitude?: number;
  decimalLongitude?: number;
  datasetTitle?: string;
  occurrenceID?: string;
  basisOfRecord?: string;
  license?: string;
}

interface GbifResponse {
  results: GbifOccurrence[];
}

const taxa = [
  { slug: 'solenopsis-invicta', key: 5035230, countries: ['AR', 'BO', 'BR', 'PY', 'UY'] },
  { slug: 'phyllobates-terribilis', key: 5218020 },
  { slug: 'oxyuranus-microlepidotus', key: 2449963 },
  { slug: 'synanceia-verrucosa', key: 5201174 },
  { slug: 'ornithorhynchus-anatinus', key: 2433376 },
  { slug: 'clostridium-botulinum', key: 3226559 },
  { slug: 'amanita-phalloides', key: 5240325 },
  { slug: 'datura-stramonium', key: 2928751 },
  { slug: 'ricinus-communis', key: 5380041 },
  { slug: 'latrodectus-hasselti', key: 2157928 },
  { slug: 'androctonus-australis', key: 6894141 },
  { slug: 'conus-geographus', key: 5728277 },
  { slug: 'chironex-fleckeri', key: 2264689 },
  { slug: 'eunice-aphroditois', key: 5198482 },
  { slug: 'heloderma-suspectum', key: 2460817 },
] as const;

const reusableLicenses = new Set([
  'http://creativecommons.org/licenses/by/4.0/legalcode',
  'http://creativecommons.org/publicdomain/zero/1.0/legalcode',
]);
const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const geographyRoot = path.join(repoRoot, 'apps', 'web', 'public', 'geography');
mkdirSync(geographyRoot, { recursive: true });

const main = async (): Promise<void> => {
  for (const taxon of taxa) {
    const countries = 'countries' in taxon ? taxon.countries : [];
    const queries = [undefined, ...countries];
    const payloads: GbifResponse[] = [];
    for (const country of queries) {
      const query = new URLSearchParams({
        taxon_key: String(taxon.key),
        has_coordinate: 'true',
        has_geospatial_issue: 'false',
        occurrence_status: 'present',
        limit: '300',
        ...(country ? { country } : {}),
      });
      const response = await fetch(`https://api.gbif.org/v1/occurrence/search?${query}`);
      if (!response.ok) {
        throw new Error(`GBIF request failed for ${taxon.slug}${country ? ` in ${country}` : ''}: ${response.status}`);
      }
      payloads.push((await response.json()) as GbifResponse);
    }

    const occupiedCells = new Set<string>();
    const features = payloads.flatMap((payload) => payload.results).flatMap((record) => {
    if (
      record.decimalLatitude === undefined ||
      record.decimalLongitude === undefined ||
      !record.license ||
      !reusableLicenses.has(record.license)
    ) {
      return [];
    }

    const cell = `${Math.round(record.decimalLatitude * 2)}:${Math.round(record.decimalLongitude * 2)}`;
    if (occupiedCells.has(cell)) return [];
    occupiedCells.add(cell);

    return [{
      type: 'Feature' as const,
      id: record.key,
      geometry: {
        type: 'Point' as const,
        coordinates: [record.decimalLongitude, record.decimalLatitude],
      },
      properties: {
        scientificName: record.scientificName ?? null,
        datasetTitle: record.datasetTitle ?? null,
        occurrenceID: record.occurrenceID ?? null,
        basisOfRecord: record.basisOfRecord ?? null,
        license: record.license,
        sourceUrl: `https://www.gbif.org/occurrence/${record.key}`,
      },
    }];
    });

    const collection = {
    type: 'FeatureCollection',
    metadata: {
      source: 'GBIF occurrence search',
      sourceUrl: `https://www.gbif.org/species/${taxon.key}`,
      taxonKey: taxon.key,
      generatedAt: new Date().toISOString(),
      note: 'Reusable-license occurrence records, grid-deduplicated to one record per 0.5 degree cell. Not a range boundary.',
    },
    features,
    };

    const outputPath = path.join(geographyRoot, `${taxon.slug}-occurrences.geojson`);
    writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`);
    console.log(`[fetch-gbif-occurrences] ${taxon.slug}: ${features.length} points`);
  }
};

void main();
