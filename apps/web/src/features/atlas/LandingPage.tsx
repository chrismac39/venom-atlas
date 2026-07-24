import LandingPageHost from './components/LandingPageHost';
import { useLandingPageOrchestration } from './hooks/useLandingPageOrchestration';

export const LandingPage = () => {
  const orchestration = useLandingPageOrchestration();
  return <LandingPageHost orchestration={orchestration} />;
};
