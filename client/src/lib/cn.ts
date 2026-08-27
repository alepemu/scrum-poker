import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * tailwind-merge has to be told about the type scale in `styles/theme.css`.
 * It only knows Tailwind's stock sizes, so it read `text-nano` as a colour and
 * dropped it whenever a `text-ink-*` followed — every size set through `cn()`
 * alongside a colour silently fell back to the inherited 15px.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['nano', 'micro', 'meta', 'body', 'title', 'display', 'value', 'hero'] },
      ],
    },
  },
});

/** Merges conditional classes, letting a caller override a utility cleanly. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
