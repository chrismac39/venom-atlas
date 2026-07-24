import { Link } from 'react-router-dom';
import type { OrganismsPageOrchestration } from '../hooks/useOrganismsPageOrchestration';

type OrganismsPageHostProps = {
  orchestration: OrganismsPageOrchestration;
};

const OrganismsPageHost = ({ orchestration }: OrganismsPageHostProps) => {
  const { embedded, entries, error, isLoading } = orchestration;

  return (
    <section className={`grid organisms-page${embedded ? ' organisms-page-embedded' : ''}`}>
      <header className="panel">
        <h1>Organisms</h1>
        <p>Organism discovery now starts in the landing selection panel.</p>
      </header>

      {error ? <section className="panel">{error}</section> : null}
      {isLoading ? <section className="panel">Loading organisms...</section> : null}

      {!error && entries.length > 0 ? (
        <section className="panel organism-directory-list organism-page-scroll-region">
          <ul className="organism-plain-list">
            {entries.map((entry) => (
              <li className="organism-plain-item" key={entry.id}>
                <Link to={entry.href}>{entry.scientificName}</Link>
                <span className="muted"> ({entry.commonName})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
};

export default OrganismsPageHost;
