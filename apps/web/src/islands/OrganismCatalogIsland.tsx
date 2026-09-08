import type { AtlasOrganismData } from '../features/atlas/atlas-types';
import { OrganismCatalogHost } from '../features/catalog/components/OrganismCatalogHost';
import { useOrganismCatalogOrchestration } from '../features/catalog/hooks/useOrganismCatalogOrchestration';

interface Props {
  organisms: AtlasOrganismData[];
}

export const OrganismCatalogIsland = ({ organisms }: Props) => {
  const model = useOrganismCatalogOrchestration(organisms);
  return <OrganismCatalogHost {...model} />;
};
