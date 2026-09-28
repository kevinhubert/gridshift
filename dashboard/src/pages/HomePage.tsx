import { useOutletContext } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import type { AppLayoutOutletContext } from '@/layouts/AppLayout';
import { HeroCallout } from '@/components/dashboard/HeroCallout';
import { Last24HoursCard } from '@/components/dashboard/Last24HoursCard';

export default function HomePage() {
  const { hub, snapshot, error, loading, theme } = useOutletContext<AppLayoutOutletContext>();

  return (
    <>
      <HeroCallout snapshot={snapshot} hub={hub} loading={loading} error={error} />

      {snapshot ? (
        <>
          <Dashboard
            prices={snapshot.today}
            hub={hub}
            day={snapshot.day}
            stale={snapshot.stale}
            isDark={theme === 'dark'}
          />
          <Last24HoursCard prices={snapshot.last24} hub={hub} />
        </>
      ) : null}
    </>
  );
}
