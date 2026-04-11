import { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import type { SliceTooltipProps } from '@nivo/line';
import { PricePoint } from '@/types';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
interface DashboardProps {
  prices: PricePoint[];
  hub: string;
  isDark?: boolean;
}

function formatHour(interval: string): string {
  const [h] = interval.split(':');
  const hour = parseInt(h, 10);
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  return hour > 12 ? `${hour - 12}pm` : `${hour}am`;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

type LineDatum = { x: string; y: number };

function PriceSliceTooltip({ slice }: SliceTooltipProps<{ id: string; data: LineDatum[] }>) {
  const pt = slice.points[0];
  if (!pt) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-md"
      style={{
        backgroundColor: 'hsl(var(--popover))',
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--popover-foreground))',
      }}
    >
      <div className="text-xs text-muted-foreground">{pt.data.xFormatted}</div>
      <div className="font-mono font-semibold tabular-nums">{formatPrice(pt.data.y as number)}</div>
      <div className="text-xs text-muted-foreground">/MWh</div>
    </div>
  );
}

export default function Dashboard({ prices, hub, isDark = true }: DashboardProps) {
  const gridColor = isDark ? '#132B45' : '#e5e3dd';
  const tickColor = isDark ? '#7A7A75' : '#7A7A75';

  const { lineData, avg, minY, maxY } = useMemo(() => {
    if (!prices.length) {
      return {
        lineData: [] as { id: string; data: LineDatum[] }[],
        avg: 0,
        minY: 0,
        maxY: 1,
      };
    }
    const ys = prices.map((p) => p.pricePerMwh);
    const sum = ys.reduce((a, b) => a + b, 0);
    return {
      lineData: [
        {
          id: 'price',
          data: prices.map((p) => ({
            x: formatHour(p.intervalEnd),
            y: p.pricePerMwh,
          })),
        },
      ],
      avg: sum / ys.length,
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }, [prices]);

  const yPad = maxY > minY ? (maxY - minY) * 0.08 : 2;

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
          <div className="h-64 w-full min-h-[256px]">
            {lineData.length > 0 && lineData[0].data.length > 0 ? (
              <ResponsiveLine
                data={lineData}
                margin={{ top: 12, right: 16, bottom: 36, left: 52 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: Math.max(0, minY - yPad),
                  max: maxY + yPad,
                }}
                axisBottom={{
                  tickSize: 0,
                  tickPadding: 8,
                  tickRotation: -35,
                  legendOffset: 48,
                  legendPosition: 'middle',
                }}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 8,
                  format: (v) => `$${v}`,
                }}
                enableGridX={false}
                enableGridY
                gridYValues={6}
                theme={{
                  background: 'transparent',
                  text: { fill: tickColor, fontSize: 11 },
                  axis: { domain: { line: { stroke: gridColor } } },
                  grid: { line: { stroke: gridColor, strokeDasharray: '3 3' } },
                  tooltip: { container: { background: 'transparent', boxShadow: 'none' } },
                }}
                colors={['#4DA3FF']}
                lineWidth={2}
                curve="monotoneX"
                enablePoints={false}
                enableArea
                areaOpacity={0.22}
                areaBaselineValue={Math.max(0, minY - yPad)}
                defs={[
                  {
                    id: 'priceAreaGradient',
                    type: 'linearGradient',
                    x1: '0',
                    y1: '0',
                    x2: '0',
                    y2: '1',
                    colors: [
                      { offset: 0, color: '#4DA3FF', opacity: 0.35 },
                      { offset: 100, color: '#4DA3FF', opacity: 0.02 },
                    ],
                  },
                ]}
                fill={[{ match: '*', id: 'priceAreaGradient' }]}
                useMesh={false}
                enableSlices="x"
                sliceTooltip={PriceSliceTooltip}
                markers={[
                  {
                    axis: 'y',
                    value: avg,
                    lineStyle: { stroke: tickColor, strokeWidth: 1, strokeDasharray: '4 4' },
                    textStyle: { fill: tickColor, fontSize: 10 },
                    legend: 'avg',
                  },
                ]}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No price data for this hub yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
