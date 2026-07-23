import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { AtlasMonopage } from '../features/atlas/AtlasMonopage';
import { NotFoundPage } from '../features/atlas/NotFoundPage';
import { OrganismsPage } from '../features/organism/OrganismsPage';
import { OrganismDetailPage } from '../features/organism/OrganismDetailPage';
import { VenomPage } from '../features/venom/VenomPage';
import { MoleculePage } from '../features/molecule/MoleculePage';
import { MechanismPage } from '../features/mechanism/MechanismPage';
import { PhysiologyPage } from '../features/physiology/PhysiologyPage';
import { GeographyPage } from '../features/geography/GeographyPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <AtlasMonopage /> },
      { path: 'organisms', element: <OrganismsPage /> },
      { path: 'organisms/:organismSlug', element: <OrganismDetailPage /> },
      { path: 'organisms/:organismSlug/venom', element: <VenomPage /> },
      { path: 'toxins/:toxinSlug', element: <MoleculePage /> },
      { path: 'toxins/:toxinSlug/mechanism', element: <MechanismPage /> },
      { path: 'toxins/:toxinSlug/physiology', element: <PhysiologyPage /> },
      { path: 'organisms/:organismSlug/geography', element: <GeographyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
