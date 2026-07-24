import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAtlasSelection } from '../state/atlasSelection';
import {
  defaultOrganismSlug,
  isKnownOrganismSlug,
  isKnownToxinSlug,
  organismIdFromSlug,
  toxinIdFromSlug,
} from '../services/atlasRouting';

export const useAtlasRouteSync = (): void => {
  const { pathname } = useLocation();
  const { dispatch } = useAtlasSelection();

  useEffect(() => {
    const toxinSlugMatch = pathname.match(/^\/toxins\/([^/]+)/);
    const organismSlugMatch = pathname.match(/^\/organisms\/([^/]+)/);
    const toxinSlug = toxinSlugMatch?.[1];
    const organismSlug = organismSlugMatch?.[1];

    const resolvedOrganismId = organismSlug
      ? isKnownOrganismSlug(organismSlug)
        ? organismIdFromSlug(organismSlug)
        : null
      : organismIdFromSlug(defaultOrganismSlug);

    const resolvedToxinId = toxinSlug
      ? isKnownToxinSlug(toxinSlug)
        ? toxinIdFromSlug(toxinSlug)
        : null
      : null;

    const payload: {
      organismId?: string;
      venomId?: string;
      toxinId?: string;
      mechanismStepId?: string;
      anatomicalSystemId?: string;
      geographicLayer?: 'introduced_range';
    } = {};

    if (pathname.includes('/venom')) {
      payload.venomId = 'ven-fire-ant-primary';
    }

    if (pathname.includes('/mechanism')) {
      payload.mechanismStepId = 'mech-1-exposure';
    }

    if (pathname.includes('/physiology')) {
      payload.anatomicalSystemId = 'anat-skin';
    }

    if (pathname.includes('/geography')) {
      payload.geographicLayer = 'introduced_range';
    }

    if (resolvedOrganismId) {
      payload.organismId = resolvedOrganismId;
    }

    if (resolvedToxinId) {
      payload.toxinId = resolvedToxinId;
    }

    dispatch({
      type: 'set',
      payload,
    });
  }, [dispatch, pathname]);
};
