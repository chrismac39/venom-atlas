import OrganismDetailPageHost from './components/OrganismDetailPageHost';
import {
  useOrganismDetailPageOrchestration,
  type OrganismDetailPageProps,
} from './hooks/useOrganismDetailPageOrchestration';

export const OrganismDetailPage = (props: OrganismDetailPageProps = {}) => {
  const orchestration = useOrganismDetailPageOrchestration(props);
  return <OrganismDetailPageHost orchestration={orchestration} />;
};
