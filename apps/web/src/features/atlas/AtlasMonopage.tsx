import AtlasMonopageHost from './components/AtlasMonopageHost';
import { useAtlasMonopageOrchestration } from './hooks/useAtlasMonopageOrchestration';

export const AtlasMonopage = () => {
  const orchestration = useAtlasMonopageOrchestration();
  return <AtlasMonopageHost orchestration={orchestration} />;
};
