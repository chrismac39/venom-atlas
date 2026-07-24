import type { MoleculeRenderModel } from '../types';
import { MoleculeViewer } from './MoleculeViewer';
import { useInteractionAnnotation } from '../hooks/useInteractionAnnotation';
import { CitationList } from '../../components/CitationList';
import type { Citation, EvidenceAssessment } from '@venom-atlas/domain';
import { useMemo, useState } from 'react';

const evidenceLevelLabel = (level: 'experimental' | 'computed' | 'illustrative'): string => {
  if (level === 'experimental') {
    return 'Experimental structure evidence';
  }
  if (level === 'computed') {
    return 'Computational structure evidence';
  }
  return 'Illustrative structure evidence';
};

export const StructureComplexViewer = ({
  model,
  annotationPath,
  citations,
  fallbackEvidence,
}: {
  model: MoleculeRenderModel;
  annotationPath?: string;
  citations: Citation[];
  fallbackEvidence: EvidenceAssessment;
}) => {
  const { annotation, loading, error } = useInteractionAnnotation(annotationPath);
  const [showIllustrativeScaffold, setShowIllustrativeScaffold] = useState(false);

  const shouldRenderComplex = useMemo(() => {
    if (!annotation) {
      return false;
    }

    if (annotation.evidence.level === 'illustrative') {
      return showIllustrativeScaffold;
    }

    return true;
  }, [annotation, showIllustrativeScaffold]);

  return (
    <section className="panel" aria-label="Target interaction viewer">
      <h3>Target interaction view</h3>
      <p className="muted">
        Displays a toxin-target structure context using static annotations. Interaction lines and distances are
        rendered only when explicitly annotated.
      </p>

      {loading ? <p className="muted">Loading interaction annotation...</p> : null}
      {error ? <p>{error}</p> : null}

      {annotation ? (
        <>
          <p>
            <strong>Evidence level:</strong> {evidenceLevelLabel(annotation.evidence.level)}
          </p>
          <p>
            <strong>Source:</strong> {annotation.evidence.source}
          </p>
          {annotation.evidence.notes ? (
            <p className="muted">{annotation.evidence.notes}</p>
          ) : null}
          <p>
            <strong>Target:</strong> {annotation.target.name} (chains: {annotation.target.chains.join(', ')})
          </p>
          <p>
            <strong>Venom component:</strong> {annotation.venomComponent.name} (chains:{' '}
            {annotation.venomComponent.chains.join(', ')})
          </p>
          {annotation.evidence.level === 'illustrative' ? (
            <>
              <p className="muted">
                This interaction scaffold is illustrative only. It should not be interpreted as a validated
                Solenopsin-target binding model.
              </p>
              {!showIllustrativeScaffold ? (
                <button type="button" onClick={() => setShowIllustrativeScaffold(true)}>
                  Show illustrative scaffold anyway
                </button>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <p className="muted">
          No structured interaction annotation is available for this toxin. You can still inspect geometry using
          available structural assets.
        </p>
      )}

      {shouldRenderComplex ? (
        <MoleculeViewer model={model} interactionAnnotation={annotation ?? undefined} title="Complex 3D viewer" />
      ) : null}

      {annotation ? (
        <section className="panel">
          <h4>Annotated residue contacts</h4>
          {annotation.interactions.length > 0 ? (
            <ul>
              {annotation.interactions.map((interaction) => (
                <li key={interaction.id}>
                  {interaction.type}: {interaction.toxinResidue.residueName}
                  {interaction.toxinResidue.residueNumber} ({interaction.toxinResidue.chain}) ↔{' '}
                  {interaction.targetResidue.residueName}
                  {interaction.targetResidue.residueNumber} ({interaction.targetResidue.chain})
                  {interaction.distanceAngstroms
                    ? `, ${interaction.distanceAngstroms.toFixed(1)} angstroms`
                    : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No residue-level contacts are currently annotated.</p>
          )}
        </section>
      ) : null}

      <section className="panel">
        <h4>Evidence and sources</h4>
        <p>
          <strong>Primary evidence confidence:</strong> {fallbackEvidence.confidence}
        </p>
        <CitationList citations={citations} />
      </section>
    </section>
  );
};
