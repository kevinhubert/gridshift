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

interface DashboardProps {
  prices: PricePoint[];
  hub: string;
  isDark?: boolean;
}

type LineDatum = { x: string; y: number };

export default function Dashboard({ prices, hub, isDark = true }: DashboardProps) {
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
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-lg">Today&apos;s Price Curve</CardTitle>
            <CardDescription>
              {hub} ·{' '}
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
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
          <PriceCurveChart lineData={lineData} avg={avg} isDark={isDark} />
        </CardContent>
      </Card>
    </div>
  );
}
