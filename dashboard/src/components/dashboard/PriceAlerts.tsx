import type { PricePoint } from '@/types';

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

function formatHourClock(interval: string): string {
  const [hStr, mStr = '00'] = interval.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function hourKey(interval: string): number {
  return parseInt(interval.split(':')[0], 10);
}

function buildByHour(prices: PricePoint[]): Map<number, PricePoint> {
  const m = new Map<number, PricePoint>();
  for (const p of prices) {
    m.set(hourKey(p.intervalEnd), p);
  }
  return m;
}

type AlertRow = {
  icon: 'up' | 'down';
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
};

function buildAlerts(prices: PricePoint[], currentHour: number): AlertRow[] {
  if (prices.length === 0) return [];

  const values = prices.map((p) => p.pricePerMwh);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const cheapMax = min + span * 0.33;
  const expensiveMin = max - span * 0.33;

  const byHour = buildByHour(prices);
  const currentPrice = byHour.get(currentHour)?.pricePerMwh ?? values[0];

  const rows: AlertRow[] = [];

  let nextCheapHour: number | null = null;
  for (let h = currentHour; h < 24; h++) {
    const pt = byHour.get(h);
    if (pt && pt.pricePerMwh <= cheapMax) {
      nextCheapHour = h;
      break;
    }
  }

  if (nextCheapHour !== null) {
    const pt = byHour.get(nextCheapHour)!;
    const hoursUntil = nextCheapHour - currentHour;
    if (hoursUntil > 0) {
      rows.push({
        icon: 'up',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        title: 'Cheap window ahead',
        subtitle: `Prices drop below ${formatPrice(pt.pricePerMwh)} at ${formatHourClock(pt.intervalEnd)}`,
        time: `${hoursUntil}h`,
      });
    } else {
      rows.push({
        icon: 'up',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        title: 'Cheap window now',
        subtitle: `Around ${formatHourClock(pt.intervalEnd)} (${formatPrice(pt.pricePerMwh)}/MWh)`,
        time: 'Now',
      });
    }
  } else {
    const cheapest = [...prices].sort((a, b) => a.pricePerMwh - b.pricePerMwh)[0];
    rows.push({
      icon: 'up',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      title: 'Best prices today',
      subtitle: `Lowest at ${formatHourClock(cheapest.intervalEnd)} (${formatPrice(cheapest.pricePerMwh)}/MWh)`,
      time: hourKey(cheapest.intervalEnd) < currentHour ? 'Earlier' : 'Soon',
    });
  }

  if (currentPrice >= expensiveMin) {
    let endPeak: number | null = null;
    for (let h = currentHour + 1; h < 24; h++) {
      const pt = byHour.get(h);
      if (pt && pt.pricePerMwh < expensiveMin) {
        endPeak = h;
        break;
      }
    }
    const untilLabel =
      endPeak !== null ? formatHourClock(`${String(endPeak).padStart(2, '0')}:00`) : '10 PM';
    rows.push({
      icon: 'down',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      title: 'Peak pricing active',
      subtitle: `Avoid heavy usage until ${untilLabel}`,
      time: 'Now',
    });
  } else {
    const expensive = [...prices].sort((a, b) => b.pricePerMwh - a.pricePerMwh)[0];
    const eh = hourKey(expensive.intervalEnd);
    rows.push({
      icon: 'down',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
      title: 'Peak hours',
      subtitle: `Highest around ${formatHourClock(expensive.intervalEnd)} (${formatPrice(expensive.pricePerMwh)}/MWh)`,
      time: eh === currentHour ? 'Now' : eh > currentHour ? `${eh - currentHour}h` : 'Later',
    });
  }

  return rows.slice(0, 2);
}

export type PriceAlertsProps = {
  prices: PricePoint[];
};

export function PriceAlerts({ prices }: PriceAlertsProps) {
  const currentHour = new Date().getHours();
  const alerts = buildAlerts(prices, currentHour);

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-base font-medium text-foreground">Price alerts</span>
        <button
          type="button"
          className="text-xs text-emerald-500 hover:text-emerald-400 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Set alert
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {alerts.map((a) => (
          <div
            key={`${a.title}-${a.subtitle}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 text-card-foreground shadow-sm"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${a.iconBg}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={a.iconColor}
                aria-hidden
              >
                {a.icon === 'up' ? (
                  <path d="M2 10l6-8 6 8H2z" fill="currentColor" />
                ) : (
                  <path d="M2 6l6 8 6-8H2z" fill="currentColor" />
                )}
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">{a.title}</div>
              <div className="text-xs text-muted-foreground">{a.subtitle}</div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
