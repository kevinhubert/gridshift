import { useId, type ReactElement } from 'react';
import { curveMonotoneX, line } from 'd3-shape';
import { formatIntervalForDisplay, pickIntervalTickValues } from '@/lib/price-interval';
import {
  ResponsiveLine,
  type DefaultSeries,
  type LineCustomSvgLayerProps,
  type SliceTooltipProps,
} from '@nivo/line';

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
};

const THRESHOLDS = { cheap: 40, moderate: 100 };

function paletteForTheme(isDark: boolean): Palette {
  if (isDark) {
    return {
      cheap: '#4DA3FF',
      moderate: '#F5B24A',
      peak: '#E05A2B',
      avg: '#5A93BD',
      grid: 'rgba(37,77,117,0.3)',
      tick: '#5A93BD',
      textPrimary: '#A3C4DD',
      tooltipBg: '#1B3A5C',
      tooltipBorder: '#254D75',
      tierMuted: '#5A93BD',
      areaTop: '#4DA3FF',
    };
  }
  return {
    cheap: '#4DA3FF',
    moderate: '#F5B24A',
    peak: '#E05A2B',
    avg: '#7A7A75',
    grid: '#e5e3dd',
    tick: '#7A7A75',
    textPrimary: '#0d1b2a',
    tooltipBg: 'hsl(var(--popover))',
    tooltipBorder: 'hsl(var(--border))',
    tierMuted: '#7A7A75',
    areaTop: '#4DA3FF',
  };
}

function getTierColor(value: number, palette: Palette) {
  if (value >= THRESHOLDS.moderate) return palette.peak;
  if (value >= THRESHOLDS.cheap) return palette.moderate;
  return palette.cheap;
}

type Pixel = { x: number; y: number };

/** Matches Nivo’s default `curve="monotoneX"` — smooth between hourly samples. */
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

  const firstX = allPixels[0].x;
  const lastX = allPixels[n - 1].x;
  const fullArea = `${topPath} L${lastX},${innerHeight} L${firstX},${innerHeight} Z`;

  /** Segment `k` is (P_k → P_{k+1}); color follows destination price y_{k+1}. */
  const segmentColor = (k: number) =>
    getTierColor(points[k + 1].data.y as number, palette);

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
          <stop offset="0%" stopColor={palette.areaTop} stopOpacity={0.25} />
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
  return (
    <g>
      <line
        x1={0}
        y1={y}
        x2={innerWidth}
        y2={y}
        stroke={palette.avg}
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <text x={innerWidth - 4} y={y - 6} textAnchor="end" fill={palette.avg} fontSize={10}>
        avg
      </text>
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
          ${value.toFixed(2)}
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
      <div className="font-mono font-semibold tabular-nums">${value.toFixed(2)}</div>
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
};

export function PriceCurveChart({ lineData, avg, isDark = true }: PriceCurveChartProps) {
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
  const yPad = maxY > minY ? (maxY - minY) * 0.08 : 2;

  const xValues = lineData[0].data.map((d) => d.x);
  const xTickValues = pickIntervalTickValues(xValues);

  return (
    <div className="h-64 w-full min-h-[256px]">
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
          tickValues: xTickValues,
          format: (v) => formatIntervalForDisplay(String(v)),
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
          text: { fill: palette.tick, fontSize: 11 },
          axis: {
            domain: { line: { stroke: isDark ? 'transparent' : palette.grid } },
            ticks: { text: { fill: palette.tick } },
          },
          grid: {
            line: { stroke: palette.grid, strokeDasharray: '3 3' },
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
