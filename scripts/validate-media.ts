import { existsSync } from 'node:fs';
import {
  getAllMediaAssets,
  getPublicAssetAbsolutePath,
} from '../apps/web/src/lib/content';

const fail = (message: string): never => {
  throw new Error(message);
};

const assets = getAllMediaAssets();
const missingFiles: string[] = [];
const missingAttribution: string[] = [];

for (const asset of assets) {
  const absolutePath = getPublicAssetAbsolutePath(asset.localPath);
  if (!existsSync(absolutePath)) {
    missingFiles.push(asset.localPath);
  }

  const looksLikeImage = asset.kind === 'organism_photo' || asset.kind === 'anatomical_photo' || asset.kind === 'scientific_illustration';
  if (looksLikeImage && !asset.attributionText) {
    missingAttribution.push(asset.id);
  }
}

if (missingFiles.length > 0) {
  fail(`Missing public asset files: ${missingFiles.join(', ')}`);
}

if (missingAttribution.length > 0) {
  fail(`Public image assets missing attribution text: ${missingAttribution.join(', ')}`);
}

const unverified = assets.filter((asset) => !asset.redistributionVerified);
if (unverified.length > 0) {
  console.warn(`Media redistribution is not verified for ${unverified.length} assets. These must remain placeholder-only in production pages.`);
}

console.log(`Media validation passed (${assets.length} assets checked).`);
