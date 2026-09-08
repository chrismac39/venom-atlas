import { copyFileSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import path from 'node:path';
import type { ContentRecords } from '../apps/web/src/lib/content';

/** An explicit allowlist, not a copy of public with a growing draft denylist. */
export const publicationAssetPaths = (content: ContentRecords): string[] => {
  const paths = new Set<string>();
  for (const geography of content.geography) {
    for (const range of geography.ranges) {
      if (range.geometryAssetPath) paths.add(range.geometryAssetPath);
      if (range.sourceGeometryAssetPath) paths.add(range.sourceGeometryAssetPath);
    }
    for (const range of geography.distribution?.sourceRanges ?? []) paths.add(range.geometryAssetPath);
  }
  if (content.geography.length) {
    paths.add('/geography/admin1/global.geojson');
    paths.add('/geography/admin1/national-boundaries.geojson');
  }
  const referencedImages = new Set(content.organisms.flatMap((record) => record.externalProfile?.imagePaths ?? []));
  for (const asset of content.media) {
    if (asset.redistributionVerified && referencedImages.has(asset.localPath)) paths.add(asset.localPath);
  }
  for (const toxin of content.toxins) {
    for (const asset of toxin.structureAssets) {
      if (asset.verified && asset.structureStatus !== 'placeholder') paths.add(asset.localPath);
    }
    const interaction = toxin.interactionVisualization;
    if (interaction && paths.has(interaction.structureAssetPath)) paths.add(interaction.annotationPath);
  }
  return [...paths].sort();
};

export const publicationDataPaths = (content: ContentRecords): string[] => [
  '/data/search-index.json', '/data/venom-atlas.sqlite', '/data/geography/distribution-registry.json',
  ...content.organisms.flatMap(({ slug }) => [
    `/data/organisms/${slug}.json`,
    ...(content.geography.some((entry) => entry.organismSlug === slug) ? [`/data/organisms/${slug}.geography.json`] : []),
    ...(content.mechanisms.some((entry) => entry.subject.kind === 'organism_exposure' && entry.subject.slug === slug)
      ? [`/data/organisms/${slug}.mechanism.json`] : []),
    ...(content.physiology.some((entry) => entry.subject.kind === 'organism_exposure' && entry.subject.slug === slug)
      ? [`/data/organisms/${slug}.physiology.json`] : []),
  ]),
  ...content.toxicMaterials.map(({ slug }) => `/data/toxic-materials/${slug}.json`),
  ...content.toxins.map(({ slug }) => `/data/toxins/${slug}.json`),
];

export const resolvePublicationPath = (root: string, publicPath: string): string => {
  if (!/^\/(data|geography|images|structures)\//.test(publicPath) || /[\\?#%]/.test(publicPath)) {
    throw new Error(`Invalid publication asset path: ${publicPath}`);
  }
  const relative = publicPath.slice(1);
  if (relative.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe publication asset path: ${publicPath}`);
  }
  return path.join(root, relative);
};

/** Fail closed, including on missing files and symlink escapes. Never prune raw inputs. */
export const stagePublication = (source: string, destination: string, paths: string[]): void => {
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  try {
    const sourceRoot = realpathSync(source);
    for (const publicPath of new Set(paths)) {
      const input = realpathSync(resolvePublicationPath(source, publicPath));
      const relative = path.relative(sourceRoot, input);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Asset escapes public: ${publicPath}`);
      const output = resolvePublicationPath(destination, publicPath);
      mkdirSync(path.dirname(output), { recursive: true });
      copyFileSync(input, output);
    }
  } catch (error) {
    rmSync(destination, { recursive: true, force: true });
    throw error;
  }
};