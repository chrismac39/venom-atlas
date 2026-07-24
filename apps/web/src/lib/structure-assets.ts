import type { MolecularStructureAsset } from '@venom-atlas/domain';

type StructureFormat = MolecularStructureAsset['format'];

const preferred3dFormatOrder: StructureFormat[] = ['sdf', 'mol', 'mol2', 'pdb', 'mmcif'];

const rankByFormat = (format: StructureFormat, formatOrder: StructureFormat[]): number => {
  const rank = formatOrder.indexOf(format);
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank;
};

const stableSortAssets = (
  assets: MolecularStructureAsset[],
  formatOrder: StructureFormat[],
): MolecularStructureAsset[] => {
  return [...assets].sort((a, b) => {
    const rankDelta = rankByFormat(a.format, formatOrder) - rankByFormat(b.format, formatOrder);
    if (rankDelta !== 0) {
      return rankDelta;
    }

    const idDelta = a.id.localeCompare(b.id);
    if (idDelta !== 0) {
      return idDelta;
    }

    return a.localPath.localeCompare(b.localPath);
  });
};

export const pickPreferred3dAsset = (
  assets: MolecularStructureAsset[],
): MolecularStructureAsset | undefined => {
  const candidates = assets.filter(
    (asset) =>
      asset.verified &&
      preferred3dFormatOrder.includes(asset.format) &&
      typeof asset.localPath === 'string' &&
      asset.localPath.length > 0,
  );

  return stableSortAssets(candidates, preferred3dFormatOrder)[0];
};

export const pickPreferred2dAsset = (
  assets: MolecularStructureAsset[],
): MolecularStructureAsset | undefined => {
  const candidates = assets.filter(
    (asset) => asset.verified && asset.format === 'svg' && typeof asset.localPath === 'string' && asset.localPath.length > 0,
  );

  return stableSortAssets(candidates, ['svg'])[0];
};
