import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { App } from './App';
import { RouterProvider } from './lib/router';
import { ProfileProvider } from './hooks/useProfile';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ProfileProvider>
      <RouterProvider>
        <App />
      </RouterProvider>
    </ProfileProvider>
  </StrictMode>,
);