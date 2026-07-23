import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Organism } from '@venom-atlas/domain';
import { atlasApi } from '../../services/apiClient';
import { organismSlugFromId } from '../../services/atlasRouting';

interface OrganismsPageProps {
  embedded?: boolean;
}

export const OrganismsPage = ({ embedded = false }: OrganismsPageProps) => {
  const [organisms, setOrganisms] = useState<Organism[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const payload = await atlasApi.listOrganisms();
      setOrganisms(
        [...payload].sort((a, b) => a.scientificName.localeCompare(b.scientificName)),
      );
    };

    void load().catch((loadError: unknown) => {
      console.error(loadError);
      setError('Failed to load organism directory. Please try again.');
    });
  }, []);

  return (
    <section className={`grid organisms-page${embedded ? ' organisms-page-embedded' : ''}`}>
      <header className="panel">
        <h1>Organisms</h1>
        <p>Organism discovery now starts in the landing selection panel.</p>
      </header>

      {error ? <section className="panel">{error}</section> : null}
      {!error && organisms.length === 0 ? <section className="panel">Loading organisms...</section> : null}

      {!error && organisms.length > 0 ? (
        <section className="panel organism-directory-list organism-page-scroll-region">
          <ul className="organism-plain-list">
            {organisms.map((organism) => (
              <li className="organism-plain-item" key={organism.id}>
                <Link to={`/organisms/${organismSlugFromId(organism.id)}`}>
                  {organism.scientificName}
                </Link>
                <span className="muted"> ({organism.commonName})</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
};
