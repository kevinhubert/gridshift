import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { centralNowMs, formatUsd, formatWallClock, type PriceSnapshot, type TimedPrice } from '@/lib/prices';
import { getPriceTier, getTierDisplayLabel, type PriceTier } from '@/lib/price-tier';

/**
 * Message pools from `gridshift-hero-v3.jsx` (cheap / moderate / peak).
 * Elevated tier uses the moderate pool in the prototype model.
 */
type HeroMessageTier = 'cheap' | 'moderate' | 'peak';

const HERO_MESSAGES: Record<HeroMessageTier, { headline: string; sub: string }[]> = {
  cheap: [
    { headline: 'Power is cheap right now.', sub: 'Run the dryer. Charge the car. Go wild.' },
    { headline: 'The grid is on your side.', sub: "Great time to run anything you've been putting off." },
    { headline: 'Electricity is practically free.', sub: 'Crank the AC. Do the laundry. Live a little.' },
    { headline: "Prices bottomed out.", sub: "If it plugs in, now's the time." },
    { headline: 'The grid is quiet.', sub: 'Low demand, low prices. Take advantage.' },
  ],
  moderate: [
    { headline: 'Prices are climbing.', sub: 'Not terrible, but maybe hold off on the big stuff.' },
    { headline: 'The grid is getting busy.', sub: 'Nothing urgent — just be mindful.' },
    { headline: 'Costs are picking up.', sub: 'Fine for essentials, skip the marathon laundry session.' },
    { headline: 'Middle of the road.', sub: "Won't break the bank, but cheaper hours are coming." },
    { headline: 'Demand is rising.', sub: 'Use what you need, save what you can.' },
  ],
  peak: [
    { headline: "It's expensive out there.", sub: 'Ease up if you can. Prices are spiking.' },
    { headline: 'The grid is under pressure.', sub: 'Hold off on anything that can wait.' },
    { headline: 'Peak pricing. Tread lightly.', sub: 'Every kilowatt counts right now.' },
    { headline: 'Prices are through the roof.', sub: 'Delay heavy loads. Relief is a few hours out.' },
    { headline: 'Not the time.', sub: 'Seriously — wait a bit. Your wallet will thank you.' },
  ],
};

function heroMessagePool(priceTier: PriceTier): { headline: string; sub: string }[] {
  if (priceTier === 'cheap') return HERO_MESSAGES.cheap;
  if (priceTier === 'peak') return HERO_MESSAGES.peak;
  return HERO_MESSAGES.moderate;
}

/** Peak shows as "Expensive" in hero v3 status pill. */
function heroPillLabel(tier: PriceTier): string {
  if (tier === 'peak') return 'Expensive';
  return getTierDisplayLabel(tier);
}

const TIER_ACCENT_VAR: Record<PriceTier, string> = {
  cheap: 'var(--gs-cheap)',
  moderate: 'var(--gs-moderate)',
  elevated: 'var(--gs-elevated)',
  peak: 'var(--gs-peak)',
};

/** Age of the latest ERCOT interval (not of our fetch). */
function formatPricesUpdatedLabel(snapshot: PriceSnapshot | null, loading: boolean): string {
  if (!snapshot) return loading ? 'Loading…' : 'No data';
  const { latest, stale } = snapshot;
  if (stale) return `Last recorded ${formatWallClock(latest.ts)} CT`;
  const min = Math.max(0, Math.floor((centralNowMs() - latest.ts) / 60_000));
  if (min < 1) return `Interval ending ${latest.intervalEnd} CT · just now`;
  return `Interval ending ${latest.intervalEnd} CT · ${min} min ago`;
}

type VsLastHour = {
  delta: number;
  direction: 'up' | 'down' | 'flat';
};

function vsLastHour(current: TimedPrice, prev: TimedPrice | null): VsLastHour | null {
  if (!prev) return null;
  const delta = current.pricePerMwh - prev.pricePerMwh;
  if (delta === 0) return { delta: 0, direction: 'flat' };
  return { delta, direction: delta < 0 ? 'down' : 'up' };
}

type StatusPillProps = {
  tier: PriceTier;
  price: number;
  vs: VsLastHour | null;
  hasPoint: boolean;
  /** Pulse the dot only when the price is current. */
  live: boolean;
};

/** Segmented pill from `gridshift-hero-v3.jsx`, themed with GridShift tokens. */
function StatusPill({ tier, price, vs, hasPoint, live }: StatusPillProps) {
  const accent = TIER_ACCENT_VAR[tier];
  const shell: CSSProperties = {
    backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
    borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`,
  };
  const pulseColor = `color-mix(in srgb, ${accent} 40%, transparent)`;
  const dividerClass = 'h-4 w-px shrink-0';
  const dividerStyle: CSSProperties = { backgroundColor: `color-mix(in srgb, ${accent} 25%, transparent)` };

  const trendColor =
    vs?.direction === 'down'
      ? 'text-gs-cheap'
      : vs?.direction === 'up'
        ? 'text-gs-peak'
        : 'text-muted-foreground';

  return (
    <div
      className="mb-4 inline-flex items-center gap-0 overflow-hidden rounded-full border py-[5px] pl-0 pr-0 [animation:gs-hero-fade-in-up_0.35s_ease-out]"
      style={shell}
    >
      <div className="flex items-center gap-1.5 py-0 pl-2 pr-3">
        <span
          className="size-[7px] shrink-0 rounded-full"
          style={
            {
              background: accent,
              ['--pulse-color' as string]: pulseColor,
              animation: live ? 'gs-hero-live-pulse 2s ease-in-out infinite' : undefined,
            } as CSSProperties
          }
          aria-hidden
        />
        <span className="text-[13px] font-semibold" style={{ color: accent }}>
          {heroPillLabel(tier)}
        </span>
      </div>
      <div className={dividerClass} style={dividerStyle} aria-hidden />
      <div className="px-3">
        <span className="font-gs-mono text-[13px] font-semibold tabular-nums text-foreground/80">
          {hasPoint ? formatUsd(price) : '—'}
          <span className="font-normal text-muted-foreground/80">/MWh</span>
        </span>
      </div>
      <div className={dividerClass} style={dividerStyle} aria-hidden />
      <div className="flex items-center gap-1 py-0 pl-3 pr-2.5">
        {vs == null ? (
          <span className="font-gs-mono text-xs text-muted-foreground">—</span>
        ) : (
          <>
            {vs.direction !== 'flat' ? (
              <span className={cn('text-[11px] leading-none', trendColor)} aria-hidden>
                {vs.direction === 'down' ? '▼' : '▲'}
              </span>
            ) : null}
            <span className={cn('font-gs-mono text-xs tabular-nums', trendColor)}>
              {vs.direction === 'flat'
                ? '$0.00'
                : `${vs.delta > 0 ? '+' : '−'}$${Math.abs(vs.delta).toFixed(2)}`}
            </span>
          </>
        )}
        <span className="ml-0.5 text-[11px] text-muted-foreground/80">vs last hour</span>
      </div>
    </div>
  );
}

export type HeroCalloutProps = {
  snapshot: PriceSnapshot | null;
  hub: string;
  loading?: boolean;
  error?: string | null;
};

export function HeroCallout({ snapshot, hub, loading = false, error = null }: HeroCalloutProps) {
  // A stalled feed must not read as "right now" — no rotating advice.
  const point = snapshot && !snapshot.stale ? snapshot.latest : null;
  const shown = snapshot?.latest ?? null;
  const price = shown?.pricePerMwh ?? 0;
  const tier = shown ? getPriceTier(price) : 'cheap';
  const pool = heroMessagePool(tier);
  const vs = shown && snapshot ? vsLastHour(shown, snapshot.hourAgo) : null;

  const [msgIndex, setMsgIndex] = useState(0);
  const [animState, setAnimState] = useState<'in' | 'out'>('in');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const len = heroMessagePool(tier).length;
    setMsgIndex(Math.floor(Math.random() * len));
    setAnimState('in');
  }, [tier]);

  useEffect(() => {
    if (!point) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    const len = heroMessagePool(tier).length;
    timerRef.current = setInterval(() => {
      setAnimState('out');
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % len);
        setAnimState('in');
      }, 400);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tier, point]);

  const msg = pool[msgIndex]!;
  const headlineAnim =
    animState === 'in'
      ? 'gs-hero-fade-in-up 0.45s ease-out forwards'
      : 'gs-hero-fade-out-up 0.35s ease-in forwards';
  const subAnim =
    animState === 'in'
      ? 'gs-hero-fade-in-up 0.45s ease-out 0.06s both'
      : 'gs-hero-fade-out-up 0.35s ease-in forwards';

  return (
    <section className="font-gs-body">
      <div className="max-w-[38rem]">
        {shown ? (
          <StatusPill key={tier} tier={tier} price={price} vs={vs} hasPoint live={Boolean(point)} />
        ) : null}

        <div className="min-h-[4.25rem]">
          {point ? (
            <>
              <h1
                key={`${tier}-${msgIndex}`}
                className="font-gs-serif text-[2.125rem] font-normal italic leading-snug tracking-tight text-foreground"
                style={{ animation: headlineAnim }}
              >
                {msg.headline}
              </h1>
              <p
                key={`sub-${tier}-${msgIndex}`}
                className="mt-2.5 text-[15px] font-light leading-relaxed text-muted-foreground"
                style={{ animation: subAnim }}
              >
                {msg.sub}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-gs-serif text-[2.125rem] font-normal italic leading-snug tracking-tight text-foreground">
                {snapshot?.stale
                  ? 'Live prices are paused.'
                  : loading
                    ? 'Checking the grid…'
                    : error
                      ? 'Prices are unavailable.'
                      : 'No prices for this zone yet.'}
              </h1>
              <p className="mt-2.5 text-[15px] font-light leading-relaxed text-muted-foreground">
                {snapshot?.stale
                  ? `We haven’t received new ERCOT data since ${formatWallClock(snapshot.latest.ts)}. The chart below shows the last recorded day.`
                  : loading
                    ? 'Fetching the latest ERCOT settlement prices.'
                    : (error ?? 'Try another load zone or check back after the next refresh.')}
              </p>
            </>
          )}
        </div>

        <div className="mt-4">
          <span className="font-gs-mono text-[11px] tracking-wide text-muted-foreground/70">
            {hub}
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            {formatPricesUpdatedLabel(snapshot, loading)}
          </span>
        </div>
      </div>
    </section>
  );
}
