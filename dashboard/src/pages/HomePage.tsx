import { useOutletContext } from 'react-router-dom';
import posthog from 'posthog-js';
import Dashboard from '@/pages/Dashboard';
import type { AppLayoutOutletContext } from '@/layouts/AppLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HUB_OPTIONS } from '@/constants/hubs';

export default function HomePage() {
  const { hub, setHub, displayPrices, loading, error, theme } = useOutletContext<AppLayoutOutletContext>();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Hub:</span>
          <Select
            value={hub}
            onValueChange={(value) => {
              setHub(value);
              posthog.capture('hub_changed', { hub: value });
            }}
          >
            <SelectTrigger
              id="hub-select"
              className="h-9 w-[min(100vw-8rem,220px)] border-border bg-background text-sm font-normal shadow-none sm:w-[220px]"
              aria-label="ERCOT load zone hub"
            >
              <SelectValue placeholder="Select hub" />
            </SelectTrigger>
            <SelectContent>
              {HUB_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {loading && <span className="text-xs text-muted-foreground animate-pulse">Fetching…</span>}
      </div>

      {error && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertDescription className="text-amber-800 dark:text-amber-400">{error}</AlertDescription>
        </Alert>
      )}
      <Dashboard prices={displayPrices} hub={hub} isDark={theme === 'dark'} />
    </>
  );
}
