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
import { getGeographyScope } from './geography-scope-registry.js';

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
    nativeAdmin1RegionIds?: string[];
    nativeEvidenceIds?: string[];
    nativeScopes?: NativeScope[];
    sourceRanges?: SourceRange[];
  };
};
type NativeScope = {
  type: 'country' | 'macroregion';
  id: string;
  evidenceIds: string[];
  confidence: 'moderate' | 'high';
  note?: string;
};
const nativeAdmin1RegionIdsBySpecies = new Map<string, Set<string>>();
const nativeEvidenceIdsBySpecies = new Map<string, string[]>();
const nativeScopesBySpecies = new Map<string, NativeScope[]>();
type SourceRange = {
  layerType: 'native' | 'introduced' | 'uncertain';
  geometryAssetPath: string;
  evidenceIds: string[];
  confidence: 'high' | 'moderate' | 'low';
};
const sourceRangesBySpecies = new Map<string, SourceRange[]>();
for (const sourceFile of readdirSync(geographySourceRoot).filter((name) => name.endsWith('.yaml'))) {
  const source = load(readFileSync(path.join(geographySourceRoot, sourceFile), 'utf8')) as GeographySource;
  if (source.organismSlug && source.distribution?.nativeAdmin1RegionIds) {
    nativeAdmin1RegionIdsBySpecies.set(source.organismSlug, new Set(source.distribution.nativeAdmin1RegionIds));
  }
  if (source.organismSlug && source.distribution?.nativeEvidenceIds) {
    nativeEvidenceIdsBySpecies.set(source.organismSlug, source.distribution.nativeEvidenceIds);
  }
  if (source.organismSlug && source.distribution?.nativeScopes) {
    nativeScopesBySpecies.set(source.organismSlug, source.distribution.nativeScopes);
  }
  if (source.organismSlug && source.distribution?.sourceRanges) {
    sourceRangesBySpecies.set(source.organismSlug, source.distribution.sourceRanges);
  }
}

const records = new Map<string, DistributionRecord>();
for (const [speciesId, nativeScopes] of nativeScopesBySpecies) {
  for (const nativeScope of nativeScopes) {
    const scope = getGeographyScope(nativeScope.type, nativeScope.id);
    let matchedAdminFeatureCount = 0;
    for (const adminFeature of adminFeatures) {
      const { shapeGroup, shapeISO, shapeName, shapeID } = adminFeature.properties;
      if (!scope.countryCodes.includes(shapeGroup)) {
        continue;
      }
      matchedAdminFeatureCount += 1;
      const regionId = `${shapeGroup}-${shapeISO}`;
      records.set(`${speciesId}:${regionId}`, {
        speciesId,
        regionId,
        countryCode: shapeGroup,
        adminLevel: 1,
        regionName: shapeName,
        distributionStatus: 'native',
        evidenceIds: nativeScope.evidenceIds,
        derivation: 'source_native_scope_to_admin1',
        confidence: nativeScope.confidence,
        sourceRecordCount: 0,
        note: nativeScope.note ?? `Source-backed ${scope.label} claim expanded to the geoBoundaries ADM1 feature ${shapeID}; the source did not name this ADM1 individually.`,
      });
    }
    if (matchedAdminFeatureCount === 0) {
      throw new Error(`Geography scope ${nativeScope.type}:${nativeScope.id} matched no ADM1 features for ${speciesId}.`);
    }
  }
}

for (const [speciesId, nativeAdmin1RegionIds] of nativeAdmin1RegionIdsBySpecies) {
  for (const adminFeature of adminFeatures) {
    const { shapeGroup, shapeISO, shapeName, shapeID } = adminFeature.properties;
    const regionId = `${shapeGroup}-${shapeISO}`;
    if (!nativeAdmin1RegionIds.has(regionId)) {
      continue;
    }
    records.set(`${speciesId}:${regionId}`, {
      speciesId,
      regionId,
      countryCode: shapeGroup,
      adminLevel: 1,
      regionName: shapeName,
      distributionStatus: 'native',
      evidenceIds: nativeEvidenceIdsBySpecies.get(speciesId) ?? [`ev-${speciesId}-native-range`],
      derivation: 'source_native_admin1',
      confidence: 'high',
      sourceRecordCount: 0,
      note: `Source-backed native ADM1 range assigned to the geoBoundaries feature ${shapeID}; no GBIF point is required for this native-range shading record.`,
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
    const isNativeEvidence = nativeAdmin1RegionIdsBySpecies.get(speciesId)?.has(regionId) ?? false;
    const existingStatus = existing?.distributionStatus;
    const hasCuratedSource = existing?.derivation === 'curated_source';
    const hasSourceNativeDerivation = existing?.derivation === 'source_native_admin1' || existing?.derivation === 'source_native_scope_to_admin1';
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
        ...(isNativeEvidence ? (nativeEvidenceIdsBySpecies.get(speciesId) ?? [`ev-${speciesId}-native-range`]) : []),
        ...(existing?.evidenceIds ?? []),
        `ev-${speciesId}-gbif-occurrences`,
      ),
      derivation: hasCuratedSource
        ? 'curated_source'
        : hasSourceNativeDerivation
          ? existing.derivation
          : 'occurrence_point_aggregation',
      confidence: existing?.confidence ?? 'moderate',
      sourceRecordCount: (existing?.sourceRecordCount ?? 0) + 1,
      note: isNativeEvidence
        ? `Reusable-license GBIF point evidence assigned to the source-backed native geoBoundaries ADM1 feature ${shapeID}. Native classification is limited to explicit ADM1 evidence.`
        : existing?.note ?? `Point evidence assigned to the geoBoundaries ADM1 feature ${shapeID}; this is recorded presence, not a native or introduced range claim.`,
    });
  }
}

const registry = { dataset: 'geoBoundaries', release: manifest.release, records: [...records.values()] };
validateDistributionRegistry(registry);
writeFileSync(path.join(outputRoot, 'distribution-registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`[build-geography-registry] wrote ${records.size} species-region records`);
