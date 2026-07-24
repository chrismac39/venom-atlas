import { useEffect, useState } from 'react';
import type { Organism } from '@venom-atlas/domain';
import { atlasApi } from '../../../services/apiClient';
import { organismSlugFromId } from '../../../services/atlasRouting';

export interface OrganismsPageProps {
  embedded?: boolean;
}

export interface OrganismDirectoryEntry {
  id: string;
  scientificName: string;
  commonName: string;
  href: string;
}

export interface OrganismsPageOrchestration {
  embedded: boolean;
  entries: OrganismDirectoryEntry[];
  error: string | null;
  isLoading: boolean;
}

const toEntry = (organism: Organism): OrganismDirectoryEntry => ({
  id: organism.id,
  scientificName: organism.scientificName,
  commonName: organism.commonName,
  href: `/organisms/${organismSlugFromId(organism.id)}`,
});

export const useOrganismsPageOrchestration = ({ embedded = false }: OrganismsPageProps) => {
  const [entries, setEntries] = useState<OrganismDirectoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const payload = await atlasApi.listOrganisms();
      const sorted = [...payload].sort((a, b) => a.scientificName.localeCompare(b.scientificName));
      setEntries(sorted.map(toEntry));
    };

    void load().catch((loadError: unknown) => {
      console.error(loadError);
      setError('Failed to load organism directory. Please try again.');
    });
  }, []);

  return {
    embedded,
    entries,
    error,
    isLoading: !error && entries.length === 0,
  } satisfies OrganismsPageOrchestration;
};
