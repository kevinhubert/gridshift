import posthog from 'posthog-js';

const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const posthogHost =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false,
    capture_pageleave: true,
  });
}

/** No-ops when `VITE_POSTHOG_KEY` is unset (e.g. local dev / public clone). */
export function captureAnalytics(event: string, properties?: Record<string, unknown>) {
  if (!posthogKey) return;
  posthog.capture(event, properties);
}
