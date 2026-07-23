import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { LandingPage } from '../features/atlas/LandingPage';
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
      { index: true, element: <LandingPage /> },
      { path: 'organisms', element: <OrganismsPage /> },
      { path: 'organisms/solenopsis-invicta', element: <OrganismDetailPage /> },
      { path: 'organisms/solenopsis-invicta/venom', element: <VenomPage /> },
      { path: 'toxins/solenopsin-a', element: <MoleculePage /> },
      { path: 'toxins/solenopsin-a/mechanism', element: <MechanismPage /> },
      { path: 'toxins/solenopsin-a/physiology', element: <PhysiologyPage /> },
      { path: 'organisms/solenopsis-invicta/geography', element: <GeographyPage /> },
    ],
  },
]);
