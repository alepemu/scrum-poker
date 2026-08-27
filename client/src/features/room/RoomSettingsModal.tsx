import { useState, type FormEvent } from 'react';
import {
  CARD_CATALOGUE,
  MAX_ROOM_NAME_LENGTH,
  MIN_DECK_SIZE,
  describeVote,
  formatVote,
  sortDeck,
  type RoomSettings,
  type VoteCard,
} from '@poker/shared';
import { Button } from '../../components/ui/Button';
import { CheckIcon } from '../../components/ui/icons';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import { cn } from '../../lib/cn';

export type RoomSettingsModalProps = {
  name: string;
  settings: RoomSettings;
  /** True once anyone holds a card: the deck is frozen until the round resets. */
  deckLocked: boolean;
  onClose: () => void;
  onSave: (name: string, settings: RoomSettings) => void;
};

/** Name, deck and celebrations, edited as a draft and saved in one go. */
export function RoomSettingsModal({
  name,
  settings,
  deckLocked,
  onClose,
  onSave,
}: RoomSettingsModalProps) {
  const [draftName, setDraftName] = useState(name);
  const [draft, setDraft] = useState<RoomSettings>(settings);

  const tooFewCards = draft.deck.length < MIN_DECK_SIZE;

  const toggleCard = (card: VoteCard) => {
    setDraft((current) => ({
      ...current,
      deck: current.deck.includes(card)
        ? current.deck.filter((each) => each !== card)
        : sortDeck([...current.deck, card]),
    }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = draftName.trim();
    // The server rejects these anyway; keeping the dialog open is kinder.
    if (!trimmed || tooFewCards) return;

    onSave(trimmed, draft);
    onClose();
  };

  return (
    <Modal title="Room settings" size="md" onClose={onClose}>
      <form onSubmit={submit}>
        <TextField
          label="Room name"
          value={draftName}
          maxLength={MAX_ROOM_NAME_LENGTH}
          onChange={(event) => setDraftName(event.target.value)}
        />

        <fieldset className="mt-5" disabled={deckLocked}>
          {/* Matches the TextField label exactly: a legend is neither block nor
              free of the browser's own inline padding. */}
          <legend className="mb-2 block p-0 font-mono text-nano tracking-[0.06em] text-ink-muted uppercase">
            Cards
          </legend>

          <div className="flex flex-wrap gap-1.5">
            {CARD_CATALOGUE.map((card) => {
              const on = draft.deck.includes(card);

              return (
                <button
                  key={String(card)}
                  type="button"
                  aria-pressed={on}
                  aria-label={describeVote(card)}
                  onClick={() => toggleCard(card)}
                  className={cn(
                    'h-9 min-w-11 cursor-pointer rounded-control border px-2 text-meta font-semibold',
                    'motion-safe:transition-colors motion-safe:duration-150',
                    'disabled:cursor-not-allowed disabled:opacity-40',
                    on
                      ? 'border-accent-500 bg-accent-500 text-white'
                      : 'border-line text-ink-muted enabled:hover:border-accent-450 enabled:hover:text-ink',
                  )}
                >
                  {formatVote(card)}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-meta text-ink-muted">
            {deckLocked
              ? 'The round has started — reset it to change the deck.'
              : tooFewCards
                ? `Pick at least ${MIN_DECK_SIZE} cards.`
                : 'Everyone at the table votes with these.'}
          </p>
        </fieldset>

        <label
          className={cn(
            'mt-5 flex cursor-pointer items-start gap-3 rounded-control border border-line',
            'bg-surface-raised p-3.5 hover:border-accent-450',
            'motion-safe:transition-colors motion-safe:duration-200',
          )}
        >
          {/* The native control cannot take the field styling, so it is hidden
              and the box beside it is drawn from the same tokens. */}
          <input
            type="checkbox"
            checked={!draft.animations}
            onChange={(event) =>
              setDraft((current) => ({ ...current, animations: !event.target.checked }))
            }
            className="peer sr-only"
          />

          <span
            className={cn(
              'grid size-5 shrink-0 place-items-center rounded-check border border-line',
              'bg-surface-sunken text-transparent',
              'peer-checked:border-accent-500 peer-checked:bg-accent-500 peer-checked:text-white',
              'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
              'peer-focus-visible:outline-accent-400',
              'motion-safe:transition-colors motion-safe:duration-150',
            )}
          >
            <CheckIcon size={13} />
          </span>

          <span className="min-w-0">
            <span className="block text-body text-ink">Disable celebrations</span>
            <span className="mt-0.5 block text-meta text-ink-muted">
              No animation when the table agrees or splits.
            </span>
          </span>
        </label>

        <div className="mt-7 flex gap-2.5">
          <Button type="submit" disabled={tooFewCards} className="flex-1">
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
