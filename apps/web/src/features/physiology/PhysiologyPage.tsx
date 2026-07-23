import { useEffect, useMemo, useState } from 'react';
import type { AnatomyHighlight } from '@venom-atlas/visualization-contracts';
import type { ToxinMechanismDetail, ToxinPhysiologyDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { AnatomySvg } from '../../visualizations/svg/AnatomySvg';
import { VegaChart } from '../../visualizations/vega/VegaChart';
import { buildPhysiologyTimelineSpec } from '../../visualizations/vega/physiologyTimelineSpec';

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

export const PhysiologyPage = () => {
  const [physiology, setPhysiology] = useState<ToxinPhysiologyDetail | null>(null);
  const [mechanism, setMechanism] = useState<ToxinMechanismDetail | null>(null);

  useEffect(() => {
    atlasApi.getToxinPhysiology('tox-solenopsin-a').then(setPhysiology).catch(console.error);
    atlasApi.getToxinMechanism('tox-solenopsin-a').then(setMechanism).catch(console.error);
  }, []);

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
      <h1>Human physiology effects</h1>
      <AnatomySvg highlights={localHighlights} />

      <section className="panel">
        <h3>Direct versus immune-mediated pathways</h3>
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
        title="Sting progression timeline"
        summary="Distinguishes direct local effects from inflammatory and separate systemic allergic pathways."
        spec={buildPhysiologyTimelineSpec(mechanism?.mechanismSteps ?? [])}
        empty={!mechanism || mechanism.mechanismSteps.length === 0}
      />
    </section>
  );
};
