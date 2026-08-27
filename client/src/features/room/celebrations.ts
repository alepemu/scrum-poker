import type { RoundOutcome } from '@poker/shared';

/**
 * Assets are collected from the folder at build time, so adding a celebration
 * is dropping a file into `assets/celebrations/<outcome>/` — there is no import
 * list to keep in sync. An empty folder is a valid state: the overlay falls
 * back to a CSS burst when a set has nothing in it.
 */
const SETS: Record<RoundOutcome, string[]> = {
  consensus: Object.values(
    import.meta.glob<string>('../../assets/celebrations/consensus/*.{gif,webp,png,apng}', {
      eager: true,
      import: 'default',
    }),
  ),
  scattered: Object.values(
    import.meta.glob<string>('../../assets/celebrations/scattered/*.{gif,webp,png,apng}', {
      eager: true,
      import: 'default',
    }),
  ),
};

/**
 * A random file from the set, avoiding an immediate repeat so the same face
 * does not show up twice running. Returns null when the folder is empty.
 */
export function pickCelebration(outcome: RoundOutcome, previous?: string | null): string | null {
  const all = SETS[outcome];
  if (all.length === 0) return null;

  const choices = all.length > 1 && previous ? all.filter((file) => file !== previous) : all;
  return choices[Math.floor(Math.random() * choices.length)] ?? null;
}
