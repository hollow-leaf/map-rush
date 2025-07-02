import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// App is now a layout component rendered by the router
// import App from './App.tsx'; 
import './styles/globals.css';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
