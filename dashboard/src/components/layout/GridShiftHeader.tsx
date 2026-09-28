import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GridShiftLogo } from '@/components/brand/GridShiftLogo';

export type GridShiftHeaderProps = {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
};

export function GridShiftHeader({ theme, onThemeToggle }: GridShiftHeaderProps) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-6 sm:px-8">
        <Link to="/" className="inline-flex shrink-0 items-center" aria-label="grid shift home">
          <GridShiftLogo variant={theme === 'dark' ? 'dark' : 'light'} size={36} />
        </Link>

        <div className="ml-auto flex items-center">
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
