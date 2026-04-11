import { useOutletContext } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import type { AppLayoutOutletContext } from '@/layouts/AppLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CardIterationsShowcaseBottom,
  CardIterationsShowcaseTop,
} from '@/components/dashboard/CardIterationsShowcase';
import { HeroCallout } from '@/components/dashboard/HeroCallout';
import ERCOTMap from '@/components/dashboard/ERCOTMap';

/** Flip to `true` when ERCOT map work resumes. */
const SHOW_ERCOT_MAP = false;

export default function HomePage() {
  const { hub, setHub, displayPrices, error, pricesUpdatedAt, loading, theme } =
    useOutletContext<AppLayoutOutletContext>();

  return (
    <>
      <HeroCallout
        prices={displayPrices}
        hub={hub}
        pricesUpdatedAt={pricesUpdatedAt}
        loading={loading}
      />

      <Dashboard prices={displayPrices} hub={hub} isDark={theme === 'dark'} />

      <CardIterationsShowcaseTop hub={hub} />

      {error && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertDescription className="text-amber-800 dark:text-amber-400">{error}</AlertDescription>
        </Alert>
      )}

      {SHOW_ERCOT_MAP && (
        <ERCOTMap displayPrices={displayPrices} hub={hub} onHubChange={setHub} />
      )}

      <CardIterationsShowcaseBottom />
    </>
  );
}
