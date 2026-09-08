import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import booleanIntersects from '@turf/boolean-intersects';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { load } from 'js-yaml';
import {
  classifyOccurrenceStatus,
  mergeEvidenceIds,
  type DistributionDerivation,
  type DistributionStatus,
} from './geography-registry-logic.js';
import { validateDistributionRegistry } from './geography-registry-validation.js';

type Feature = {
  type: 'Feature';
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
  properties: {
    shapeGroup: string;
    shapeISO: string;
    shapeName: string;
    shapeID: string;
  };
};

type FeatureCollection = { type: 'FeatureCollection'; features: Feature[] };

type DistributionRecord = {
  speciesId: string;
  regionId: string;
  countryCode: string;
  adminLevel: 1;
  regionName: string;
  distributionStatus: DistributionStatus;
  evidenceIds: string[];
  derivation: DistributionDerivation;
  confidence: 'moderate' | 'high';
  sourceRecordCount: number;
  note: string;
};

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const geographyRoot = path.join(repoRoot, 'apps', 'web', 'public', 'geography');
const geographySourceRoot = path.join(repoRoot, 'content-source', 'geography');
const adminRoot = path.join(geographyRoot, 'admin1');
const outputRoot = path.join(repoRoot, 'apps', 'web', 'public', 'data', 'geography');
mkdirSync(outputRoot, { recursive: true });

const manifest = JSON.parse(readFileSync(path.join(adminRoot, 'manifest.json'), 'utf8')) as {
  release: string;
};

const globalAdminPath = path.join(adminRoot, 'global.geojson');
const globalAdmin = JSON.parse(readFileSync(globalAdminPath, 'utf8')) as FeatureCollection;
if (globalAdmin.type !== 'FeatureCollection' || !Array.isArray(globalAdmin.features)) {
  throw new Error(`Invalid GeoJSON FeatureCollection: ${globalAdminPath}`);
}
const adminFeatures = globalAdmin.features.map((feature) => ({ ...feature, sourcePath: globalAdminPath }));

type GeographySource = {
  organismSlug?: string;
  distribution?: {
    nativeCountryCodes?: string[];
    sourceRanges?: SourceRange[];
  };
};
const nativeCountryCodesBySpecies = new Map<string, Set<string>>();
type SourceRange = {
  layerType: 'native' | 'introduced' | 'uncertain';
  geometryAssetPath: string;
  evidenceIds: string[];
  confidence: 'high' | 'moderate' | 'low';
};
const sourceRangesBySpecies = new Map<string, SourceRange[]>();
for (const sourceFile of readdirSync(geographySourceRoot).filter((name) => name.endsWith('.yaml'))) {
  const source = load(readFileSync(path.join(geographySourceRoot, sourceFile), 'utf8')) as GeographySource;
  if (source.organismSlug && source.distribution?.nativeCountryCodes) {
    nativeCountryCodesBySpecies.set(source.organismSlug, new Set(source.distribution.nativeCountryCodes));
  }
  if (source.organismSlug && source.distribution?.sourceRanges) {
    sourceRangesBySpecies.set(source.organismSlug, source.distribution.sourceRanges);
  }
}

const records = new Map<string, DistributionRecord>();
for (const [speciesId, nativeCountryCodes] of nativeCountryCodesBySpecies) {
  for (const adminFeature of adminFeatures) {
    const { shapeGroup, shapeISO, shapeName, shapeID } = adminFeature.properties;
    if (!nativeCountryCodes.has(shapeGroup)) {
      continue;
    }
    records.set(`${speciesId}:${shapeGroup}-${shapeISO}`, {
      speciesId,
      regionId: `${shapeGroup}-${shapeISO}`,
      countryCode: shapeGroup,
      adminLevel: 1,
      regionName: shapeName,
      distributionStatus: 'native',
      evidenceIds: [`ev-${speciesId}-native-range`],
      derivation: 'source_range_to_admin1_extrapolation',
      confidence: 'high',
      sourceRecordCount: 0,
      note: `Source-backed country-level native range expanded to the geoBoundaries ADM1 feature ${shapeID}; no GBIF point is required for this native-range shading record.`,
    });
  }
}

for (const [speciesId, sourceRanges] of sourceRangesBySpecies) {
  for (const sourceRange of sourceRanges) {
    const sourcePath = path.join(repoRoot, 'apps', 'web', 'public', sourceRange.geometryAssetPath.replace(/^\//, ''));
    const sourceCollection = JSON.parse(readFileSync(sourcePath, 'utf8')) as FeatureCollection;
    for (const adminFeature of adminFeatures) {
      if (!sourceCollection.features.some((sourceFeature) => booleanIntersects(sourceFeature as never, adminFeature as never))) {
        continue;
      }
      const { shapeGroup, shapeISO, shapeName, shapeID } = adminFeature.properties;
      records.set(`${speciesId}:${shapeGroup}-${shapeISO}`, {
        speciesId,
        regionId: `${shapeGroup}-${shapeISO}`,
        countryCode: shapeGroup,
        adminLevel: 1,
        regionName: shapeName,
        distributionStatus: sourceRange.layerType,
        evidenceIds: sourceRange.evidenceIds,
        derivation: 'curated_source',
        confidence: sourceRange.confidence,
        sourceRecordCount: 0,
        note: `ADM1 feature ${shapeID} intersects the curated source range asset ${sourceRange.geometryAssetPath}.`,
      });
    }
  }
}

for (const fileName of readdirSync(geographyRoot).filter((name) => name.endsWith('-occurrences.geojson'))) {
  const speciesId = fileName.replace(/-occurrences\.geojson$/, '');
  const collection = JSON.parse(readFileSync(path.join(geographyRoot, fileName), 'utf8')) as FeatureCollection;
  for (const occurrence of collection.features) {
    if (occurrence.geometry.type !== 'Point' || !Array.isArray(occurrence.geometry.coordinates)) {
      throw new Error(`Invalid occurrence geometry in ${fileName}`);
    }
    const coordinates = occurrence.geometry.coordinates as number[];
    const [longitude, latitude] = coordinates;
    if (
      typeof longitude !== 'number' ||
      typeof latitude !== 'number' ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new Error(`Invalid occurrence coordinates in ${fileName}`);
    }

    const containingRegion = adminFeatures.find((feature) =>
      booleanPointInPolygon(point([longitude, latitude]), feature as never),
    );
    if (!containingRegion) {
      continue;
    }

    const { shapeGroup, shapeISO, shapeName, shapeID } = containingRegion.properties;
    const regionId = `${shapeGroup}-${shapeISO}`;
    const key = `${speciesId}:${regionId}`;
    const existing = records.get(key);
    const isNativeEvidence = nativeCountryCodesBySpecies.get(speciesId)?.has(shapeGroup) ?? false;
    const existingStatus = existing?.distributionStatus;
    const hasCuratedSource = existing?.derivation === 'curated_source';
    records.set(key, {
      speciesId,
      regionId,
      countryCode: shapeGroup,
      adminLevel: 1,
      regionName: shapeName,
      distributionStatus: classifyOccurrenceStatus({
        isNativeEvidence,
        existingStatus,
        existingDerivation: existing?.derivation,
      }),
      evidenceIds: mergeEvidenceIds(
        ...(isNativeEvidence ? [`ev-${speciesId}-native-range`] : []),
        ...(existing?.evidenceIds ?? []),
        `ev-${speciesId}-gbif-occurrences`,
      ),
      derivation: hasCuratedSource ? 'curated_source' : 'occurrence_point_aggregation',
      confidence: existing?.confidence ?? 'moderate',
      sourceRecordCount: (existing?.sourceRecordCount ?? 0) + 1,
      note: isNativeEvidence
        ? `Reusable-license GBIF point evidence assigned to the native geoBoundaries ADM1 feature ${shapeID}. The country-level native range source is not expanded to unobserved ADM1 units.`
        : existing?.note ?? `Point evidence assigned to the geoBoundaries ADM1 feature ${shapeID}; this is recorded presence, not a native or introduced range claim.`,
    });
  }
}

const registry = { dataset: 'geoBoundaries', release: manifest.release, records: [...records.values()] };
validateDistributionRegistry(registry);
writeFileSync(path.join(outputRoot, 'distribution-registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`[build-geography-registry] wrote ${records.size} species-region records`);
