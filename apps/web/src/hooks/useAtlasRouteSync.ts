import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAtlasSelection } from '../state/atlasSelection';

export const useAtlasRouteSync = (): void => {
  const { pathname } = useLocation();
  const { dispatch } = useAtlasSelection();

  useEffect(() => {
    dispatch({
      type: 'set',
      payload: {
        organismId: 'org-solenopsis-invicta',
        venomId: pathname.includes('/venom') ? 'ven-fire-ant-primary' : undefined,
        toxinId: pathname.includes('/toxins/solenopsin-a') ? 'tox-solenopsin-a' : undefined,
        mechanismStepId: pathname.includes('/mechanism') ? 'mech-1-exposure' : undefined,
        anatomicalSystemId: pathname.includes('/physiology') ? 'anat-skin' : undefined,
        geographicLayer: pathname.includes('/geography') ? 'introduced_range' : undefined,
      },
    });
  }, [dispatch, pathname]);
};
