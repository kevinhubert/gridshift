import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import { PricePoint, Device, OptimizationResponse } from './types';

const DEMO_HUB = 'LZ_HOUSTON';

// Demo data showing the price curve shape
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

const DEMO_INSIGHTS: OptimizationResponse = {
  hub: DEMO_HUB,
  day: new Date().toISOString().split('T')[0],
  insights: [
    {
      device: 'EV Charger',
      dailyKwh: 30,
      optimalWindow: { hour: 2, pricePerMwh: 27 },
      peakWindow: { hour: 15, pricePerMwh: 72 },
      estimatedDailyCostAtOptimal: 0.81,
      estimatedDailyCostAtPeak: 2.16,
      monthlySavings: 40.50,
    },
    {
      device: 'Pool Pump',
      dailyKwh: 5,
      optimalWindow: { hour: 10, pricePerMwh: 8 },
      peakWindow: { hour: 15, pricePerMwh: 72 },
      estimatedDailyCostAtOptimal: 0.04,
      estimatedDailyCostAtPeak: 0.36,
      monthlySavings: 9.60,
    },
    {
      device: 'Dishwasher',
      dailyKwh: 2,
      optimalWindow: { hour: 3, pricePerMwh: 28 },
      peakWindow: { hour: 17, pricePerMwh: 59 },
      estimatedDailyCostAtOptimal: 0.06,
      estimatedDailyCostAtPeak: 0.12,
      monthlySavings: 1.80,
    },
  ],
};

export default function App() {
  const [prices, setPrices] = useState<PricePoint[] | null>(null);
  const [insights, setInsights] = useState<OptimizationResponse | null>(null);
  const [hub, setHub] = useState(DEMO_HUB);
  const [loading, setLoading] = useState(false);

  const displayPrices = prices || DEMO_PRICES;
  const displayInsights = insights || DEMO_INSIGHTS;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-400">GridShift</h1>
            <p className="text-sm text-slate-500">Stop paying ERCOT's peak tax</p>
          </div>
          <div className="flex items-center gap-3">
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
        <Dashboard prices={displayPrices} hub={hub} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6 text-center text-sm text-slate-600">
        GridShift · ERCOT real-time data · Updated every 15 minutes
      </footer>
    </div>
  );
}
