import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import OCL from 'openchemlib';

interface ToxinStructureAsset {
  id?: string;
  localPath?: string;
  format?: string;
  verified?: boolean;
}

interface ToxinRecord {
  id?: string;
  slug?: string;
  displayName?: string;
  structureAssets?: ToxinStructureAsset[];
}

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const toxinsDir = path.join(repoRoot, 'content-source', 'toxins');
const publicDir = path.join(repoRoot, 'apps', 'web', 'public');

const toAbsolutePublicPath = (publicPath: string): string =>
  path.join(publicDir, publicPath.replace(/^\//, ''));

const parseToxinFile = (filePath: string): ToxinRecord => {
  const parsed = yaml.load(readFileSync(filePath, 'utf8'));
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid toxin record in ${path.basename(filePath)}`);
  }
  return parsed as ToxinRecord;
};

const generateSvgFromMolfile = (molfile: string, width: number, height: number): string => {
  const molecule = OCL.Molecule.fromMolfile(molfile);
  molecule.removeExplicitHydrogens();
  const rawSvg = molecule.toSVG(width, height);

  const coordinateValues = Array.from(
    rawSvg.matchAll(/\b(?:x1|x2|cx|x|y1|y2|cy|y)="(-?\d+(?:\.\d+)?)"/g),
    (match) => Number.parseFloat(match[1] ?? '0'),
  ).filter((value) => Number.isFinite(value));

  if (coordinateValues.length < 4) {
    return rawSvg;
  }

  const xValues = Array.from(
    rawSvg.matchAll(/\b(?:x1|x2|cx|x)="(-?\d+(?:\.\d+)?)"/g),
    (match) => Number.parseFloat(match[1] ?? '0'),
  ).filter((value) => Number.isFinite(value));
  const yValues = Array.from(
    rawSvg.matchAll(/\b(?:y1|y2|cy|y)="(-?\d+(?:\.\d+)?)"/g),
    (match) => Number.parseFloat(match[1] ?? '0'),
  ).filter((value) => Number.isFinite(value));

  if (xValues.length === 0 || yValues.length === 0) {
    return rawSvg;
  }

  const pad = 14;
  const minX = Math.min(...xValues) - pad;
  const maxX = Math.max(...xValues) + pad;
  const minY = Math.min(...yValues) - pad;
  const maxY = Math.max(...yValues) + pad;
  const croppedWidth = Math.max(120, Math.ceil(maxX - minX));
  const croppedHeight = Math.max(80, Math.ceil(maxY - minY));

  const croppedSvg = rawSvg
    .replace(/<text[^>]*>\s*this enantiomer\s*<\/text>\s*/gi, '')
    // Remove OCL stereochemical R/S callouts (small red glyph labels), not atom symbols.
    .replace(/<text[^>]*font-size="(?:8|9|10)"[^>]*fill="rgb\(160,0,0\)"[^>]*>\s*[RS]\s*<\/text>\s*/g, '')
    .replace(/width="[^"]+"/, `width="${croppedWidth}px"`)
    .replace(/height="[^"]+"/, `height="${croppedHeight}px"`)
    .replace(
      /viewBox="[^"]+"/,
      `viewBox="${minX.toFixed(2)} ${minY.toFixed(2)} ${(maxX - minX).toFixed(2)} ${(maxY - minY).toFixed(2)}"`,
    );

  return croppedSvg;
};

const pickTwoDimensionalAsset = (assets: ToxinStructureAsset[]): ToxinStructureAsset | undefined => {
  const candidates = assets.filter(
    (asset) => asset.format === 'svg' && asset.localPath && asset.verified === true,
  );

  return candidates.sort((a, b) => {
    const idA = a.id ?? '';
    const idB = b.id ?? '';
    if (idA !== idB) {
      return idA.localeCompare(idB);
    }
    return (a.localPath ?? '').localeCompare(b.localPath ?? '');
  })[0];
};

const sourceFormatPriority = ['sdf', 'mol', 'mol2'] as const;

const pickSourceMolfileAsset = (assets: ToxinStructureAsset[]): ToxinStructureAsset | undefined => {
  const candidates = assets.filter(
    (asset) =>
      typeof asset.localPath === 'string' &&
      asset.verified === true &&
      sourceFormatPriority.includes((asset.format ?? '') as (typeof sourceFormatPriority)[number]),
  );

  return candidates.sort((a, b) => {
    const rankA = sourceFormatPriority.indexOf((a.format ?? '') as (typeof sourceFormatPriority)[number]);
    const rankB = sourceFormatPriority.indexOf((b.format ?? '') as (typeof sourceFormatPriority)[number]);
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    const idA = a.id ?? '';
    const idB = b.id ?? '';
    if (idA !== idB) {
      return idA.localeCompare(idB);
    }

    return (a.localPath ?? '').localeCompare(b.localPath ?? '');
  })[0];
};

const toxinFiles = readdirSync(toxinsDir)
  .filter((entry) => entry.endsWith('.yaml') || entry.endsWith('.yml'))
  .sort((a, b) => a.localeCompare(b))
  .map((entry) => path.join(toxinsDir, entry));

let generated = 0;
let skipped = 0;

for (const toxinFile of toxinFiles) {
  const toxin = parseToxinFile(toxinFile);
  const assets = toxin.structureAssets ?? [];

  const twoDimensionalAsset = pickTwoDimensionalAsset(assets);
  const sourceMolfileAsset = pickSourceMolfileAsset(assets);

  if (!twoDimensionalAsset?.localPath || !sourceMolfileAsset?.localPath) {
    skipped += 1;
    continue;
  }

  const molfilePath = toAbsolutePublicPath(sourceMolfileAsset.localPath);
  if (!existsSync(molfilePath)) {
    console.warn(`[generate-structure-svgs] Missing source structure file: ${sourceMolfileAsset.localPath}`);
    skipped += 1;
    continue;
  }

  const molfile = readFileSync(molfilePath, 'utf8').trim();
  if (molfile.length === 0) {
    console.warn(`[generate-structure-svgs] Empty source structure file: ${sourceMolfileAsset.localPath}`);
    skipped += 1;
    continue;
  }

  const svgPath = toAbsolutePublicPath(twoDimensionalAsset.localPath);
  mkdirSync(path.dirname(svgPath), { recursive: true });

  try {
    const svg = generateSvgFromMolfile(molfile, 1400, 420);
    writeFileSync(svgPath, svg, 'utf8');
    generated += 1;
    console.log(`[generate-structure-svgs] Generated ${twoDimensionalAsset.localPath} from ${sourceMolfileAsset.localPath}${toxin.slug ? ` (${toxin.slug})` : ''}`);
  } catch (error) {
    console.warn(
      `[generate-structure-svgs] Failed to generate SVG for ${toxin.displayName ?? toxin.id ?? path.basename(toxinFile)}: ${(error as Error).message}`,
    );
    skipped += 1;
  }
}

console.log(`[generate-structure-svgs] Done. generated=${generated} skipped=${skipped}`);
