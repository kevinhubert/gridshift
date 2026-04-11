import { useState, useEffect } from 'react';
import { Outlet, useLocation, useMatch } from 'react-router-dom';
import posthog from 'posthog-js';
import { PricePoint } from '@/types';
import { GridShiftHeader } from '@/components/layout/GridShiftHeader';
import { LocationBar } from '@/components/layout/LocationBar';
import { DEMO_HUB } from '@/constants/hubs';

const FUNCTION_BASE = import.meta.env.VITE_FUNCTION_BASE || '';

export { DEMO_HUB } from '@/constants/hubs';

export const DEMO_PRICES: PricePoint[] = [
  { intervalEnd: '00:00', pricePerMwh: 33 },
  { intervalEnd: '01:00', pricePerMwh: 31 },
  { intervalEnd: '02:00', pricePerMwh: 29 },
  { intervalEnd: '03:00', pricePerMwh: 27 },
  { intervalEnd: '04:00', pricePerMwh: 28 },
  { intervalEnd: '05:00', pricePerMwh: 35 },
  { intervalEnd: '06:00', pricePerMwh: 38 },
  { intervalEnd: '07:00', pricePerMwh: 37 },
  { intervalEnd: '08:00', pricePerMwh: 20 },
  { intervalEnd: '09:00', pricePerMwh: 13 },
  { intervalEnd: '10:00', pricePerMwh: 8 },
  { intervalEnd: '11:00', pricePerMwh: 16 },
  { intervalEnd: '12:00', pricePerMwh: 18 },
  { intervalEnd: '13:00', pricePerMwh: 21 },
  { intervalEnd: '14:00', pricePerMwh: 48 },
  { intervalEnd: '15:00', pricePerMwh: 72 },
  { intervalEnd: '16:00', pricePerMwh: 58 },
  { intervalEnd: '17:00', pricePerMwh: 45 },
  { intervalEnd: '18:00', pricePerMwh: 59 },
  { intervalEnd: '19:00', pricePerMwh: 48 },
  { intervalEnd: '20:00', pricePerMwh: 35 },
  { intervalEnd: '21:00', pricePerMwh: 30 },
  { intervalEnd: '22:00', pricePerMwh: 28 },
  { intervalEnd: '23:00', pricePerMwh: 32 },
];

interface PriceApiResponse {
  hub: string;
  day: string;
  prices: { interval_end: string; price_per_mwh: number }[];
}

export type AppLayoutOutletContext = {
  hub: string;
  setHub: (hub: string) => void;
  displayPrices: PricePoint[];
  loading: boolean;
  error: string | null;
  /** Unix ms when prices were last set (fetch success, demo load, or demo fallback). */
  pricesUpdatedAt: number | null;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
};

export default function AppLayout() {
  const location = useLocation();
  const isHome = Boolean(useMatch({ path: '/', end: true }));

  const [prices, setPrices] = useState<PricePoint[] | null>(null);
  const [hub, setHub] = useState(DEMO_HUB);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricesUpdatedAt, setPricesUpdatedAt] = useState<number | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    posthog.capture('$pageview', {
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
    if (!isHome) {
      return;
    }

    if (!FUNCTION_BASE) {
      setPrices(DEMO_PRICES);
      setPricesUpdatedAt(Date.now());
      return;
    }

    const url = `${FUNCTION_BASE}/get-prices?hub=${hub}`;

    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: PriceApiResponse) => {
        if (data.prices && data.prices.length > 0) {
          const formatted: PricePoint[] = data.prices.map((p) => ({
            intervalEnd: p.interval_end.split('T')[1]?.substring(0, 5) || '00:00',
            pricePerMwh: p.price_per_mwh,
          }));
          setPrices(formatted);
        } else {
          setPrices(null);
          setError('No data yet — cron populates every 15 min');
        }
        setPricesUpdatedAt(Date.now());
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch prices:', err);
        setPrices(DEMO_PRICES);
        setError('Using demo data');
        setPricesUpdatedAt(Date.now());
        setLoading(false);
      });
  }, [hub, isHome]);

  const displayPrices = prices || DEMO_PRICES;

  const outletContext: AppLayoutOutletContext = {
    hub,
    setHub,
    displayPrices,
    loading,
    error,
    pricesUpdatedAt,
    theme,
    setTheme,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <GridShiftHeader
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      <div className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
          <LocationBar hub={hub} onHubChange={setHub} />
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-6 py-8">
        <Outlet context={outletContext} />
      </main>

      <footer className="mt-auto border-t border-border py-6 text-center text-sm text-muted-foreground">
        GridShift · ERCOT real-time data · Updated every 15 minutes
      </footer>
    </div>
  );
}
