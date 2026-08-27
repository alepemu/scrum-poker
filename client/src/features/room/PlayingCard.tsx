import { cva } from 'class-variance-authority';
import type { CSSProperties } from 'react';
import { describeVote, formatVote, isSpecialCard, type VoteCard } from '@poker/shared';
import { cn } from '../../lib/cn';

/**
 * Sizes come from --card-w / --card-h, which the ring clamps to whatever fits.
 * Nothing here is a fixed pixel value, so the table never overflows.
 */
const face = cva('card-face absolute inset-0 grid place-items-center rounded-card', {
  variants: {
    tone: {
      /** Not voted yet: an empty outline with a slow pulse. */
      idle: 'border-[1.5px] border-dashed border-line-dashed',
      /** Not voted, and offline. */
      away: 'border-[1.5px] border-dashed border-line-dashed opacity-60',
      /** Voted, still face down: the weave, so the table reads at a glance. */
      voted: 'card-back shadow-card',
      /** Turned over. */
      value: 'bg-card-face text-surface shadow-card',
      /** Turned over, but this person never voted. */
      abstain: 'border-[1.5px] border-dashed border-line-dashed text-ink-ghost',
    },
  },
  defaultVariants: { tone: 'idle' },
});

export type PlayingCardProps = {
  value: VoteCard | null;
  hasVoted: boolean;
  revealed: boolean;
  /** Stagger, so a reveal rolls around the table instead of snapping. */
  delayMs?: number;
  away?: boolean;
  className?: string;
};

export function PlayingCard({
  value,
  hasVoted,
  revealed,
  delayMs = 0,
  away = false,
  className,
}: PlayingCardProps) {
  const faceDown = hasVoted ? 'voted' : away ? 'away' : 'idle';
  const waiting = !hasVoted && !revealed;

  const label = value === null ? '–' : formatVote(value);
  /*
   * How much of the card's height the numeral takes. A glyph carries no digits
   * to size against, and "0,25" is nearly twice the width of "13", so both step
   * down or they run into the card edge once the ring clamps the card.
   */
  const valueScale =
    value !== null && isSpecialCard(value) ? 0.24 : label.length >= 4 ? 0.18 : 0.28;

  return (
    <div
      className={cn('relative h-(--card-h) w-(--card-w) shrink-0 card-scene', className)}
      aria-label={
        revealed ? `Card: ${value === null ? 'no vote' : describeVote(value)}` : undefined
      }
    >
      <div
        className={cn(
          'relative h-full w-full card-3d',
          'ease-flip motion-safe:transition-transform motion-safe:duration-[550ms]',
          revealed && 'card-flipped',
        )}
        style={{ transitionDelay: `${delayMs}ms` }}
      >
        <div className={face({ tone: faceDown })}>
          {waiting ? (
            <span
              aria-hidden="true"
              className="text-display leading-none text-ink-ghost motion-safe:animate-pulse-dot"
            >
              ·
            </span>
          ) : null}
        </div>

        <div className={cn(face({ tone: value === null ? 'abstain' : 'value' }), 'card-face-back')}>
          <span
            className="card-value font-extrabold"
            style={{ '--value-scale': valueScale } as CSSProperties}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
