import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Organism } from '@venom-atlas/domain';
import { atlasApi } from '../../services/apiClient';

export const OrganismsPage = () => {
  const [organisms, setOrganisms] = useState<Organism[]>([]);

  useEffect(() => {
    atlasApi.listOrganisms().then(setOrganisms).catch(console.error);
  }, []);

  return (
    <section className="panel">
      <h1>Organisms</h1>
      <ul>
        {organisms.map((organism) => (
          <li key={organism.id}>
            <Link to="/organisms/solenopsis-invicta">{organism.scientificName}</Link> -{' '}
            {organism.commonName}
          </li>
        ))}
      </ul>
    </section>
  );
};
