import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { VenomDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { EvidenceBadge } from '../../components/EvidenceBadge';
import { RouteEntityNotFound } from '../../components/RouteEntityNotFound';
import { VegaChart } from '../../visualizations/vega/VegaChart';
import { buildVenomCompositionSpec } from '../../visualizations/vega/venomCompositionSpec';
import {
  defaultOrganismSlug,
  isKnownOrganismSlug,
  organismIdFromSlug,
  toxinSlugFromId,
} from '../../services/atlasRouting';

interface VenomPageProps {
  organismSlugOverride?: string;
  mode?: 'full' | 'categorization' | 'charts';
}

export const VenomPage = ({ organismSlugOverride, mode = 'full' }: VenomPageProps = {}) => {
  const [data, setData] = useState<VenomDetail | null>(null);
  const { organismSlug: routeOrganismSlug } = useParams();
  const organismSlug = organismSlugOverride ?? routeOrganismSlug;
  const unknownSlug = organismSlug ? !isKnownOrganismSlug(organismSlug) : false;

  useEffect(() => {
    if (unknownSlug) {
      setData(null);
      return;
    }
    const load = async (): Promise<void> => {
      const organismId = organismIdFromSlug(organismSlug);
      const venoms = await atlasApi.getOrganismVenoms(organismId);
      const featuredVenom = venoms[0];
      if (!featuredVenom) {
        setData(null);
        return;
      }
      const venomDetail = await atlasApi.getVenom(featuredVenom.id);
      setData(venomDetail);
    };

    void load().catch(console.error);
  }, [organismSlug, unknownSlug]);

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

  const toxinFamilies = Array.from(
    new Set(data.toxins.map((toxin) => toxin.family).filter((family): family is string => Boolean(family))),
  );

  if (mode === 'categorization') {
    return (
      <section className="grid">
        <article className="panel">
          <h1>Toxin categorization</h1>
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
            <strong>Toxin families:</strong>{' '}
            {toxinFamilies.length > 0 ? toxinFamilies.join(', ') : 'Unclassified'}
          </p>
          <p>
            <strong>Component categories:</strong>{' '}
            {Array.from(new Set(data.components.map((component) => component.componentCategory))).join(
              ', ',
            ) || 'Not yet sourced'}
          </p>
        </section>
      </section>
    );
  }

  if (mode === 'charts') {
    return (
      <section className="grid">
        <VegaChart
          title="Toxin composition overview"
          summary="Evidence-aware BI charting. Unsourced values are intentionally left unquantified."
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
            Chart blocks are structured for classic BI-style expansion as additional quantitative
            evidence is added.
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
          This page distinguishes the ant organism, venom as a mixture, solenopsins as a family, and
          Solenopsin A as one featured molecular entity.
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
