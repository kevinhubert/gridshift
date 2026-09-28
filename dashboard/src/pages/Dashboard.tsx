import { useMemo } from 'react';
import { PricePoint } from '@/types';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PriceCurveChart } from '@/components/dashboard/PriceCurveChart';
import { normalizeIntervalEnd } from '@/lib/price-interval';
import { formatDay } from '@/lib/prices';

interface DashboardProps {
  prices: PricePoint[];
  hub: string;
  /** Operating day of `prices` (YYYY-MM-DD). */
  day: string;
  /** Feed has stopped updating — label the date, drop the "now" marker. */
  stale?: boolean;
  isDark?: boolean;
}

type LineDatum = { x: string; y: number };

export default function Dashboard({ prices, hub, day, stale = false, isDark = true }: DashboardProps) {
  const { lineData, avg } = useMemo(() => {
    if (!prices.length) {
      return {
        lineData: [] as { id: string; data: LineDatum[] }[],
        avg: 0,
      };
    }
    const ys = prices.map((p) => p.pricePerMwh);
    const sum = ys.reduce((a, b) => a + b, 0);
    return {
      lineData: [
        {
          id: 'price',
          data: prices.map((p) => ({
            x: normalizeIntervalEnd(p.intervalEnd),
            y: p.pricePerMwh,
          })),
        },
      ],
      avg: sum / ys.length,
    };
  }, [prices]);

  return (
    <div className="space-y-8">
      <Card className="border-0 bg-transparent shadow-none ring-0">
        <CardHeader>
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              {stale ? `Price curve · ${formatDay(day)}` : 'Today’s price curve'}
            </CardTitle>
            <CardDescription>
              {hub} · 15-minute settlement intervals, Central Time
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
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Peak</span>
              </div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="pb-4">
          <PriceCurveChart lineData={lineData} avg={avg} isDark={isDark} showNow={!stale} />
        </CardContent>
      </Card>
    </div>
  );
}
