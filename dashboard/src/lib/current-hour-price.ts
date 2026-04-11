import type { PricePoint } from '@/types';

/** Best-effort match for a given local hour (0–23) to today's series. */
export function getPriceForHour(prices: PricePoint[], hour24: number): PricePoint | null {
  if (!prices.length) return null;
  const h = ((hour24 % 24) + 24) % 24;
  const prefix = `${String(h).padStart(2, '0')}:`;
  const hit = prices.find((p) => p.intervalEnd.startsWith(prefix));
  if (hit) return hit;
  return prices[Math.min(h, prices.length - 1)] ?? prices[0] ?? null;
}

/** Best-effort match of today's hourly row to the user's local clock. */
export function getPriceForLocalHour(prices: PricePoint[]): PricePoint | null {
  return getPriceForHour(prices, new Date().getHours());
}
