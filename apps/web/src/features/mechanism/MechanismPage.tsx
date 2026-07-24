import MechanismPageHost from './components/MechanismPageHost';
import {
  useMechanismPageOrchestration,
  type MechanismPageProps,
} from './hooks/useMechanismPageOrchestration';

export const MechanismPage = (props: MechanismPageProps = {}) => {
  const orchestration = useMechanismPageOrchestration(props);
  return <MechanismPageHost orchestration={orchestration} />;
};
