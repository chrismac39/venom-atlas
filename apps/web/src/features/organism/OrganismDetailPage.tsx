import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { OrganismDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { DeliveryMechanismDiagram } from '../../visualizations/svg/DeliveryMechanismDiagram';
import { EvidenceBadge } from '../../components/EvidenceBadge';

export const OrganismDetailPage = () => {
  const [data, setData] = useState<OrganismDetail | null>(null);

  useEffect(() => {
    atlasApi.getOrganism('org-solenopsis-invicta').then(setData).catch(console.error);
  }, []);

  if (!data) {
    return <section className="panel">Loading organism...</section>;
  }

  return (
    <section className="grid">
      <article className="panel">
        <h1>
          {data.organism.scientificName} ({data.organism.commonName})
        </h1>
        <EvidenceBadge evidence={data.organism.evidence} />
        <p>{data.organism.overview}</p>
        <div className="rule" />
        <h2>Taxonomy</h2>
        <p className="muted">
          {data.taxonomy?.family} / {data.taxonomy?.genus} / {data.taxonomy?.species}
        </p>
        <h2>Natural history</h2>
        <ul>
          {data.organism.naturalHistory.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      </article>

      <div className="grid grid-2">
        <section className="panel">
          <h3>Organism image</h3>
          <p>Placeholder asset only. Source-verified photograph pending.</p>
        </section>
        <section className="panel">
          <h3>Range map panel</h3>
          <Link to="/organisms/solenopsis-invicta/geography">Open geography page</Link>
        </section>
      </div>

      <DeliveryMechanismDiagram />

      <section className="panel">
        <h3>Linked atlas paths</h3>
        <ul>
          <li>
            <Link to="/organisms/solenopsis-invicta/venom">View venom story</Link>
          </li>
          <li>
            <Link to="/toxins/solenopsin-a">View Solenopsin A molecule page</Link>
          </li>
        </ul>
      </section>
    </section>
  );
};
