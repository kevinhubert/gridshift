import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GridShiftLogo } from '@/components/brand/GridShiftLogo';

export type GridShiftHeaderProps = {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
};

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Savings', path: '/savings' },
  { label: 'About', path: '/about' },
] as const;

function isNavActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/') return pathname === '/';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function GridShiftHeader({ theme, onThemeToggle }: GridShiftHeaderProps) {
  const location = useLocation();

  const navLinks = (className?: string) =>
    NAV_ITEMS.map((item) => (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          'text-sm transition-colors',
          isNavActive(location.pathname, item.path)
            ? 'font-medium text-foreground'
            : 'text-muted-foreground hover:text-foreground',
          className
        )}
      >
        {item.label}
      </Link>
    ));

  return (
    <header className="border-b border-border">
      <div
        className={cn(
          'relative mx-auto flex w-full max-w-6xl flex-wrap items-center gap-y-3 px-6 py-3 sm:px-8',
          'md:h-16 md:gap-y-0 md:py-0'
        )}
      >
        <Link to="/" className="z-10 inline-flex shrink-0 items-center" aria-label="GridShift home">
          <GridShiftLogo variant={theme === 'dark' ? 'dark' : 'light'} size={36} />
        </Link>

        <nav className="order-3 flex w-full justify-center gap-8 md:order-none md:absolute md:top-1/2 md:left-1/2 md:w-auto md:-translate-x-1/2 md:-translate-y-1/2">
          {navLinks()}
        </nav>

        <div className="z-10 ml-auto flex flex-wrap items-center justify-end gap-3 sm:gap-4">
          {location.pathname !== '/' && (
            <Link
              to="/"
              className="rounded-full border border-blue-500/35 px-4 py-2 text-[13px] font-medium text-blue-600 transition-colors hover:border-blue-500/70 hover:text-blue-700 dark:border-blue-400/40 dark:text-blue-400 dark:hover:border-blue-400/70 dark:hover:text-blue-300"
            >
              Open dashboard
            </Link>
          )}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 border-border bg-transparent shadow-none"
            onClick={onThemeToggle}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
