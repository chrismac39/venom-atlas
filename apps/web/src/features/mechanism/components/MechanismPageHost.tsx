import { RouteEntityNotFound } from '../../../components/RouteEntityNotFound';
import { DeliveryMechanismDiagram } from '../../../visualizations/svg/DeliveryMechanismDiagram';
import {
  defaultOrganismSlug,
  defaultToxinSlug,
} from '../../../services/atlasRouting';
import type { MechanismPageOrchestration } from '../hooks/useMechanismPageOrchestration';

type MechanismPageHostProps = {
  orchestration: MechanismPageOrchestration;
};

const MechanismPageHost = ({ orchestration }: MechanismPageHostProps) => {
  const {
    toxinSlug,
    mechanismOrganismSlug,
    unknownToxinSlug,
    unknownOrganismSlug,
    organismName,
    naturalSteps,
    humanSteps,
    naturalTitleOverride,
    humanTitleOverride,
  } = orchestration;

  if (unknownToxinSlug) {
    return (
      <RouteEntityNotFound
        title="Mechanism page unavailable"
        message={`No toxin is mapped to slug "${toxinSlug}".`}
        fallbackHref={`/toxins/${defaultToxinSlug}/mechanism`}
        fallbackLabel="Open Solenopsin A mechanism"
      />
    );
  }

  if (unknownOrganismSlug) {
    return (
      <RouteEntityNotFound
        title="Mechanism page unavailable"
        message={`No organism is mapped to slug "${mechanismOrganismSlug}".`}
        fallbackHref={`/organisms/${defaultOrganismSlug}`}
        fallbackLabel="Open default organism"
      />
    );
  }

  return (
    <section className="grid">
      <section className="panel">
        <h1>Delivery mechanism schematics</h1>
        <p className="muted">
          Two reusable views for {organismName}: ecological interaction flow and human interaction flow.
        </p>
      </section>

      <section className="grid">
        <DeliveryMechanismDiagram
          title={naturalTitleOverride ?? 'Natural mechanism: prey subduing'}
          ariaLabel={`Schematic of ${organismName} delivering toxin in ecological interactions`}
          steps={naturalSteps}
        />

        <DeliveryMechanismDiagram
          title={humanTitleOverride ?? 'Human interaction mechanism'}
          ariaLabel={`Schematic of ${organismName} interaction leading to human exposure`}
          steps={humanSteps}
        />
      </section>
    </section>
  );
};

export default MechanismPageHost;
