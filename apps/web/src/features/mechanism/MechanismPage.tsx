import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MechanismStep } from '@venom-atlas/domain';
import type { ToxinMechanismDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { EvidenceBadge } from '../../components/EvidenceBadge';
import { CitationList } from '../../components/CitationList';

export const MechanismPage = () => {
  const [data, setData] = useState<ToxinMechanismDetail | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  useEffect(() => {
    atlasApi.getToxinMechanism('tox-solenopsin-a').then((payload) => {
      setData(payload);
      setSelectedStepId(payload.mechanismSteps[0]?.id ?? null);
    });
  }, []);

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
        <Link to="/toxins/solenopsin-a/physiology">Continue to physiology page</Link>
      </section>
    </section>
  );
};
