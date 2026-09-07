import { existsSync, readFileSync } from 'node:fs';
import {
  getAllOrganisms,
  getAllToxins,
  getGeographyByOrganismSlug,
  getPublicAssetAbsolutePath,
  isFileEmpty,
} from '../apps/web/src/lib/content';

const fail = (message: string): never => {
  throw new Error(message);
};

for (const toxinBundle of getAllToxins()) {
  for (const asset of toxinBundle.structureAssets) {
    const isPublishable = asset.verified || (asset.structureStatus !== undefined && asset.structureStatus !== 'placeholder');

    if (isPublishable && !asset.sourceUrl && !asset.sourceDatabase) {
      fail(`Verified/publishable structure asset missing source metadata: ${asset.id}`);
    }

    if (isPublishable && isFileEmpty(getPublicAssetAbsolutePath(asset.localPath))) {
      fail(`Verified/publishable structure asset file is empty: ${asset.localPath}`);
    }
  }
}

for (const organismBundle of getAllOrganisms()) {
  const geography = getGeographyByOrganismSlug(organismBundle.organism.slug ?? '');
  if (!geography) {
    continue;
  }

  for (const range of geography.ranges) {
    if (!range.geometryAssetId) {
      continue;
    }

    const filePath = getPublicAssetAbsolutePath(range.geometryAssetId);
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as {
      features?: Array<{
        geometry?: { type?: string; coordinates?: unknown[] };
        properties?: { license?: string; sourceUrl?: string };
      }>;
    };
    const hasFeatures = Array.isArray(parsed.features) && parsed.features.length > 0;

    const publishableRange = range.evidence.confidence !== 'unknown';
    if (publishableRange && !hasFeatures) {
      fail(`Publishable range geometry has no features: ${range.geometryAssetId}`);
    }

    if (range.layerType === 'confirmed_occurrence' && parsed.features) {
      for (const occurrence of parsed.features) {
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
          fail(`Invalid occurrence point in ${range.geometryAssetId}`);
        }
        if (!occurrence.properties?.license || !occurrence.properties.sourceUrl) {
          fail(`Occurrence missing license or source URL in ${range.geometryAssetId}`);
        }
      }

      const mapPath = filePath.replace(/\.geojson$/i, '.svg');
      if (!existsSync(mapPath) || isFileEmpty(mapPath)) {
        fail(`Occurrence layer missing generated static map: ${mapPath}`);
      }
    }
  }
}

console.log('Structure and geometry validation passed.');
