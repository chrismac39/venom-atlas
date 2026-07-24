import { readFileSync } from 'node:fs';
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
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as { features?: unknown[] };
    const hasFeatures = Array.isArray(parsed.features) && parsed.features.length > 0;

    const publishableRange = range.evidence.confidence !== 'unknown';
    if (publishableRange && !hasFeatures) {
      fail(`Publishable range geometry has no features: ${range.geometryAssetId}`);
    }
  }
}

console.log('Structure and geometry validation passed.');
