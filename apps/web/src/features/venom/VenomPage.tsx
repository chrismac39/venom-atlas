import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { VenomDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { EvidenceBadge } from '../../components/EvidenceBadge';
import { VegaChart } from '../../visualizations/vega/VegaChart';
import { buildVenomCompositionSpec } from '../../visualizations/vega/venomCompositionSpec';

export const VenomPage = () => {
  const [data, setData] = useState<VenomDetail | null>(null);

  useEffect(() => {
    atlasApi.getVenom('ven-fire-ant-primary').then(setData).catch(console.error);
  }, []);

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
        <Link to="/toxins/solenopsin-a">Open Solenopsin A page</Link>
      </section>
    </section>
  );
};
