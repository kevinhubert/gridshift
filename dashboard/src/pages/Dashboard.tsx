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
import { Badge } from '@/components/ui/badge';

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

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export default function Dashboard({ prices, hub, isDark = true, insights }: DashboardProps) {
  const priceValues = prices.map((p) => p.pricePerMwh);
  const min = Math.min(...priceValues);
  const max = Math.max(...priceValues);
  const avg = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
  const now = new Date();
  const currentHour = now.getHours();

  const chartData = prices.map((p) => ({
    time: formatHour(p.intervalEnd),
    hour: parseInt(p.intervalEnd.split(':')[0]),
    price: p.pricePerMwh,
    color: getPriceColor(p.pricePerMwh, min, max),
  }));

  const cheapest = [...prices].sort((a, b) => a.pricePerMwh - b.pricePerMwh).slice(0, 3);
  const mostExpensive = [...prices].sort((a, b) => b.pricePerMwh - a.pricePerMwh).slice(0, 3);

  const gridColor = isDark ? '#132B45' : '#e5e3dd';
  const tickColor = isDark ? '#7A7A75' : '#7A7A75';
  const tooltipBg = isDark ? '#0D1B2A' : '#ffffff';
  const tooltipBorder = isDark ? '#132B45' : '#e5e3dd';
  const tooltipText = isDark ? '#F9F8F5' : '#0D1B2A';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Current Price"
          value={formatPrice(prices[currentHour]?.pricePerMwh || 0)}
          sublabel={formatHour(prices[currentHour]?.intervalEnd || '00:00')}
          color={getPriceColor(prices[currentHour]?.pricePerMwh || 0, min, max)}
        />
        <StatCard
          label="Cheapest Today"
          value={formatPrice(min)}
          sublabel={formatHour(cheapest[0]?.intervalEnd || '00:00')}
          color="#34D399"
        />
        <StatCard
          label="Most Expensive"
          value={formatPrice(max)}
          sublabel={formatHour(mostExpensive[0]?.intervalEnd || '00:00')}
          color="#E05A2B"
        />
        <StatCard
          label="Average"
          value={formatPrice(avg)}
          sublabel="across all hours"
          color="#A3A39E"
        />
      </div>

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
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Cheap</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Moderate</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
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

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Savings</h2>
        {insights && insights.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <InsightCard key={insight.device} insight={insight} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">Add your devices to see potential savings</p>
              <p className="text-sm text-muted-foreground/80 mt-1">Configure flexible loads in your profile</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-green-600 dark:text-green-400">
              🟢 Best Times to Run
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              {cheapest.map((p, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-border last:border-0"
                >
                  <span className="text-muted-foreground">{formatHour(p.intervalEnd)}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{formatPrice(p.pricePerMwh)}/MWh</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground pt-1">
              Run dishwashers, laundry, EV charging during these hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-orange-600 dark:text-orange-400">
              🔴 Times to Avoid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              {mostExpensive.map((p, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-border last:border-0"
                >
                  <span className="text-muted-foreground">{formatHour(p.intervalEnd)}</span>
                  <span className="font-mono text-orange-600 dark:text-orange-400">{formatPrice(p.pricePerMwh)}/MWh</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground pt-1">
              If on a time-of-use plan, shift flexible loads away from these hours
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: string;
  sublabel: string;
  color: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1 pt-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold" style={{ color }}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{insight.device}</CardTitle>
        <CardAction>
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-300"
          >
            {formatCost(insight.monthlySavings)}/mo
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Optimal</p>
            <p className="font-mono text-blue-600 dark:text-blue-400">
              {insight.optimalWindow.hour}:00 — {formatCost(insight.estimatedDailyCostAtOptimal)}/day
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">If at peak</p>
            <p className="font-mono text-orange-600 dark:text-orange-400">
              {insight.peakWindow.hour}:00 — {formatCost(insight.estimatedDailyCostAtPeak)}/day
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Save{' '}
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatCost(insight.monthlySavings)}/month</span> by
            shifting to the cheapest window
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
