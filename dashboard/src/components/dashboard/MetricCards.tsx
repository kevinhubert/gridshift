export type MetricCardsProps = {
  low: number;
  lowAtInterval: string;
  high: number;
  highAtInterval: string;
  avg: number;
  savingsValue: string;
  savingsDetail?: string;
};

function formatHourClock(interval: string): string {
  const [hStr, mStr = '00'] = interval.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function MetricCards({
  low,
  lowAtInterval,
  high,
  highAtInterval,
  avg,
  savingsValue,
  savingsDetail = 'vs. flat rate',
}: MetricCardsProps) {
  const metrics = [
    {
      label: "Today's low",
      value: formatPrice(low),
      detail: formatHourClock(lowAtInterval),
      color: 'text-emerald-500',
    },
    {
      label: "Today's high",
      value: formatPrice(high),
      detail: formatHourClock(highAtInterval),
      color: 'text-red-500',
    },
    {
      label: 'Average',
      value: formatPrice(avg),
      detail: 'All hours',
      color: '',
    },
    {
      label: 'Your savings',
      value: savingsValue,
      detail: savingsDetail,
      color: savingsValue !== '—' ? 'text-emerald-500' : '',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-lg border border-border bg-card px-4 py-3.5 text-card-foreground shadow-sm"
        >
          <div className="mb-1 text-xs text-muted-foreground">{m.label}</div>
          <div className={`text-[22px] font-medium ${m.color || 'text-foreground'}`}>{m.value}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{m.detail}</div>
        </div>
      ))}
    </div>
  );
}
