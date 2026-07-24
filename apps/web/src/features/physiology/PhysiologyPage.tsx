import PhysiologyPageHost from './components/PhysiologyPageHost';
import {
  usePhysiologyPageOrchestration,
  type PhysiologyPageProps,
} from './hooks/usePhysiologyPageOrchestration';

export const PhysiologyPage = (props: PhysiologyPageProps = {}) => {
  const orchestration = usePhysiologyPageOrchestration(props);
  return <PhysiologyPageHost orchestration={orchestration} />;
};
