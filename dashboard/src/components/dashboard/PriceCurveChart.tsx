import { useId, type ReactElement } from 'react';
import { curveMonotoneX, line } from 'd3-shape';
import {
  formatIntervalForDisplay,
  minutesFromIntervalEnd,
  pickIntervalTickValues,
  pickThreeHourTickValues,
} from '@/lib/price-interval';
import {
  ResponsiveLine,
  type DefaultSeries,
  type LineCustomSvgLayerProps,
  type SliceTooltipProps,
} from '@nivo/line';
import { centralNowMs, formatUsd } from '@/lib/prices';

type LineDatum = { x: string; y: number };

type LayerProps = LineCustomSvgLayerProps<DefaultSeries>;

type Palette = {
  cheap: string;
  moderate: string;
  peak: string;
  avg: string;
  grid: string;
  tick: string;
  textPrimary: string;
  tooltipBg: string;
  tooltipBorder: string;
  tierMuted: string;
  areaTop: string;
  trackerLine: string;
  trackerDotRing: string;
};

const THRESHOLDS = { cheap: 40, moderate: 100 };

function paletteForTheme(isDark: boolean): Palette {
  if (isDark) {
    return {
      cheap: '#4DA3FF',
      moderate: '#F5B24A',
      peak: '#E05A2B',
      avg: '#5A93BD',
      grid: 'rgba(90, 147, 189, 0.22)',
      tick: 'rgba(163, 196, 221, 0.75)',
      textPrimary: '#A3C4DD',
      tooltipBg: '#1B3A5C',
      tooltipBorder: '#254D75',
      tierMuted: '#5A93BD',
      areaTop: '#4DA3FF',
      trackerLine: 'rgba(163, 196, 221, 0.35)',
      trackerDotRing: 'rgba(255,255,255,0.35)',
    };
  }
  return {
    cheap: '#4DA3FF',
    moderate: '#F5B24A',
    peak: '#E05A2B',
    avg: '#7A7A75',
    grid: 'rgba(122, 122, 117, 0.2)',
    tick: '#7A7A75',
    textPrimary: '#0d1b2a',
    tooltipBg: 'hsl(var(--popover))',
    tooltipBorder: 'hsl(var(--border))',
    tierMuted: '#7A7A75',
    areaTop: '#4DA3FF',
    trackerLine: 'rgba(13, 27, 42, 0.2)',
    trackerDotRing: 'rgba(13, 27, 42, 0.25)',
  };
}

function getTierColor(value: number, palette: Palette) {
  if (value >= THRESHOLDS.moderate) return palette.peak;
  if (value >= THRESHOLDS.cheap) return palette.moderate;
  return palette.cheap;
}

function niceStep(rough: number): number {
  const x = Math.max(rough, 1e-6);
  const pow10 = 10 ** Math.floor(Math.log10(x));
  const err = x / pow10;
  let f: number;
  if (err <= 1) f = 1;
  else if (err <= 2) f = 2;
  else if (err <= 5) f = 5;
  else f = 10;
  return f * pow10;
}

function computeYTicks(minY: number, maxY: number): { ticks: number[]; min: number; max: number } {
  const pad = (maxY - minY) * 0.06 || 1;
  // Floor at $0 unless the data actually dips negative.
  const lo = minY >= 0 ? Math.max(0, minY - pad) : minY - pad;
  const hi = maxY + pad;
  const step = niceStep((hi - lo) / 4);
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step * 0.001; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  if (ticks.length < 2) {
    return { ticks: [lo, hi], min: lo, max: hi };
  }
  return { ticks, min: ticks[0]!, max: ticks[ticks.length - 1]! };
}

type Pixel = { x: number; y: number };

function monotonePath(coords: Pixel[]): string | null {
  if (coords.length < 2) return null;
  return (
    line<Pixel>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(curveMonotoneX)(coords) ?? null
  );
}

function SegmentedLine({
  series,
  xScale,
  yScale,
  innerHeight,
  palette,
  gradientId,
}: LayerProps & { palette: Palette; gradientId: string }) {
  if (!series?.[0]?.data?.length) return null;
  const points = series[0].data;
  const n = points.length;

  const pixelAt = (i: number): Pixel => ({
    x: xScale(points[i].data.x as string) as number,
    y: yScale(points[i].data.y as number) as number,
  });

  const allPixels = Array.from({ length: n }, (_, i) => pixelAt(i));
  const topPath = monotonePath(allPixels);
  if (!topPath) return null;

  const firstX = allPixels[0]!.x;
  const lastX = allPixels[n - 1]!.x;
  const fullArea = `${topPath} L${lastX},${innerHeight} L${firstX},${innerHeight} Z`;

  const segmentColor = (k: number) =>
    getTierColor(points[k + 1]!.data.y as number, palette);

  const strokePaths: ReactElement[] = [];
  let segStart = 0;
  while (segStart < n - 1) {
    const c = segmentColor(segStart);
    let segEnd = segStart;
    while (segEnd < n - 2 && segmentColor(segEnd) === segmentColor(segEnd + 1)) {
      segEnd++;
    }
    const runPixels: Pixel[] = [];
    for (let k = segStart; k <= segEnd + 1; k++) {
      runPixels.push(pixelAt(k));
    }
    const d = monotonePath(runPixels);
    if (d) {
      strokePaths.push(
        <path
          key={`${segStart}-${segEnd}`}
          d={d}
          fill="none"
          stroke={c}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />,
      );
    }
    segStart = segEnd + 1;
  }

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.areaTop} stopOpacity={0.28} />
          <stop offset="100%" stopColor={palette.areaTop} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fullArea} fill={`url(#${gradientId})`} />
      {strokePaths}
    </g>
  );
}

function AvgLine({
  avg,
  yScale,
  innerWidth,
  palette,
}: LayerProps & { avg: number; palette: Palette }) {
  const y = yScale(avg) as number;
  const label = `avg ${formatUsd(avg, 0)}`;
  return (
    <g>
      <line
        x1={0}
        y1={y}
        x2={innerWidth}
        y2={y}
        stroke={palette.avg}
        strokeWidth={1}
        strokeDasharray="3 5"
        opacity={0.9}
      />
      <text
        x={innerWidth - 2}
        y={y - 5}
        textAnchor="end"
        fill={palette.avg}
        fontSize={11}
        fontWeight={500}
      >
        {label}
      </text>
    </g>
  );
}

function CurrentTimeTracker({
  series,
  xScale,
  yScale,
  innerHeight,
  palette,
}: LayerProps & { palette: Palette }) {
  const raw = series?.[0]?.data;
  if (!raw || raw.length < 2) return null;

  const nowMin = Math.floor((centralNowMs() % 86_400_000) / 60_000);

  const tAt = (i: number) => minutesFromIntervalEnd(String(raw[i]!.data.x));
  const val = (i: number) => Number(raw[i]!.data.y);

  let px: number;
  let py: number;
  let yInterp: number;

  const firstT = tAt(0);
  const lastT = tAt(raw.length - 1);

  if (nowMin <= firstT) {
    px = xScale(raw[0]!.data.x as string) as number;
    yInterp = val(0);
    py = yScale(yInterp) as number;
  } else if (nowMin >= lastT) {
    const last = raw.length - 1;
    px = xScale(raw[last]!.data.x as string) as number;
    yInterp = val(last);
    py = yScale(yInterp) as number;
  } else {
    const hi = raw.findIndex((_, i) => tAt(i) > nowMin);
    const safeHi = hi <= 0 ? 1 : hi;
    const lo = safeHi - 1;
    const span = tAt(safeHi) - tAt(lo);
    const frac = span > 0 ? (nowMin - tAt(lo)) / span : 0;
    const xl = xScale(raw[lo]!.data.x as string) as number;
    const xh = xScale(raw[safeHi]!.data.x as string) as number;
    px = xl + frac * (xh - xl);
    yInterp = val(lo) + frac * (val(safeHi) - val(lo));
    py = yScale(yInterp) as number;
  }

  const fill = getTierColor(yInterp, palette);

  return (
    <g pointerEvents="none">
      <line
        x1={px}
        y1={0}
        x2={px}
        y2={innerHeight}
        stroke={palette.trackerLine}
        strokeWidth={1}
      />
      <circle cx={px} cy={py} r={11} fill={fill} opacity={0.22} />
      <circle cx={px} cy={py} r={7} fill={fill} opacity={0.4} />
      <circle
        cx={px}
        cy={py}
        r={5.5}
        fill={fill}
        stroke={palette.trackerDotRing}
        strokeWidth={1}
      />
    </g>
  );
}

function PriceSliceTooltip({
  slice,
  palette,
  isDark,
}: SliceTooltipProps<DefaultSeries> & {
  palette: Palette;
  isDark: boolean;
}) {
  const point = slice.points[0];
  if (!point) return null;
  const value = Number(point.data.y);
  const tier =
    value >= THRESHOLDS.moderate ? 'Peak' : value >= THRESHOLDS.cheap ? 'Moderate' : 'Cheap';
  const color = getTierColor(value, palette);

  if (isDark) {
    return (
      <div
        style={{
          background: palette.tooltipBg,
          border: `1px solid ${palette.tooltipBorder}`,
          borderRadius: 8,
          padding: '10px 14px',
        }}
      >
        <div style={{ fontSize: 11, color: palette.tierMuted, marginBottom: 2 }}>
          {formatIntervalForDisplay(String(point.data.x))}
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, color: palette.textPrimary }}>
          {formatUsd(value)}
          <span style={{ fontSize: 12, color: palette.tierMuted }}>/MWh</span>
        </div>
        <div style={{ fontSize: 11, color, marginTop: 2 }}>{tier}</div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-md"
      style={{
        backgroundColor: 'hsl(var(--popover))',
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--popover-foreground))',
      }}
    >
      <div className="text-xs text-muted-foreground">
        {formatIntervalForDisplay(String(point.data.x))}
      </div>
      <div className="font-mono font-semibold tabular-nums">{formatUsd(value)}</div>
      <div className="text-xs text-muted-foreground">/MWh</div>
      <div className="text-xs" style={{ color }}>
        {tier}
      </div>
    </div>
  );
}

export type PriceCurveChartProps = {
  lineData: { id: string; data: LineDatum[] }[];
  avg: number;
  isDark?: boolean;
  /** Draw the current-time marker (off when showing a past day). */
  showNow?: boolean;
};

export function PriceCurveChart({ lineData, avg, isDark = true, showNow = true }: PriceCurveChartProps) {
  const palette = paletteForTheme(isDark);
  const uid = useId().replace(/:/g, '');
  const gradientId = `price-curve-area-${uid}`;

  if (!lineData.length || !lineData[0].data.length) {
    return (
      <div className="flex h-full min-h-[256px] items-center justify-center text-sm text-muted-foreground">
        No price data for this hub yet.
      </div>
    );
  }

  const allY = lineData[0].data.map((d) => d.y);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const { ticks: yTicks, min: yMin, max: yMax } = computeYTicks(minY, maxY);

  const xValues = lineData[0].data.map((d) => d.x);
  const threeHour = pickThreeHourTickValues(xValues);
  const xTickValues = threeHour.length ? threeHour : pickIntervalTickValues(xValues);

  return (
    <div className="h-72 w-full min-h-[288px]">
      <ResponsiveLine
        data={lineData}
        margin={{ top: 4, right: 56, bottom: 32, left: 48 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: yMin,
          max: yMax,
        }}
        axisBottom={{
          tickSize: 0,
          tickPadding: 10,
          tickRotation: 0,
          tickValues: xTickValues,
          format: (v) => formatIntervalForDisplay(String(v)),
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 10,
          tickValues: yTicks,
          format: (v) => formatUsd(Number(v), 0),
        }}
        enableGridX={false}
        enableGridY
        gridYValues={yTicks}
        theme={{
          background: 'transparent',
          text: { fill: palette.tick, fontSize: 11 },
          axis: {
            domain: { line: { stroke: 'transparent', strokeWidth: 0 } },
            ticks: {
              line: { stroke: 'transparent' },
              text: { fill: palette.tick, fontSize: 11 },
            },
          },
          grid: {
            line: { stroke: palette.grid, strokeDasharray: '2 6' },
          },
          crosshair: {
            line: {
              stroke: palette.avg,
              strokeWidth: 1,
              strokeDasharray: '4 4',
            },
          },
          tooltip: { container: { background: 'transparent', boxShadow: 'none' } },
        }}
        colors={['transparent']}
        enablePoints={false}
        enableArea={false}
        lineWidth={0}
        layers={[
          'grid',
          'axes',
          (props: LayerProps) => <AvgLine key="avg" {...props} avg={avg} palette={palette} />,
          (props: LayerProps) => (
            <SegmentedLine key="segments" {...props} palette={palette} gradientId={gradientId} />
          ),
          ...(showNow
            ? [(props: LayerProps) => <CurrentTimeTracker key="now" {...props} palette={palette} />]
            : []),
          'crosshair',
          'slices',
          'mesh',
        ]}
        useMesh={false}
        enableSlices="x"
        sliceTooltip={(props) => (
          <PriceSliceTooltip {...props} palette={palette} isDark={isDark} />
        )}
      />
    </div>
  );
}

export default PriceCurveChart;
