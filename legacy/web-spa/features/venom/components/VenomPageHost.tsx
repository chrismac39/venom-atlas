import { Link } from 'react-router-dom';
import { EvidenceBadge } from '../../../components/EvidenceBadge';
import { RouteEntityNotFound } from '../../../components/RouteEntityNotFound';
import { VegaChart } from '../../../visualizations/vega/VegaChart';
import { buildVenomCompositionSpec } from '../../../visualizations/vega/venomCompositionSpec';
import {
  defaultOrganismSlug,
  toxinSlugFromId,
} from '../../../services/atlasRouting';
import type { VenomPageOrchestration } from '../hooks/useVenomPageOrchestration';

type VenomPageHostProps = {
  orchestration: VenomPageOrchestration;
};

const VenomPageHost = ({ orchestration }: VenomPageHostProps) => {
  const {
    organismSlug,
    unknownSlug,
    mode,
    data,
    toxinFamilies,
    categorizationTitleOverride,
    chartsTitleOverride,
    chartsSummaryOverride,
  } = orchestration;

  if (unknownSlug) {
    return (
      <RouteEntityNotFound
        title="Venom page unavailable"
        message={`No organism is mapped to slug "${organismSlug}".`}
        fallbackHref={`/organisms/${defaultOrganismSlug}/venom`}
        fallbackLabel="Open Solenopsis invicta venom"
      />
    );
  }

  if (!data) {
    return <section className="panel">Loading venom profile...</section>;
  }

  if (mode === 'categorization') {
    return (
      <section className="grid">
        <article className="panel">
          <h1>{categorizationTitleOverride ?? 'Toxin categorization'}</h1>
          <p>{data.venom.description}</p>
          <p>
            <strong>Venom profile:</strong> {data.venom.name}
          </p>
          <p>
            <strong>Biological role:</strong> {data.venom.ecologicalRoleSummary}
          </p>
          <EvidenceBadge evidence={data.venom.evidence} />
        </article>

        <section className="panel">
          <h3>Category coverage</h3>
          <p>
            <strong>Toxin entities:</strong> {data.toxins.length}
          </p>
          <p>
            <strong>Toxin families:</strong> {toxinFamilies.length > 0 ? toxinFamilies.join(', ') : 'Unclassified'}
          </p>
          <p>
            <strong>Component categories:</strong>{' '}
            {Array.from(new Set(data.components.map((component) => component.componentCategory))).join(', ') ||
              'Not yet sourced'}
          </p>
        </section>
      </section>
    );
  }

  if (mode === 'charts') {
    return (
      <section className="grid">
        <VegaChart
          title={chartsTitleOverride ?? 'Toxin composition overview'}
          summary={
            chartsSummaryOverride ??
            'Evidence-aware BI charting. Unsourced values are intentionally left unquantified.'
          }
          spec={buildVenomCompositionSpec(data.components)}
        />

        <section className="panel">
          <h3>BI summary signals</h3>
          <p>
            <strong>Quantified toxin % breakdown:</strong> Not yet sourced with sufficient confidence.
          </p>
          <p>
            <strong>Fatal dose estimates:</strong> Not yet sourced for this atlas sample.
          </p>
          <p>
            <strong>Chemical category breakdown:</strong> {data.components.length} categorized component
            {data.components.length === 1 ? '' : 's'} tracked.
          </p>
          <p className="muted">
            Chart blocks are structured for classic BI-style expansion as additional quantitative evidence is added.
          </p>
        </section>
      </section>
    );
  }

  return (
    <section className="grid">
      <article className="panel">
        <h1>{data.venom.name}</h1>
        <EvidenceBadge evidence={data.venom.evidence} />
        <p>{data.venom.description}</p>
        <p>
          <strong>Biological role:</strong> {data.venom.ecologicalRoleSummary}
        </p>
        <p className="muted">
          This page distinguishes the ant organism, venom as a mixture, solenopsins as a family, and Solenopsin A as
          one featured molecular entity.
        </p>
      </article>

      <VegaChart
        title="Evidence-aware venom component view"
        summary="Qualitative categories are shown without fabricated percentages."
        spec={buildVenomCompositionSpec(data.components)}
      />

      <section className="panel">
        <h3>Featured compounds</h3>
        <ul>
          {data.toxins.map((toxin) => (
            <li key={toxin.id}>
              <strong>{toxin.displayName}</strong> - {toxin.family ?? 'Family not yet sourced'}
              <div>
                <EvidenceBadge evidence={toxin.evidence} />
              </div>
            </li>
          ))}
        </ul>
        <Link to={`/toxins/${toxinSlugFromId('tox-solenopsin-a')}`}>Open Solenopsin A page</Link>
      </section>
    </section>
  );
};

export default VenomPageHost;
