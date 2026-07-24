import NotFoundPageHost from './components/NotFoundPageHost';
import { useNotFoundPageOrchestration } from './hooks/useNotFoundPageOrchestration';

export const NotFoundPage = () => {
  const orchestration = useNotFoundPageOrchestration();
  return <NotFoundPageHost orchestration={orchestration} />;
};
