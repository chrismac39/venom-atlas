import { useLocation } from 'react-router-dom';
import { defaultOrganismSlug } from '../../../services/atlasRouting';

export interface NotFoundPageOrchestration {
  pathname: string;
  homeHref: string;
  defaultOrganismHref: string;
}

export const useNotFoundPageOrchestration = (): NotFoundPageOrchestration => {
  const location = useLocation();

  return {
    pathname: location.pathname,
    homeHref: '/',
    defaultOrganismHref: `/organisms/${defaultOrganismSlug}`,
  };
};
