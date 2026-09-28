/** Zero-padded HH:MM for stable ordering and unique x per interval. */
export function normalizeIntervalEnd(interval: string): string {
  const [rawH, rawM] = interval.trim().split(':');
  const h = parseInt(rawH, 10);
  const m = parseInt(rawM ?? '0', 10);
  if (Number.isNaN(h)) return '00:00';
  const hh = ((h % 24) + 24) % 24;
  const mm = Number.isNaN(m) ? 0 : ((m % 60) + 60) % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Human-readable label for axis / tooltips (e.g. 09:00 → 9am, 14:30 → 2:30pm). */
export function formatIntervalForDisplay(interval: string): string {
  const [hs, ms] = normalizeIntervalEnd(interval).split(':');
  const h = parseInt(hs, 10);
  const m = parseInt(ms || '0', 10);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'am' : 'pm';
  if (m === 0) return `${hour12}${ampm}`;
  return `${hour12}:${String(m).padStart(2, '0')}${ampm}`;
}

/** Prefer hourly ticks; otherwise thin out so the axis stays readable. */
export function pickIntervalTickValues(xs: string[]): string[] {
  if (xs.length === 0) return [];
  const hourly = xs.filter((x) => /^\d{2}:\d{2}$/.test(x) && x.endsWith(':00'));
  if (hourly.length >= 2) return hourly;
  const step = Math.max(1, Math.ceil(xs.length / 12));
  return xs.filter((_, i) => i % step === 0);
}

/** Minutes from midnight for an interval-end label `HH:MM`. */
export function minutesFromIntervalEnd(interval: string): number {
  const [hs, ms] = normalizeIntervalEnd(interval).split(':');
  const h = parseInt(hs, 10);
  const m = parseInt(ms || '0', 10);
  if (Number.isNaN(h)) return 0;
  const hh = ((h % 24) + 24) % 24;
  const mm = Number.isNaN(m) ? 0 : ((m % 60) + 60) % 60;
  return hh * 60 + mm;
}

/** 12am, 3am, … — only marks that exist in the series (point scale). */
export function pickThreeHourTickValues(xs: string[]): string[] {
  if (xs.length === 0) return [];
  const set = new Set(xs.map((x) => normalizeIntervalEnd(x)));
  const marks = [
    '00:00',
    '03:00',
    '06:00',
    '09:00',
    '12:00',
    '15:00',
    '18:00',
    '21:00',
  ];
  return marks.filter((m) => set.has(m));
}
