import { useState } from 'react';
import { Link } from 'react-router';
import type { RoomSettings, RoomState, VoteCard } from '@poker/shared';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { SettingsIcon, SpadeIcon } from '../../components/ui/icons';
import { PokerTable } from './PokerTable';
import { RoomSettingsModal } from './RoomSettingsModal';
import { VotePicker } from './VotePicker';
import { VoteSummary } from './VoteSummary';
import type { Celebration } from './useRoundCelebration';
import { useVoteShortcuts } from './useVoteShortcuts';

export type RoomViewProps = {
  state: RoomState;
  viewerId: string;
  celebration: Celebration | null;
  onVote: (value: VoteCard | null) => void;
  onReveal: () => void;
  onReset: () => void;
  onUpdateRoom: (name: string, settings: RoomSettings) => void;
};

/**
 * The room, as pixels. Purely presentational — it takes state and callbacks
 * and knows nothing about sockets, so the live room and the preview room can
 * render the same component and cannot drift apart.
 *
 * The shell is locked to the viewport: header and footer keep their height and
 * the table takes whatever is left, so the page never scrolls.
 */
export function RoomView({
  state,
  viewerId,
  celebration,
  onVote,
  onReveal,
  onReset,
  onUpdateRoom,
}: RoomViewProps) {
  const me = state.participants.find((participant) => participant.userId === viewerId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const people = state.participants.length;
  // hasVoted is public before a reveal, so this leaks no values.
  const deckLocked = state.participants.some((participant) => participant.hasVoted);

  // The only place that can see the deck, the current card, the round and the
  // dialog at once, so the shortcut is wired here rather than higher up.
  useVoteShortcuts({
    deck: state.settings.deck,
    selected: me?.vote ?? null,
    active: !state.revealed && !settingsOpen,
    onSelect: onVote,
  });

  return (
    <div className="relative grid h-dvh grid-rows-[auto_1fr_auto] overflow-hidden bg-surface room-shell">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 dot-grid" />

      <header className="relative flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3 sm:h-19 sm:px-8 sm:py-0">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4.5">
          {/* The mark doubles as the way home — the design carries no back button. */}
          <Link
            to="/"
            aria-label="Home"
            title="Home"
            className="grid size-8 shrink-0 place-items-center rounded-card-sm bg-accent-500 text-white sm:size-9"
          >
            <SpadeIcon size={22} />
          </Link>

          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-body font-extrabold tracking-[-0.02em] text-ink sm:text-title">
              {state.name}
            </h1>
            <p className="truncate font-mono text-nano text-ink-muted uppercase sm:text-micro sm:tracking-[0.08em]">
              {people} {people === 1 ? 'player' : 'players'} · #{state.id}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <CopyButton value={window.location.href} label="Copy link" />

          <Button
            variant="mono"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            aria-label="Room settings"
            title="Room settings"
          >
            <SettingsIcon />
          </Button>
        </div>
      </header>

      <main className="relative min-h-0 px-3 py-3 sm:px-8 sm:py-5">
        <PokerTable
          participants={state.participants}
          revealed={state.revealed}
          viewerId={viewerId}
          onReveal={onReveal}
          onReset={onReset}
          celebration={celebration}
        />
      </main>

      <footer className="relative border-t border-line-soft bg-surface-sunken px-4 pt-3.5 pb-5 sm:px-8 sm:pt-5.5 sm:pb-6.5">
        {state.revealed ? (
          <VoteSummary participants={state.participants} />
        ) : (
          <VotePicker
            deck={state.settings.deck}
            selected={me?.vote ?? null}
            disabled={state.revealed}
            onSelect={onVote}
          />
        )}
      </footer>

      {settingsOpen ? (
        <RoomSettingsModal
          name={state.name}
          settings={state.settings}
          deckLocked={deckLocked}
          onClose={() => setSettingsOpen(false)}
          onSave={onUpdateRoom}
        />
      ) : null}
    </div>
  );
}
