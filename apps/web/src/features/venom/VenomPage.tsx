import VenomPageHost from './components/VenomPageHost';
import {
  useVenomPageOrchestration,
  type VenomPageProps,
} from './hooks/useVenomPageOrchestration';

export const VenomPage = (props: VenomPageProps = {}) => {
  const orchestration = useVenomPageOrchestration(props);
  return <VenomPageHost orchestration={orchestration} />;
};
