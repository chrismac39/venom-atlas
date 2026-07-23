import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { MechanismStep } from '@venom-atlas/domain';
import type { ToxinMechanismDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { EvidenceBadge } from '../../components/EvidenceBadge';
import { CitationList } from '../../components/CitationList';
import { RouteEntityNotFound } from '../../components/RouteEntityNotFound';
import {
  defaultToxinSlug,
  isKnownToxinSlug,
  toxinIdFromSlug,
  toxinSlugFromId,
} from '../../services/atlasRouting';

export const MechanismPage = () => {
  const [data, setData] = useState<ToxinMechanismDetail | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const { toxinSlug } = useParams();
  const unknownSlug = toxinSlug ? !isKnownToxinSlug(toxinSlug) : false;

  useEffect(() => {
    if (unknownSlug) {
      setData(null);
      return;
    }
    atlasApi.getToxinMechanism(toxinIdFromSlug(toxinSlug)).then((payload) => {
      setData(payload);
      setSelectedStepId(payload.mechanismSteps[0]?.id ?? null);
    });
  }, [toxinSlug, unknownSlug]);

  if (unknownSlug) {
    return (
      <RouteEntityNotFound
        title="Mechanism page unavailable"
        message={`No toxin is mapped to slug "${toxinSlug}".`}
        fallbackHref={`/toxins/${defaultToxinSlug}/mechanism`}
        fallbackLabel="Open Solenopsin A mechanism"
      />
    );
  }

  const sortedSteps = useMemo(
    () => (data ? [...data.mechanismSteps].sort((a, b) => a.order - b.order) : []),
    [data],
  );

  const selectedStep: MechanismStep | null =
    sortedSteps.find((step) => step.id === selectedStepId) ?? sortedSteps[0] ?? null;

  if (!data || !selectedStep) {
    return <section className="panel">Loading mechanism...</section>;
  }

  return (
    <section className="grid grid-2">
      <section className="panel">
        <h1>Mechanism chain</h1>
        <p className="muted">
          Conservatively modeled sequence. Uncertain mechanisms are marked with lower confidence.
        </p>
        <ol>
          {sortedSteps.map((step) => (
            <li key={step.id}>
              <button type="button" onClick={() => setSelectedStepId(step.id)}>
                {step.order}. {step.title}
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h3>{selectedStep.title}</h3>
        <p>{selectedStep.description}</p>
        <p>
          <strong>Level:</strong> {selectedStep.level}
        </p>
        <EvidenceBadge evidence={selectedStep.evidence} />
        <h4>Sources</h4>
        <CitationList citationIds={selectedStep.evidence.citationIds} />
        <p className="muted">
          Competing interpretations and unresolved target specificity remain possible in this
          sample.
        </p>
        <Link to={`/toxins/${toxinSlugFromId(data.toxin.id)}/physiology`}>
          Continue to physiology page
        </Link>
      </section>
    </section>
  );
};
