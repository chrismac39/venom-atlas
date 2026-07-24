import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { MolecularRepresentation } from '@venom-atlas/visualization-contracts';
import type { ToxinDetail } from '../../../services/contracts';
import { atlasApi } from '../../../services/apiClient';
import { isKnownToxinSlug, toxinIdFromSlug } from '../../../services/atlasRouting';
import type { MoleculeRenderModel } from '../../../molecular/types';

const isStructureFormat = (value: string): value is 'sdf' | 'mol' | 'mol2' | 'pdb' | 'mmcif' =>
  ['sdf', 'mol', 'mol2', 'pdb', 'mmcif'].includes(value);

const supportedRepresentations: MolecularRepresentation[] = [
  'ball_and_stick',
  'stick',
  'space_filling',
  'two_dimensional_skeletal',
];

export interface MoleculePageProps {
  identityNoteOverride?: string;
  structurePanelTitleOverride?: string;
}

export interface MoleculePageOrchestration {
  toxinSlug: string | undefined;
  unknownSlug: boolean;
  data: ToxinDetail | null;
  renderModel: MoleculeRenderModel | null;
  identityNoteOverride: string | undefined;
  structurePanelTitleOverride: string | undefined;
}

export const useMoleculePageOrchestration = ({
  identityNoteOverride,
  structurePanelTitleOverride,
}: MoleculePageProps = {}): MoleculePageOrchestration => {
  const [data, setData] = useState<ToxinDetail | null>(null);
  const { toxinSlug } = useParams();
  const unknownSlug = toxinSlug ? !isKnownToxinSlug(toxinSlug) : false;

  useEffect(() => {
    if (unknownSlug) {
      setData(null);
      return;
    }

    atlasApi
      .getToxin(toxinIdFromSlug(toxinSlug))
      .then(setData)
      .catch((error: unknown) => console.error(error));
  }, [toxinSlug, unknownSlug]);

  const renderModel = useMemo<MoleculeRenderModel | null>(() => {
    if (!data?.molecularEntity) {
      return null;
    }

    const structureAsset = data.structureAssets.find((asset) => asset.verified);
    const structureFormat =
      structureAsset && isStructureFormat(structureAsset.format)
        ? structureAsset.format
        : undefined;

    return {
      entityId: data.molecularEntity.id,
      displayName: data.molecularEntity.displayName,
      molecularClass: data.molecularEntity.molecularClass,
      ...(structureFormat ? { structureFormat } : {}),
      ...(structureAsset?.localPath ? { structureUrl: structureAsset.localPath } : {}),
      defaultRepresentation: 'ball_and_stick' as MolecularRepresentation,
      supportedRepresentations,
      annotations: [
        {
          id: 'ann-scaffold-warning',
          label: 'Scaffold caution',
          description: 'Representation is educational; unresolved fields remain unsourced.',
        },
      ],
    };
  }, [data]);

  return {
    toxinSlug,
    unknownSlug,
    data,
    renderModel,
    identityNoteOverride,
    structurePanelTitleOverride,
  };
};
