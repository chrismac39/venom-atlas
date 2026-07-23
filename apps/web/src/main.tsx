import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AtlasSelectionProvider } from './state/atlasSelection';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AtlasSelectionProvider>
      <RouterProvider router={router} />
    </AtlasSelectionProvider>
  </React.StrictMode>,
);
