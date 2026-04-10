import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import { PricePoint } from './types';

const FUNCTION_BASE = import.meta.env.VITE_FUNCTION_BASE || '';

const DEMO_HUB = 'LZ_HOUSTON';

// Demo data for when API isn't available
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

export default function App() {
  const [prices, setPrices] = useState<PricePoint[] | null>(null);
  const [hub, setHub] = useState(DEMO_HUB);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          // Convert interval_end to just HH:MM
          const formatted: PricePoint[] = data.prices.map((p) => ({
            intervalEnd: p.interval_end.split('T')[1]?.substring(0, 5) || '00:00',
            pricePerMwh: p.price_per_mwh,
          }));
          setPrices(formatted);
        } else {
          // No data yet — cron hasn't populated
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-500">GridShift</h1>
            <p className="text-sm text-slate-500">Stop paying ERCOT's peak tax</p>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <span className="text-xs text-slate-500 animate-pulse">Fetching...</span>
            )}
            <label className="text-sm text-slate-400">Hub:</label>
            <select
              value={hub}
              onChange={(e) => setHub(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm"
            >
              <option value="LZ_HOUSTON">LZ_HOUSTON (Austin)</option>
              <option value="HB_HOUSTON">HB_HOUSTON</option>
              <option value="HB_NORTH">HB_NORTH</option>
              <option value="LZ_RAYBN">LZ_RAYBN</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 text-sm text-amber-400">
            {error}
          </div>
        )}
        <Dashboard prices={displayPrices} hub={hub} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6 text-center text-sm text-slate-600">
        GridShift · ERCOT real-time data · Updated every 15 minutes
      </footer>
    </div>
  );
}
