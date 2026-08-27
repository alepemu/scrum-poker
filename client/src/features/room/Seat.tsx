import type { PublicParticipant } from '@poker/shared';
import { cn } from '../../lib/cn';
import { PlayingCard } from './PlayingCard';

export type SeatProps = {
  participant: PublicParticipant;
  revealed: boolean;
  isSelf: boolean;
  delayMs?: number;
  className?: string;
};

/** One place at the table: a card with a name under it. */
export function Seat({ participant, revealed, isSelf, delayMs, className }: SeatProps) {
  const away = !participant.connected;

  return (
    <div
      className={cn('flex w-(--card-w) flex-col items-center gap-2.5', className)}
      data-testid="seat"
    >
      <PlayingCard
        value={participant.vote}
        hasVoted={participant.hasVoted}
        revealed={revealed}
        delayMs={delayMs}
        away={away}
        className={cn(away && 'opacity-45')}
      />

      <span
        className={cn(
          'flex max-w-full items-baseline gap-1.5 text-meta font-semibold',
          away ? 'text-ink-muted' : 'text-ink-soft',
        )}
        title={participant.name}
      >
        <span className="truncate">{participant.name}</span>
        {isSelf ? (
          <span className="shrink-0 font-mono text-nano text-accent-400 uppercase">You</span>
        ) : null}
      </span>
    </div>
  );
}
