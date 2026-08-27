import type { CSSProperties } from 'react';
import { CELEBRATION_MS, type RoundOutcome } from '@poker/shared';
import { cn } from '../../lib/cn';
import type { Celebration } from './useRoundCelebration';

const LABEL: Record<RoundOutcome, string> = {
  consensus: 'Everyone agreed',
  scattered: 'Nobody agreed',
};

/**
 * Plays across the table, centred on the felt and exactly its height, so
 * every file lands in the same place at the same size whatever its shape.
 *
 * Sizes come from --table-h rather than percentages: the wrapper's single grid
 * row was content-sized, so a percentage height resolved against an indefinite
 * track, fell back to auto, and let tall pictures hang out of the felt.
 */
export function RoundCelebration({ celebration }: { celebration: Celebration }) {
  return (
    <div
      role="status"
      aria-label={LABEL[celebration.outcome]}
      className="pointer-events-none absolute -inset-px z-40 grid place-items-center"
    >
      <div
        // The duration has to land on the animated element itself.
        style={{ animationDuration: `${CELEBRATION_MS}ms` }}
        className="flex h-(--table-h) w-(--table-w) max-w-full items-center justify-center celebrate-play"
      >
        {celebration.source ? (
          <img
            src={celebration.source}
            alt=""
            className="h-(--table-h) max-w-full rounded-panel object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.75)]"
          />
        ) : (
          <Burst outcome={celebration.outcome} />
        )}
      </div>
    </div>
  );
}

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/** The CSS-only stand-in for an empty celebration folder. */
function Burst({ outcome }: { outcome: RoundOutcome }) {
  return (
    <div className="relative aspect-square h-(--table-h)">
      {BURST_ANGLES.map((angle) => (
        <span
          key={angle}
          style={{ '--burst-angle': `${angle}deg` } as CSSProperties}
          className={cn(
            'absolute top-1/2 left-1/2 size-2.5 animate-burst rounded-full',
            outcome === 'consensus' ? 'bg-accent-400' : 'bg-warn-500',
          )}
        />
      ))}
    </div>
  );
}
