import MoleculePageHost from './components/MoleculePageHost';
import {
  useMoleculePageOrchestration,
  type MoleculePageProps,
} from './hooks/useMoleculePageOrchestration';

export const MoleculePage = (props: MoleculePageProps = {}) => {
  const orchestration = useMoleculePageOrchestration(props);
  return <MoleculePageHost orchestration={orchestration} />;
};
