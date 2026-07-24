import { Link } from 'react-router-dom';
import { EvidenceBadge } from '../../../components/EvidenceBadge';
import { CitationList } from '../../../components/CitationList';
import { RouteEntityNotFound } from '../../../components/RouteEntityNotFound';
import { MoleculeViewer } from '../../../molecular/components/MoleculeViewer';
import {
  defaultToxinSlug,
  toxinSlugFromId,
} from '../../../services/atlasRouting';
import type { MoleculePageOrchestration } from '../hooks/useMoleculePageOrchestration';

type MoleculePageHostProps = {
  orchestration: MoleculePageOrchestration;
};

const MoleculePageHost = ({ orchestration }: MoleculePageHostProps) => {
  const {
    toxinSlug,
    unknownSlug,
    data,
    renderModel,
    identityNoteOverride,
    structurePanelTitleOverride,
  } = orchestration;

  if (unknownSlug) {
    return (
      <RouteEntityNotFound
        title="Molecule not found"
        message={`No toxin is mapped to slug "${toxinSlug}".`}
        fallbackHref={`/toxins/${defaultToxinSlug}`}
        fallbackLabel="Open Solenopsin A"
      />
    );
  }

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
          <strong>Molecular weight:</strong> {data.molecularEntity.molecularWeight ?? 'Data not yet sourced.'}
        </p>
        <p>
          <strong>Structure-data source:</strong>{' '}
          {data.molecularEntity.structureDataSource ?? 'Data not yet sourced.'}
        </p>
        <p className="muted">
          {identityNoteOverride ??
            'Distinction: molecular identity (entity), molecular geometry (structure file), visual representation (rendering mode), and biological effect (separate mechanism pages).'}
        </p>
      </article>

      {renderModel ? <MoleculeViewer model={renderModel} /> : null}

      <section className="panel">
        <h3>{structurePanelTitleOverride ?? '2D structure panel'}</h3>
        <p>Asset not yet sourced from a verified structure source.</p>
      </section>

      <section className="panel">
        <h3>Evidence and sources</h3>
        <CitationList citationIds={data.molecularEntity.evidence.citationIds} />
      </section>

      <section className="panel">
        <Link to={`/toxins/${toxinSlugFromId(data.toxin.id)}/mechanism`}>Continue to mechanism page</Link>
      </section>
    </section>
  );
};

export default MoleculePageHost;
