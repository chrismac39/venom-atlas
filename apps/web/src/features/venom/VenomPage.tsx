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

export const VenomPage = () => {
  const [data, setData] = useState<VenomDetail | null>(null);
  const { organismSlug } = useParams();
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
