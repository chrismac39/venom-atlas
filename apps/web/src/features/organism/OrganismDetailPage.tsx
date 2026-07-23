import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { OrganismDetail } from '../../services/contracts';
import { atlasApi } from '../../services/apiClient';
import { DeliveryMechanismDiagram } from '../../visualizations/svg/DeliveryMechanismDiagram';
import { EvidenceBadge } from '../../components/EvidenceBadge';
import { RouteEntityNotFound } from '../../components/RouteEntityNotFound';
import {
  defaultOrganismSlug,
  defaultToxinId,
  isKnownOrganismSlug,
  organismIdFromSlug,
  organismSlugFromId,
  toxinSlugFromId,
} from '../../services/atlasRouting';

export const OrganismDetailPage = () => {
  const [data, setData] = useState<OrganismDetail | null>(null);
  const { organismSlug } = useParams();
  const unknownSlug = organismSlug ? !isKnownOrganismSlug(organismSlug) : false;

  useEffect(() => {
    if (unknownSlug) {
      setData(null);
      return;
    }
    atlasApi.getOrganism(organismIdFromSlug(organismSlug)).then(setData).catch(console.error);
  }, [organismSlug, unknownSlug]);

  if (unknownSlug) {
    return (
      <RouteEntityNotFound
        title="Organism not found"
        message={`No organism is mapped to slug "${organismSlug}".`}
        fallbackHref={`/organisms/${defaultOrganismSlug}`}
        fallbackLabel="Open Solenopsis invicta"
      />
    );
  }

  const resolvedOrganismSlug = organismSlugFromId(data?.organism.id);

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
          <Link to={`/organisms/${resolvedOrganismSlug}/geography`}>Open geography page</Link>
        </section>
      </div>

      <DeliveryMechanismDiagram />

      <section className="panel">
        <h3>Linked atlas paths</h3>
        <ul>
          <li>
            <Link to={`/organisms/${resolvedOrganismSlug}/venom`}>View venom story</Link>
          </li>
          <li>
            <Link to={`/toxins/${toxinSlugFromId('tox-solenopsin-a')}`}>
              View Solenopsin A molecule page
            </Link>
          </li>
        </ul>
      </section>
    </section>
  );
};
