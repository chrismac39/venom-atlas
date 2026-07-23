import type { AtlasSelection } from '@venom-atlas/visualization-contracts';
import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';

type AtlasAction =
  { type: 'set'; payload: Partial<AtlasSelection> } | { type: 'reset'; organismId: string };

const reducer = (state: AtlasSelection, action: AtlasAction): AtlasSelection => {
  switch (action.type) {
    case 'set':
      return { ...state, ...action.payload };
    case 'reset':
      return { organismId: action.organismId };
    default:
      return state;
  }
};

const AtlasSelectionContext = createContext<{
  state: AtlasSelection;
  dispatch: Dispatch<AtlasAction>;
} | null>(null);

export const AtlasSelectionProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, { organismId: 'org-solenopsis-invicta' });
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <AtlasSelectionContext.Provider value={value}>{children}</AtlasSelectionContext.Provider>;
};

export const useAtlasSelection = (): { state: AtlasSelection; dispatch: Dispatch<AtlasAction> } => {
  const context = useContext(AtlasSelectionContext);
  if (!context) {
    throw new Error('useAtlasSelection must be used within AtlasSelectionProvider');
  }
  return context;
};
