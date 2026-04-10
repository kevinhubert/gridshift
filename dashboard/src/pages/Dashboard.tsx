import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { PricePoint, Insight } from '@/types';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { PriceAlerts } from '@/components/dashboard/PriceAlerts';

interface DashboardProps {
  prices: PricePoint[];
  hub: string;
  isDark?: boolean;
  insights?: Insight[];
}

function getPriceColor(price: number, min: number, max: number): string {
  const ratio = (price - min) / (max - min);
  if (ratio < 0.33) return '#10b981';
  if (ratio < 0.66) return '#f59e0b';
  return '#ef4444';
}

function formatHour(interval: string): string {
  const [h] = interval.split(':');
  const hour = parseInt(h);
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export default function Dashboard({ prices, hub, isDark = true, insights }: DashboardProps) {
  const priceValues = prices.map((p) => p.pricePerMwh);
  const min = Math.min(...priceValues);
  const max = Math.max(...priceValues);
  const avg = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
  const chartData = prices.map((p) => ({
    time: formatHour(p.intervalEnd),
    hour: parseInt(p.intervalEnd.split(':')[0]),
    price: p.pricePerMwh,
    color: getPriceColor(p.pricePerMwh, min, max),
  }));

  const cheapest = [...prices].sort((a, b) => a.pricePerMwh - b.pricePerMwh);
  const mostExpensive = [...prices].sort((a, b) => b.pricePerMwh - a.pricePerMwh);

  const dailySavingsTotal =
    insights?.reduce(
      (s, i) => s + Math.max(0, i.estimatedDailyCostAtPeak - i.estimatedDailyCostAtOptimal),
      0
    ) ?? 0;
  const savingsValue =
    insights && insights.length > 0 ? formatPrice(dailySavingsTotal) : '—';
  const savingsDetail = insights?.length ? 'vs. running at peak' : 'vs. flat rate';

  const gridColor = isDark ? '#132B45' : '#e5e3dd';
  const tickColor = isDark ? '#7A7A75' : '#7A7A75';
  const tooltipBg = isDark ? '#0D1B2A' : '#ffffff';
  const tooltipBorder = isDark ? '#132B45' : '#e5e3dd';
  const tooltipText = isDark ? '#F9F8F5' : '#0D1B2A';

  return (
    <div className="space-y-8">
      <MetricCards
        low={min}
        lowAtInterval={cheapest[0]?.intervalEnd ?? '00:00'}
        high={max}
        highAtInterval={mostExpensive[0]?.intervalEnd ?? '00:00'}
        avg={avg}
        savingsValue={savingsValue}
        savingsDetail={savingsDetail}
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-lg">Today&apos;s Price Curve</CardTitle>
            <CardDescription>
              {hub} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </CardDescription>
          </div>
          <CardAction>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Cheap</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Moderate</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-muted-foreground">Peak</span>
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4DA3FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4DA3FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: tickColor }}
                  tickLine={false}
                  axisLine={{ stroke: gridColor }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: tickColor }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: tooltipText,
                  }}
                  formatter={(value: number) => [formatPrice(value), 'Price']}
                  labelFormatter={(label) => `${label}`}
                />
                <ReferenceLine y={avg} stroke={tickColor} strokeDasharray="4 4" label={{ value: 'avg', fill: tickColor, fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#4DA3FF"
                  fill="url(#priceGradient)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <PriceAlerts prices={prices} />
    </div>
  );
}
