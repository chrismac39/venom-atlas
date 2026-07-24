import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { AnatomyHighlight } from '@venom-atlas/visualization-contracts';
import type { ToxinMechanismDetail, ToxinPhysiologyDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { RouteEntityNotFound } from '../../components/RouteEntityNotFound';
import { AnatomySvg } from '../../visualizations/svg/AnatomySvg';
import { VegaChart } from '../../visualizations/vega/VegaChart';
import { buildPhysiologyTimelineSpec } from '../../visualizations/vega/physiologyTimelineSpec';
import { defaultToxinSlug, isKnownToxinSlug, toxinIdFromSlug } from '../../services/atlasRouting';

const localHighlights: AnatomyHighlight[] = [
  {
    systemId: 'anat-skin',
    intensity: 'primary',
    label: 'Skin',
    explanation: 'Primary tissue site of sting and lesion progression.',
  },
  {
    systemId: 'anat-peripheral-nerves',
    intensity: 'primary',
    label: 'Peripheral sensory nerves',
    explanation: 'Associated with immediate pain and burning sensations.',
  },
  {
    systemId: 'anat-immune',
    intensity: 'secondary',
    label: 'Inflammatory/immune response',
    explanation: 'Shapes lesion and inflammatory manifestations.',
  },
  {
    systemId: 'anat-respiratory',
    intensity: 'context',
    label: 'Respiratory system',
    explanation: 'Systemic allergic pathway is possible but not default.',
  },
];

interface PhysiologyPageProps {
  headingOverride?: string;
  pathwaysTitleOverride?: string;
  timelineTitleOverride?: string;
  timelineSummaryOverride?: string;
}

export const PhysiologyPage = ({
  headingOverride,
  pathwaysTitleOverride,
  timelineTitleOverride,
  timelineSummaryOverride,
}: PhysiologyPageProps = {}) => {
  const [physiology, setPhysiology] = useState<ToxinPhysiologyDetail | null>(null);
  const [mechanism, setMechanism] = useState<ToxinMechanismDetail | null>(null);
  const { toxinSlug } = useParams();
  const unknownSlug = toxinSlug ? !isKnownToxinSlug(toxinSlug) : false;

  useEffect(() => {
    if (unknownSlug) {
      setPhysiology(null);
      setMechanism(null);
      return;
    }
    const toxinId = toxinIdFromSlug(toxinSlug);
    atlasApi.getToxinPhysiology(toxinId).then(setPhysiology).catch(console.error);
    atlasApi.getToxinMechanism(toxinId).then(setMechanism).catch(console.error);
  }, [toxinSlug, unknownSlug]);

  if (unknownSlug) {
    return (
      <RouteEntityNotFound
        title="Physiology page unavailable"
        message={`No toxin is mapped to slug "${toxinSlug}".`}
        fallbackHref={`/toxins/${defaultToxinSlug}/physiology`}
        fallbackLabel="Open Solenopsin A physiology"
      />
    );
  }

  const directEffects = useMemo(
    () =>
      physiology?.physiologicalEffects.filter((entry) => entry.pathwayType === 'direct_venom') ??
      [],
    [physiology],
  );
  const immuneEffects = useMemo(
    () =>
      physiology?.physiologicalEffects.filter((entry) => entry.pathwayType !== 'direct_venom') ??
      [],
    [physiology],
  );

  return (
    <section className="grid">
      <h1>{headingOverride ?? 'Human physiology effects'}</h1>
      <AnatomySvg highlights={localHighlights} />

      <section className="panel">
        <h3>{pathwaysTitleOverride ?? 'Direct versus immune-mediated pathways'}</h3>
        <p>
          <strong>Direct local venom effect:</strong>{' '}
          {directEffects.map((entry) => entry.title).join(', ')}
        </p>
        <p>
          <strong>Inflammatory or immune-mediated:</strong>{' '}
          {immuneEffects.map((entry) => entry.title).join(', ')}
        </p>
      </section>

      <VegaChart
        title={timelineTitleOverride ?? 'Sting progression timeline'}
        summary={
          timelineSummaryOverride ??
          'Distinguishes direct local effects from inflammatory and separate systemic allergic pathways.'
        }
        spec={buildPhysiologyTimelineSpec(mechanism?.mechanismSteps ?? [])}
        empty={!mechanism || mechanism.mechanismSteps.length === 0}
      />
    </section>
  );
};
