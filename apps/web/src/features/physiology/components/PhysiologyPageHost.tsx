import { RouteEntityNotFound } from '../../../components/RouteEntityNotFound';
import { AnatomySvg } from '../../../visualizations/svg/AnatomySvg';
import { VegaChart } from '../../../visualizations/vega/VegaChart';
import { buildPhysiologyTimelineSpec } from '../../../visualizations/vega/physiologyTimelineSpec';
import { defaultToxinSlug } from '../../../services/atlasRouting';
import type { PhysiologyPageOrchestration } from '../hooks/usePhysiologyPageOrchestration';
import { localHighlights } from '../hooks/usePhysiologyPageOrchestration';

type PhysiologyPageHostProps = {
  orchestration: PhysiologyPageOrchestration;
};

const PhysiologyPageHost = ({ orchestration }: PhysiologyPageHostProps) => {
  const {
    toxinSlug,
    unknownSlug,
    mechanism,
    directEffects,
    immuneEffects,
    headingOverride,
    pathwaysTitleOverride,
    timelineTitleOverride,
    timelineSummaryOverride,
  } = orchestration;

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

  return (
    <section className="grid">
      <h1>{headingOverride ?? 'Human physiology effects'}</h1>
      <AnatomySvg highlights={localHighlights} />

      <section className="panel">
        <h3>{pathwaysTitleOverride ?? 'Direct versus immune-mediated pathways'}</h3>
        <p>
          <strong>Direct local venom effect:</strong> {directEffects.join(', ')}
        </p>
        <p>
          <strong>Inflammatory or immune-mediated:</strong> {immuneEffects.join(', ')}
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

export default PhysiologyPageHost;
