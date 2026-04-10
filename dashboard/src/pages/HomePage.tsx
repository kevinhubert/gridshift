import { useOutletContext } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import type { AppLayoutOutletContext } from '@/layouts/AppLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function HomePage() {
  const { hub, displayPrices, error, theme } = useOutletContext<AppLayoutOutletContext>();

  return (
    <>
      {error && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertDescription className="text-amber-800 dark:text-amber-400">{error}</AlertDescription>
        </Alert>
      )}
      <Dashboard prices={displayPrices} hub={hub} isDark={theme === 'dark'} />
    </>
  );
}
