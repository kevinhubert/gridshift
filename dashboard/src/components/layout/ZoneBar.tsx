import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HUB_OPTIONS } from '@/constants/hubs';

export type ZoneBarProps = {
  hub: string;
  onHubChange: (hub: string) => void;
};

export function ZoneBar({ hub, onHubChange }: ZoneBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ring/10 text-xs">
          ⚡
        </div>
        <span className="font-mono text-xs font-semibold tracking-wide text-ring">{hub}</span>
      </div>

      <label className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Load zone</span>
        <Select value={hub} onValueChange={onHubChange}>
          <SelectTrigger className="h-8 min-w-[220px] text-foreground" aria-label="Load zone">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HUB_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
