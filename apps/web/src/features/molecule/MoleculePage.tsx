import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MolecularRepresentation } from '@venom-atlas/visualization-contracts';
import type { ToxinDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { EvidenceBadge } from '../../components/EvidenceBadge';
import { CitationList } from '../../components/CitationList';
import { MoleculeViewer } from '../../molecular/components/MoleculeViewer';

const isStructureFormat = (value: string): value is 'sdf' | 'mol' | 'mol2' | 'pdb' | 'mmcif' =>
  ['sdf', 'mol', 'mol2', 'pdb', 'mmcif'].includes(value);

const supportedRepresentations: MolecularRepresentation[] = [
  'ball_and_stick',
  'stick',
  'space_filling',
  'two_dimensional_skeletal',
];

export const MoleculePage = () => {
  const [data, setData] = useState<ToxinDetail | null>(null);

  useEffect(() => {
    atlasApi.getToxin('tox-solenopsin-a').then(setData).catch(console.error);
  }, []);

  const renderModel = useMemo(() => {
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
      structureFormat,
      structureUrl: structureAsset?.localPath,
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

  if (!data || !data.molecularEntity) {
    return <section className="panel">No molecular entity available.</section>;
  }

  return (
    <section className="grid">
      <article className="panel">
        <h1>{data.molecularEntity.displayName}</h1>
        <EvidenceBadge evidence={data.molecularEntity.evidence} />
        <p>
          <strong>Molecular class:</strong> {data.molecularEntity.molecularClass}
        </p>
        <p>
          <strong>Formula:</strong> {data.molecularEntity.formula ?? 'Data not yet sourced.'}
        </p>
        <p>
          <strong>Molecular weight:</strong>{' '}
          {data.molecularEntity.molecularWeight ?? 'Data not yet sourced.'}
        </p>
        <p>
          <strong>Structure-data source:</strong>{' '}
          {data.molecularEntity.structureDataSource ?? 'Data not yet sourced.'}
        </p>
        <p className="muted">
          Distinction: molecular identity (entity), molecular geometry (structure file), visual
          representation (rendering mode), and biological effect (separate mechanism pages).
        </p>
      </article>

      {renderModel ? <MoleculeViewer model={renderModel} /> : null}

      <section className="panel">
        <h3>2D structure panel</h3>
        <p>Asset not yet sourced from a verified structure source.</p>
      </section>

      <section className="panel">
        <h3>Evidence and sources</h3>
        <CitationList citationIds={data.molecularEntity.evidence.citationIds} />
      </section>

      <section className="panel">
        <Link to="/toxins/solenopsin-a/mechanism">Continue to mechanism page</Link>
      </section>
    </section>
  );
};
