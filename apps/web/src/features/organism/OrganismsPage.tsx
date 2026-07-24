import OrganismsPageHost from './components/OrganismsPageHost';
import {
  useOrganismsPageOrchestration,
  type OrganismsPageProps,
} from './hooks/useOrganismsPageOrchestration';

export const OrganismsPage = (props: OrganismsPageProps = {}) => {
  const orchestration = useOrganismsPageOrchestration(props);
  return <OrganismsPageHost orchestration={orchestration} />;
};
