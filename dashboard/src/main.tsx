import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import posthog from 'posthog-js';
import './index.css';
import { router } from './router';

posthog.init('phc_tATEMXnR88epnpgR3iryRkYPj9N38pDxk8DmJx5GSU9P', {
  api_host: 'https://us.i.posthog.com',
  capture_pageview: false,
  capture_pageleave: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
