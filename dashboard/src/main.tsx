import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import posthog from 'posthog-js';
import './index.css';
import App from './App';

posthog.init('phc_tATEMXnR88epnpgR3iryRkYPj9N38pDxk8DmJx5GSU9P', {
  api_host: 'https://us.i.posthog.com',
  capture_pageview: true,
  capture_pageleave: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
