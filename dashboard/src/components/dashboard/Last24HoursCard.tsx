import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatIntervalForDisplay } from '@/lib/price-interval';
import { formatUsd, formatWallClock, type TimedPrice } from '@/lib/prices';

/**
 * Glass-style metric card — surfaces & glows from `src/styles/gridshift-tokens.css`.
 */

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  // Negative prices happen in ERCOT; keep the bar at zero width rather than overflowing.
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <div className="mt-1.5 h-1 rounded-sm bg-muted dark:bg-white/[0.06]">
      <div
        className="h-full rounded-sm transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export type Last24HoursCardProps = {
  prices: TimedPrice[];
  hub: string;
};

export function Last24HoursCard({ prices, hub }: Last24HoursCardProps) {
  const stats = useMemo(() => {
    if (!prices.length) return null;
    let low = prices[0]!;
    let high = prices[0]!;
    let sum = 0;
    for (const p of prices) {
      if (p.pricePerMwh < low.pricePerMwh) low = p;
      if (p.pricePerMwh > high.pricePerMwh) high = p;
      sum += p.pricePerMwh;
    }
    return { low, high, avg: sum / prices.length };
  }, [prices]);

  if (!stats) return null;

  const barMax = stats.high.pricePerMwh * 1.1;
  const rows = [
    { label: 'Low', value: stats.low.pricePerMwh, at: stats.low.intervalEnd, color: 'var(--gs-cheap)' },
    { label: 'Avg', value: stats.avg, at: null, color: 'var(--gs-moderate)' },
    { label: 'High', value: stats.high.pricePerMwh, at: stats.high.intervalEnd, color: 'var(--gs-peak)' },
  ] as const;

  return (
    <section className="font-gs-body">
      <div
        className={cn(
          /* isolate: backdrop-filter + border-radius clipping in WebKit */
          'relative isolate overflow-hidden rounded-2xl border px-7 py-6 backdrop-blur-gs-card',
          'border-gs-border bg-gs-light-wash shadow-sm',
          'dark:border-gs-card dark:bg-gs-card-surface dark:shadow-gs-card',
        )}
        style={{ borderRadius: 'var(--gs-card-radius)' }}
      >
        <div
          className="pointer-events-none absolute -left-10 -top-10 h-[120px] w-[120px] rounded-full blur-[40px]"
          style={{ background: 'var(--gs-glow-moderate)' }}
        />
        <span className="text-xs font-medium uppercase tracking-[0.06em] text-gs-text-secondary dark:text-gs-dark-text-secondary">
          Previous 24 hours
        </span>
        <div className="mt-4 grid gap-5 sm:grid-cols-3 sm:gap-8">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-gs-text-secondary dark:text-gs-dark-text-secondary">
                  {r.label}
                  {r.at ? (
                    <span className="ml-1.5 font-gs-mono text-[11px] text-gs-text-muted dark:text-gs-dark-text-muted">
                      {formatIntervalForDisplay(r.at)}
                    </span>
                  ) : null}
                </span>
                <span className="font-gs-mono text-[22px] font-bold" style={{ color: r.color }}>
                  {formatUsd(r.value)}
                </span>
              </div>
              <MiniBar value={r.value} max={barMax} color={r.color} />
            </div>
          ))}
        </div>
        <div className="mt-3.5 text-[11px] text-gs-text-muted dark:text-gs-dark-text-muted">
          $/MWh · {hub} · {formatWallClock(prices[0]!.ts)} – {formatWallClock(prices[prices.length - 1]!.ts)} CT
        </div>
      </div>
    </section>
  );
}
