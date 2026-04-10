import { cn } from '@/lib/utils';

const BRAND_BLUE = '#2B7FD4';

export type GridShiftLogoProps = {
  /** Icon box size in px (viewBox is 26×26). */
  size?: number;
  /** Light = cream page background; dark = navy page background. */
  variant: 'light' | 'dark';
  className?: string;
};

/**
 * Wordmark + mark from `GridShiftLogo.jsx` — blue squircle, white “S” paths,
 * lowercase grid / shift (shift in brand blue).
 */
export function GridShiftLogo({ size = 32, variant, className }: GridShiftLogoProps) {
  const gridClass = variant === 'dark' ? 'text-white' : 'text-navy-900';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 26 26"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <rect width="26" height="26" rx="5" fill={BRAND_BLUE} />
        <path
          d="M15,5.5 L7.5,5.5 L7.5,13 L18.5,13 L18.5,20.5 L11,20.5"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11,5.5 L18.5,5.5 L18.5,13 L7.5,13 L7.5,20.5 L15,20.5"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={cn('text-[20px] font-medium tracking-tight sm:text-[22px]', gridClass)}>
        grid<span style={{ color: BRAND_BLUE }}>shift</span>
      </span>
    </div>
  );
}
