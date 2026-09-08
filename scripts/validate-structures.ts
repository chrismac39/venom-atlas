import { readFileSync } from 'node:fs';
import {
  getContentRecords,
  getPublicAssetAbsolutePath,
  isFileEmpty,
} from '../apps/web/src/lib/content';
import { validateFeatureCollection } from './geography-asset-validation';

const fail = (message: string): never => {
  throw new Error(message);
};

// Validate authored drafts too; public getters may legitimately return no records.
const content = getContentRecords();
for (const toxin of content.toxins) {
  for (const asset of toxin.structureAssets) {
    const isPublishable = asset.verified || (asset.structureStatus !== undefined && asset.structureStatus !== 'placeholder');

    if (isPublishable && !asset.sourceUrl && !asset.sourceDatabase) {
      fail(`Verified/publishable structure asset missing source metadata: ${asset.id}`);
    }

    if (isPublishable && isFileEmpty(getPublicAssetAbsolutePath(asset.localPath))) {
      fail(`Verified/publishable structure asset file is empty: ${asset.localPath}`);
    }
  }
}

for (const geography of content.geography) {
  for (const range of geography.ranges) {
    if (!range.geometryAssetPath) {
      continue;
    }

    const filePath = getPublicAssetAbsolutePath(range.geometryAssetPath);
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
    validateFeatureCollection({
      assetPath: range.geometryAssetPath,
      data: parsed,
      allowedGeometryTypes: range.layerType === 'confirmed_occurrence'
        ? ['Point']
        : ['Polygon', 'MultiPolygon', 'Point'],
      requireSourceMetadata: range.layerType !== 'confirmed_occurrence',
      allowAntimeridianWrap: range.layerType === 'marine_evidence_cell',
    });
    const collection = parsed as {
      features?: Array<{
        geometry?: { type?: string; coordinates?: unknown[] };
        properties?: { license?: string; sourceUrl?: string };
      }>;
    };
    const hasFeatures = Array.isArray(collection.features) && collection.features.length > 0;

    const publishableRange = range.evidence.confidence !== 'unknown';
    if (publishableRange && !hasFeatures) {
      fail(`Publishable range geometry has no features: ${range.geometryAssetPath}`);
    }

    if (range.layerType === 'confirmed_occurrence' && collection.features) {
      for (const occurrence of collection.features) {
        const coordinates = occurrence.geometry?.coordinates;
        const [longitude, latitude] = Array.isArray(coordinates) ? coordinates : [];
        if (
          occurrence.geometry?.type !== 'Point' ||
          typeof longitude !== 'number' ||
          typeof latitude !== 'number' ||
          longitude < -180 ||
          longitude > 180 ||
          latitude < -90 ||
          latitude > 90
        ) {
          fail(`Invalid occurrence point in ${range.geometryAssetPath}`);
        }
        if (!occurrence.properties?.license || !occurrence.properties.sourceUrl) {
          fail(`Occurrence missing license or source URL in ${range.geometryAssetPath}`);
        }
      }

    }
  }
}

console.log('Structure and geometry validation passed.');
