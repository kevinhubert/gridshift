import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useMatch } from 'react-router-dom';
import posthog from 'posthog-js';
import { Moon, Sun } from 'lucide-react';
import { PricePoint } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FUNCTION_BASE = import.meta.env.VITE_FUNCTION_BASE || '';

export const DEMO_HUB = 'LZ_HOUSTON';

const HUB_OPTIONS = [
  { value: 'LZ_HOUSTON', label: 'LZ_HOUSTON (Austin)' },
  { value: 'HB_HOUSTON', label: 'HB_HOUSTON' },
  { value: 'HB_NORTH', label: 'HB_NORTH' },
  { value: 'LZ_RAYBN', label: 'LZ_RAYBN' },
] as const;

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
  }, [hub, isHome]);

  const displayPrices = prices || DEMO_PRICES;

  const outletContext: AppLayoutOutletContext = {
    hub,
    setHub,
    displayPrices,
    loading,
    error,
    theme,
    setTheme,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 min-w-0">
            <Link to="/" className="inline-flex shrink-0 items-center" aria-label="GridShift home">
              <img
                src={theme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
                alt="GridShift"
                width={296}
                height={64}
                className="h-14 w-auto sm:h-[4.25rem]"
              />
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                to="/"
                className="text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/about"
                className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                About
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {isHome && loading && (
              <span className="text-xs text-muted-foreground animate-pulse">Fetching...</span>
            )}
            {isHome && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Hub:</span>
                <Select
                  value={hub}
                  onValueChange={(value) => {
                    setHub(value);
                    posthog.capture('hub_changed', { hub: value });
                  }}
                >
                  <SelectTrigger id="hub-select" className="w-[220px]" aria-label="ERCOT load zone hub">
                    <SelectValue placeholder="Select hub" />
                  </SelectTrigger>
                  <SelectContent>
                    {HUB_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-6 py-8 space-y-8 flex-1">
        <Outlet context={outletContext} />
      </main>

      <footer className="border-t border-border mt-auto py-6 text-center text-sm text-muted-foreground">
        GridShift · ERCOT real-time data · Updated every 15 minutes
      </footer>
    </div>
  );
}
