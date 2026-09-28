import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { captureAnalytics } from '@/lib/analytics';
import { fetchPriceSnapshot, type PriceSnapshot } from '@/lib/prices';
import { GridShiftHeader } from '@/components/layout/GridShiftHeader';
import { ZoneBar } from '@/components/layout/ZoneBar';
import { DEFAULT_HUB, isKnownHub } from '@/constants/hubs';

/** Matches the `cache-prices` cron cadence. */
const REFRESH_MS = 5 * 60 * 1000;

export type AppLayoutOutletContext = {
  hub: string;
  /** Null until the first load finishes, or when the hub has no data. */
  snapshot: PriceSnapshot | null;
  loading: boolean;
  error: string | null;
  theme: 'dark' | 'light';
};

function loadStoredHub(): string {
  const stored = localStorage.getItem('gs-hub');
  return stored && isKnownHub(stored) ? stored : DEFAULT_HUB;
}

export default function AppLayout() {
  const location = useLocation();

  const [hub, setHub] = useState(loadStoredHub);
  const [snapshot, setSnapshot] = useState<PriceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    captureAnalytics('$pageview', {
      $current_url: window.location.href,
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('gs-hub', hub);
    let cancelled = false;

    const load = () => {
      setLoading(true);
      fetchPriceSnapshot(hub)
        .then((data) => {
          if (cancelled) return;
          setSnapshot(data);
          setError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('Failed to fetch prices:', err);
          setError('Couldn’t load prices right now.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    setSnapshot(null);
    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [hub]);

  const outletContext: AppLayoutOutletContext = {
    hub,
    snapshot,
    loading,
    error,
    theme,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <GridShiftHeader
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      <div className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
          <ZoneBar hub={hub} onHubChange={setHub} />
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-6 py-8">
        <Outlet context={outletContext} />
      </main>

      <footer className="mt-auto border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        <p>GridShift · ERCOT real-time settlement point prices · Updated every 15 minutes</p>
        <p className="mt-1 text-xs">
          Wholesale prices, not your retail rate. Informational only — not financial or energy advice.
        </p>
      </footer>
    </div>
  );
}
