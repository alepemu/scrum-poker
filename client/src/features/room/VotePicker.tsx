import { describeVote, formatVote, type VoteCard } from '@poker/shared';
import { cn } from '../../lib/cn';

export type VotePickerProps = {
  /** The cards this room offers, in catalogue order. */
  deck: readonly VoteCard[];
  selected: VoteCard | null;
  disabled: boolean;
  onSelect: (value: VoteCard | null) => void;
};

/** Your hand, along the bottom of the screen. Re-picking a card retracts it. */
export function VotePicker({ deck, selected, disabled, onSelect }: VotePickerProps) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-5">
      <p className="shrink-0 font-mono text-nano text-ink-muted uppercase sm:text-micro sm:tracking-[0.16em]">
        Your card
      </p>

      <div
        role="group"
        aria-label="Your estimate"
        className="grid flex-1 grid-cols-5 gap-1.5 sm:flex sm:gap-2.5"
      >
        {deck.map((value) => {
          const isSelected = selected === value;

          return (
            <button
              key={String(value)}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={describeVote(value)}
              onClick={() => onSelect(isSelected ? null : value)}
              className={cn(
                'grid h-14 cursor-pointer place-items-center rounded-panel sm:h-21 sm:flex-1',
                // Type size stays out of the selected/unselected branches: only
                // colour marks the choice, so nothing about the card resizes.
                'text-title font-extrabold tracking-[-0.03em] lg:text-display',
                'motion-safe:transition-[background-color,border-color,color,box-shadow] motion-safe:duration-150',
                'disabled:cursor-not-allowed disabled:opacity-40',
                isSelected
                  ? 'bg-accent-500 text-white shadow-lift'
                  : cn(
                      'border border-line-card bg-surface-raised text-ink-soft',
                      'enabled:hover:border-accent-450 enabled:hover:bg-accent-tint enabled:hover:text-accent-300',
                    ),
              )}
            >
              {formatVote(value)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
