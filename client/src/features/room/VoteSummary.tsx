import { formatNumber, formatVote, summarizeVotes, type PublicParticipant } from '@poker/shared';
import { cn } from '../../lib/cn';

export type VoteSummaryProps = {
  participants: PublicParticipant[];
};

/** What the round came to, in the same strip the hand occupied. */
export function VoteSummary({ participants }: VoteSummaryProps) {
  const summary = summarizeVotes(participants);
  const highest = Math.max(...summary.tallies.map((tally) => tally.count), 0);

  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-5"
    >
      <p className="shrink-0 font-mono text-nano text-ink-muted uppercase sm:text-micro sm:tracking-[0.16em]">
        Result
      </p>

      <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-7">
        <div className="flex shrink-0 flex-col gap-0.5">
          <span className="font-mono text-nano text-ink-muted uppercase">Average</span>
          <span className="text-value font-black text-accent-400 sm:text-hero">
            {summary.average === null ? '—' : formatNumber(summary.average)}
          </span>
        </div>

        <div className="h-11 w-px shrink-0 bg-line-hair sm:h-14" />

        {summary.tallies.length > 0 ? (
          <ul className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto sm:gap-2.5">
            {summary.tallies.map((tally) => (
              <li
                key={tally.value}
                className={cn(
                  'flex h-14 min-w-11.5 shrink-0 flex-col items-center justify-center gap-0.5 rounded-panel border',
                  'sm:h-21 sm:min-w-18',
                  tally.count === highest && summary.tallies.length > 1
                    ? 'border-accent-rim bg-accent-tint'
                    : 'border-line bg-surface-raised',
                )}
              >
                <span className="text-title font-extrabold tracking-[-0.03em] sm:text-display">
                  {formatVote(tally.value)}
                </span>
                <span className="font-mono text-nano text-ink-muted sm:text-micro sm:tracking-normal">
                  ×{tally.count}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="font-mono text-nano text-ink-faint uppercase sm:text-micro">
            Nobody voted
          </span>
        )}

        {summary.abstainCount > 0 ? (
          <span className="ml-auto hidden shrink-0 font-mono text-micro text-ink-faint uppercase sm:block">
            {summary.abstainCount} didn&apos;t vote
          </span>
        ) : null}
      </div>
    </section>
  );
}
