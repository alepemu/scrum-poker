import { cva } from 'class-variance-authority';

/** Exported apart from Button so a link can wear the same clothes as a button. */
export const buttonClasses = cva(
  [
    'inline-flex cursor-pointer items-center justify-center gap-2 font-semibold',
    'select-none whitespace-nowrap',
    'motion-safe:transition-[background-color,border-color,color] motion-safe:duration-200',
    'disabled:pointer-events-none disabled:opacity-40',
  ],
  {
    variants: {
      variant: {
        primary: 'rounded-pill bg-accent-500 text-white shadow-pill hover:bg-accent-600',
        secondary: 'rounded-control border border-line text-ink hover:border-accent-450',
        /** The header's lozenges: a mono caps label in a hairline frame. */
        mono: 'rounded-control border border-line font-mono text-ink-dim uppercase hover:border-accent-450 hover:text-ink',
        /** No frame at all — just the glyph, brightening on hover. */
        plain: 'rounded-control text-ink-muted hover:text-ink',
      },
      size: {
        icon: 'size-8.5 shrink-0 p-0',
        chip: 'h-8.5 px-3.5 text-micro',
        sm: 'h-9 px-4 text-meta',
        md: 'h-11 px-5 text-body',
        lg: 'h-12 px-10 text-body font-extrabold',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
