import { useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Glass-style metric cards — surfaces & glows from `src/styles/gridshift-tokens.css`.
 */

const MOCK_PRICES_TODAY = [
  22, 20, 18, 17, 16, 15, 14, 15, 18, 24, 32, 38, 42, 33, 30, 35, 48, 62, 85, 110, 145, 167, 120, 55,
];

/** Mock last-24h series (from `Last24Card.jsx`) until wired to history API. */
const LAST_24H_PRICES = [
  45, 42, 38, 35, 32, 28, 25, 22, 20, 24, 32, 38, 42, 33, 30, 35, 48, 62, 85, 110, 145, 167, 120, 55,
];
const CURRENT_HOUR = 14;
const CURRENT_PRICE = 30.4;
const FLAT_RATE_CENTS = 12.5;

type PriceTier = 'cheap' | 'moderate' | 'elevated' | 'peak';

function getPriceTier(price: number): PriceTier {
  if (price < 30) return 'cheap';
  if (price < 60) return 'moderate';
  if (price < 100) return 'elevated';
  return 'peak';
}

const GS_COLOR: Record<PriceTier, string> = {
  cheap: 'var(--gs-cheap)',
  moderate: 'var(--gs-moderate)',
  elevated: 'var(--gs-elevated)',
  peak: 'var(--gs-peak)',
};

const GS_GLOW: Record<PriceTier, string> = {
  cheap: 'var(--gs-glow-cheap)',
  moderate: 'var(--gs-glow-moderate)',
  elevated: 'var(--gs-glow-elevated)',
  peak: 'var(--gs-glow-peak)',
};

const GS_BADGE_BG: Record<PriceTier, string> = {
  cheap: 'var(--gs-badge-cheap)',
  moderate: 'var(--gs-badge-moderate)',
  elevated: 'var(--gs-badge-elevated)',
  peak: 'var(--gs-badge-peak)',
};

function getPriceLabelForTier(tier: PriceTier): string {
  const labels: Record<PriceTier, string> = {
    cheap: 'Cheap',
    moderate: 'Moderate',
    elevated: 'Elevated',
    peak: 'Peak',
  };
  return labels[tier];
}

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  color: string;
};

function Sparkline({ data, width = 160, height = 48, color }: SparklineProps) {
  const gradId = useId().replace(/:/g, '');
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendArrow({ direction }: { direction: 'up' | 'down' }) {
  const rotate = direction === 'up' ? 0 : 180;
  const fill = direction === 'up' ? 'var(--gs-peak)' : 'var(--gs-cheap)';
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      className="transition-transform duration-300"
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <path d="M9 3 L14 10 L11 10 L11 15 L7 15 L7 10 L4 10 Z" fill={fill} />
    </svg>
  );
}

function useCountdown(targetMinutes: number): string {
  const [seconds, setSeconds] = useState(targetMinutes * 60);
  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

function PulseDot({ colorVar }: { colorVar: string }) {
  return (
    <span className="relative inline-block h-2.5 w-2.5">
      <span
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: colorVar,
          animation: 'card-iteration-pulse-ring 2s ease-out infinite',
        }}
      />
      <span
        className="absolute inset-0.5 rounded-full"
        style={{ backgroundColor: colorVar }}
      />
    </span>
  );
}

function Card({
  children,
  accentGlow,
  style = {},
}: {
  children: ReactNode;
  accentGlow?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        /* isolate: backdrop-filter + border-radius clipping in WebKit */
        'relative isolate overflow-hidden rounded-2xl border px-7 py-6 backdrop-blur-gs-card',
        'border-gs-border bg-gs-light-wash shadow-sm',
        'dark:border-gs-card dark:bg-gs-card-surface dark:shadow-gs-card',
      )}
      style={{ borderRadius: 'var(--gs-card-radius)', ...style }}
    >
      {accentGlow ? (
        <div
          className="pointer-events-none absolute -left-10 -top-10 h-[120px] w-[120px] rounded-full blur-[40px]"
          style={{ background: accentGlow }}
        />
      ) : null}
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase tracking-[0.06em] text-gs-text-secondary dark:text-gs-dark-text-secondary">
      {children}
    </span>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="mt-1.5 h-1 rounded-sm bg-muted dark:bg-white/[0.06]">
      <div
        className="h-full rounded-sm transition-[width] duration-500 ease-out"
        style={{ width: `${(value / max) * 100}%`, background: color }}
      />
    </div>
  );
}

function Last24HoursCard({ hubCode }: { hubCode: string }) {
  const { low, high, avg } = useMemo(() => {
    const l = Math.min(...LAST_24H_PRICES);
    const h = Math.max(...LAST_24H_PRICES);
    const a = LAST_24H_PRICES.reduce((s, v) => s + v, 0) / LAST_24H_PRICES.length;
    return { low: l, high: h, avg: a };
  }, []);

  const barMax = high * 1.1;
  const rows = [
    { label: 'Low', value: low, color: 'var(--gs-cheap)' },
    { label: 'Avg', value: avg, color: 'var(--gs-moderate)' },
    { label: 'High', value: high, color: 'var(--gs-peak)' },
  ] as const;

  return (
    <Card accentGlow="var(--gs-glow-moderate)">
      <Label>Previous 24 Hours</Label>
      <div className="mt-4 flex flex-col gap-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-gs-text-secondary dark:text-gs-dark-text-secondary">
                {r.label}
              </span>
              <span className="font-gs-mono text-[22px] font-bold" style={{ color: r.color }}>
                ${r.value.toFixed(2)}
              </span>
            </div>
            <MiniBar value={r.value} max={barMax} color={r.color} />
          </div>
        ))}
      </div>
      <div className="mt-3.5 text-[11px] text-gs-text-muted dark:text-gs-dark-text-muted">
        $/MWh · {hubCode}
      </div>
    </Card>
  );
}

function CurrentPriceCard() {
  const tier = getPriceTier(CURRENT_PRICE);
  const colorVar = GS_COLOR[tier];
  const label = getPriceLabelForTier(tier);
  const prevPrice = MOCK_PRICES_TODAY[CURRENT_HOUR - 1] ?? CURRENT_PRICE;
  const direction: 'up' | 'down' = CURRENT_PRICE >= prevPrice ? 'up' : 'down';

  return (
    <Card accentGlow={GS_GLOW[tier]}>
      <div className="flex items-start justify-between">
        <div>
          <Label>Right Now</Label>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="font-gs-mono text-[42px] font-bold leading-none"
              style={{ color: colorVar }}
            >
              ${CURRENT_PRICE.toFixed(2)}
            </span>
            <span className="text-sm text-gs-text-secondary dark:text-gs-dark-text-secondary">/MWh</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <PulseDot colorVar={colorVar} />
            <span className="text-[13px] font-semibold" style={{ color: colorVar }}>
              {label}
            </span>
            <TrendArrow direction={direction} />
            <span className="text-xs text-gs-text-muted dark:text-gs-dark-text-muted">vs last hour</span>
          </div>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-[22px]"
          style={{
            background: `color-mix(in srgb, ${colorVar} 12%, transparent)`,
          }}
        >
          ⚡
        </div>
      </div>
    </Card>
  );
}

function BestTimeCard() {
  const futureHours = MOCK_PRICES_TODAY.slice(CURRENT_HOUR);
  const cheapestIdx = futureHours.indexOf(Math.min(...futureHours));
  const cheapestHour = CURRENT_HOUR + cheapestIdx;
  const cheapestPrice = futureHours[cheapestIdx];
  const minutesUntil = (cheapestHour - CURRENT_HOUR) * 60 + 15;
  const countdown = useCountdown(minutesUntil);

  const hourLabel =
    cheapestHour > 12
      ? `${cheapestHour - 12}:00 PM`
      : cheapestHour === 0
        ? '12:00 AM'
        : `${cheapestHour}:00 AM`;

  return (
    <Card accentGlow="var(--gs-glow-cheap)">
      <Label>Best Time to Run</Label>
      <div className="mt-2.5 font-gs-mono text-[28px] font-bold text-gs-cheap">{hourLabel}</div>
      <div className="mt-0.5 text-[13px] text-gs-text-secondary dark:text-gs-dark-text-secondary">
        ~${cheapestPrice}/MWh
      </div>
      <div className="mt-3.5 inline-flex items-center gap-2 rounded-[10px] border border-gs-cheap/20 bg-gs-badge-cheap px-3.5 py-2 dark:border-gs-cheap/25">
        <span className="text-sm">⏱</span>
        <span className="font-gs-mono text-[15px] font-semibold text-gs-cheap">{countdown}</span>
      </div>
    </Card>
  );
}

function RateComparisonCard() {
  const realTimeCents = CURRENT_PRICE / 10;
  const saving = FLAT_RATE_CENTS - realTimeCents;
  const isSaving = saving > 0;
  const barMax = Math.max(FLAT_RATE_CENTS, realTimeCents) * 1.2;
  const glow = isSaving ? GS_GLOW[getPriceTier(CURRENT_PRICE)] : GS_GLOW.peak;
  const posVar = 'var(--gs-cheap)';
  const negVar = 'var(--gs-peak)';

  return (
    <Card accentGlow={glow}>
      <Label>vs. Your Flat Rate</Label>
      <div className="mt-3.5 flex flex-col gap-2.5">
        <div>
          <div className="mb-1 flex justify-between">
            <span className="text-xs text-gs-text-secondary dark:text-gs-dark-text-secondary">
              Real-time now
            </span>
            <span
              className="font-gs-mono text-sm font-bold"
              style={{ color: isSaving ? posVar : negVar }}
            >
              {realTimeCents.toFixed(1)}¢/kWh
            </span>
          </div>
          <div className="h-2 rounded bg-muted">
            <div
              className="h-full rounded transition-[width] duration-500 ease-out"
              style={{
                width: `${(realTimeCents / barMax) * 100}%`,
                background: isSaving
                  ? `linear-gradient(90deg, ${posVar}, #6ee7b7)`
                  : `linear-gradient(90deg, ${negVar}, #f87171)`,
              }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <span className="text-xs text-gs-text-secondary dark:text-gs-dark-text-secondary">
              Your flat rate
            </span>
            <span className="font-gs-mono text-sm font-semibold text-gs-text-secondary dark:text-gs-dark-text-secondary">
              {FLAT_RATE_CENTS}¢/kWh
            </span>
          </div>
          <div className="h-2 rounded bg-muted">
            <div
              className="h-full rounded bg-gradient-to-r from-gs-text-primary/15 to-gs-text-primary/8 dark:from-white/25 dark:to-white/15"
              style={{ width: `${(FLAT_RATE_CENTS / barMax) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div
        className="mt-3.5 text-sm font-semibold"
        style={{ color: isSaving ? posVar : negVar }}
      >
        {isSaving
          ? `Saving ${saving.toFixed(1)}¢/kWh right now`
          : `${Math.abs(saving).toFixed(1)}¢/kWh above your rate`}
      </div>
    </Card>
  );
}

function Next4HoursCard() {
  const upcoming = MOCK_PRICES_TODAY.slice(CURRENT_HOUR, CURRENT_HOUR + 5);
  const maxPrice = Math.max(...upcoming);
  const minPrice = Math.min(...upcoming);
  const trendDir: 'up' | 'down' = upcoming[upcoming.length - 1]! > upcoming[0]! ? 'up' : 'down';
  const lastTier = getPriceTier(upcoming[upcoming.length - 1]!);
  const colorVar = GS_COLOR[lastTier];

  const hours = upcoming.map((_, i) => {
    const h = (CURRENT_HOUR + i) % 24;
    if (i === 0) return 'Now';
    return h > 12 ? `${h - 12}p` : h === 0 ? '12a' : `${h}a`;
  });

  return (
    <Card accentGlow={GS_GLOW[lastTier]}>
      <div className="flex items-start justify-between">
        <div>
          <Label>Next 4 Hours</Label>
          <div className="mt-2 flex items-center gap-1.5">
            <TrendArrow direction={trendDir} />
            <span className="text-sm text-gs-text-secondary dark:text-gs-dark-text-secondary">
              ${minPrice}–${maxPrice}/MWh
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Sparkline data={upcoming} width={240} height={52} color={colorVar} />
        <div className="mt-1.5 flex justify-between">
          {hours.map((h, i) => (
            <span key={i} className="font-gs-mono text-[10px] text-gs-text-muted dark:text-gs-dark-text-muted">
              {h}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {upcoming.map((p, i) => {
          const t = getPriceTier(p);
          return (
            <span
              key={i}
              className="font-gs-mono rounded-md border border-gs-border px-2 py-0.5 text-[11px] font-semibold dark:border-white/15"
              style={{
                background: GS_BADGE_BG[t],
                color: GS_COLOR[t],
              }}
            >
              ${p}
            </span>
          );
        })}
      </div>
    </Card>
  );
}

export type CardIterationsShowcaseProps = {
  hub: string;
};

/** Glass metric cards (mock series until wired to live prices). */
export function CardIterationsShowcase({ hub }: CardIterationsShowcaseProps) {
  return (
    <section className="font-gs-body">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        <CurrentPriceCard />
        <BestTimeCard />
        <RateComparisonCard />
        <Next4HoursCard />
        <Last24HoursCard hubCode={hub} />
      </div>
    </section>
  );
}
