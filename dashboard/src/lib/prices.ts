import { supabase } from '@/lib/supabase';
import type { PricePoint } from '@/types';

/**
 * `price_cache.interval_end` holds ERCOT's Central wall-clock time tagged as UTC
 * (e.g. 14:15 Central is stored as `…T14:15:00+00:00`). All timestamps here are
 * "wall-clock ms": parsed as UTC so they compare directly with {@link centralNowMs}.
 */

/** Data older than this is treated as a stalled feed rather than live. */
const STALE_AFTER_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const INTERVAL_MS = 15 * 60 * 1000;

export type TimedPrice = PricePoint & { ts: number };

export type PriceSnapshot = {
  /** Every interval for `day`, ascending. */
  today: TimedPrice[];
  /** Rolling 24 hours ending at `latest`, ascending. */
  last24: TimedPrice[];
  latest: TimedPrice;
  /** Price one hour before `latest`, if recorded. */
  hourAgo: TimedPrice | null;
  /** Operating day of `today` (YYYY-MM-DD). */
  day: string;
  stale: boolean;
};

/** Current Central Time wall clock as wall-clock ms. */
export function centralNowMs(): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
}

/** e.g. "Thu, Apr 9" */
export function formatDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** e.g. "Apr 9, 9:30 PM" */
export function formatWallClock(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type Row = { interval_end: string; price_per_mwh: number; oper_day: string };

function toTimed(row: Row): TimedPrice {
  const wall = row.interval_end.slice(0, 19);
  return {
    ts: Date.parse(`${wall}Z`),
    intervalEnd: wall.slice(11, 16),
    pricePerMwh: Number(row.price_per_mwh),
  };
}

export async function fetchPriceSnapshot(hub: string): Promise<PriceSnapshot | null> {
  if (!supabase) throw new Error('Price data is not configured');

  const { data: newest, error: newestError } = await supabase
    .from('price_cache')
    .select('interval_end, oper_day')
    .eq('hub', hub)
    .order('interval_end', { ascending: false })
    .limit(1);
  if (newestError) throw newestError;
  if (!newest?.length) return null;

  const day = newest[0]!.oper_day as string;
  const latestWall = (newest[0]!.interval_end as string).slice(0, 19);
  const windowStart = new Date(Date.parse(`${latestWall}Z`) - DAY_MS).toISOString().slice(0, 19);

  const { data, error } = await supabase
    .from('price_cache')
    .select('interval_end, price_per_mwh, oper_day')
    .eq('hub', hub)
    .gte('interval_end', windowStart)
    .order('interval_end', { ascending: true })
    .limit(1000);
  if (error) throw error;

  // Older rows were double-inserted; keep one per interval.
  const byTs = new Map<number, TimedPrice & { day: string }>();
  for (const row of (data ?? []) as Row[]) {
    const p = toTimed(row);
    if (!byTs.has(p.ts)) byTs.set(p.ts, { ...p, day: row.oper_day });
  }
  const rows = [...byTs.values()];
  const latest = rows[rows.length - 1]!;
  const strip = ({ day: _day, ...p }: TimedPrice & { day: string }): TimedPrice => p;

  return {
    today: rows.filter((r) => r.day === day).map(strip),
    last24: rows.filter((r) => r.ts > latest.ts - DAY_MS).map(strip),
    latest: strip(latest),
    hourAgo: byTs.has(latest.ts - 4 * INTERVAL_MS) ? strip(byTs.get(latest.ts - 4 * INTERVAL_MS)!) : null,
    day,
    stale: centralNowMs() - latest.ts > STALE_AFTER_MS,
  };
}

/** `$12.50` / `−$12.50` — ERCOT prices can go negative. */
export function formatUsd(value: number, digits = 2): string {
  const abs = Math.abs(value).toFixed(digits);
  return value < 0 && Number(abs) !== 0 ? `−$${abs}` : `$${abs}`;
}
