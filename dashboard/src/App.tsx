import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import Dashboard from './pages/Dashboard';
import { PricePoint } from './types';

const FUNCTION_BASE = import.meta.env.VITE_FUNCTION_BASE || '';

const DEMO_HUB = 'LZ_HOUSTON';

const DEMO_PRICES: PricePoint[] = [
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

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function App() {
  const [prices, setPrices] = useState<PricePoint[] | null>(null);
  const [hub, setHub] = useState(DEMO_HUB);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

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
    if (!FUNCTION_BASE) {
      setPrices(DEMO_PRICES);
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
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch prices:', err);
        setPrices(DEMO_PRICES);
        setError('Using demo data');
        setLoading(false);
      });
  }, [hub]);

  const displayPrices = prices || DEMO_PRICES;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-navy-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <img
              src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
              alt="GridShift"
              width={180}
              height={39}
            />
            <p className="text-sm text-navy-700 dark:text-white pl-[50px]">
              Beat the <span className="text-orange-500">peak</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <span className="text-xs text-neutral-400 dark:text-neutral-500 animate-pulse">Fetching...</span>
            )}
            <label className="text-sm text-neutral-600 dark:text-neutral-400">Hub:</label>
            <select
              value={hub}
              onChange={(e) => {
                setHub(e.target.value);
                posthog.capture('hub_changed', { hub: e.target.value });
              }}
              className="bg-white dark:bg-navy-900 border border-neutral-300 dark:border-navy-700 rounded px-3 py-1.5 text-sm text-navy-900 dark:text-neutral-100"
            >
              <option value="LZ_HOUSTON">LZ_HOUSTON (Austin)</option>
              <option value="HB_HOUSTON">HB_HOUSTON</option>
              <option value="HB_NORTH">HB_NORTH</option>
              <option value="LZ_RAYBN">LZ_RAYBN</option>
            </select>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-neutral-200 dark:border-navy-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-navy-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
            {error}
          </div>
        )}
        <Dashboard prices={displayPrices} hub={hub} isDark={theme === 'dark'} />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-navy-800 mt-12 py-6 text-center text-sm text-neutral-400 dark:text-neutral-600">
        GridShift · ERCOT real-time data · Updated every 15 minutes
      </footer>
    </div>
  );
}
