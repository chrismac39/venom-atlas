import GeographyPageHost from './components/GeographyPageHost';
import {
  useGeographyPageOrchestration,
  type GeographyPageProps,
} from './hooks/useGeographyPageOrchestration';

export const GeographyPage = (props: GeographyPageProps = {}) => {
  const orchestration = useGeographyPageOrchestration(props);
  return <GeographyPageHost orchestration={orchestration} />;
};
