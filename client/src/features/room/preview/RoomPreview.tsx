import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  CELEBRATION_MS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
  type RoundOutcome,
} from '@poker/shared';
import { ChevronDownIcon } from '../../../components/ui/icons';
import { cn } from '../../../lib/cn';
import { pickCelebration } from '../celebrations';
import { RoomView } from '../RoomView';
import type { Celebration } from '../useRoundCelebration';
import { buildPreviewRoom, PREVIEW_VIEWER_ID, type PreviewOptions } from './previewRoom';

/**
 * A mannequin table at `/preview`. Renders the same `RoomView` a live room
 * does, so the layout can be seen at any headcount without a server room, a
 * second browser, or anyone else voting.
 */

const SEAT_COUNTS = [2, 4, 6, 8, 12];

export function RoomPreview() {
  const [seats, setSeats] = useState(8);
  const [revealed, setRevealed] = useState(true);
  const [spread, setSpread] = useState<PreviewOptions['spread']>('mixed');
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);
  const [name, setName] = useState('Preview Room');
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const panelId = useId();

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const state = useMemo(
    () => ({ ...buildPreviewRoom({ seats, revealed, spread, settings }), name }),
    [seats, revealed, spread, settings, name],
  );

  const play = (outcome: RoundOutcome) => {
    setRevealed(true);
    setSpread(outcome === 'consensus' ? 'consensus' : 'scattered');
    clearTimers();

    // This bypasses useRoundCelebration, so the room's own switch is checked here.
    setCelebration(null);
    if (!settings.animations) return;

    // Remount so the animation restarts even if one is already on screen.
    timers.current.push(
      setTimeout(() => setCelebration({ outcome, source: pickCelebration(outcome) }), 30),
      setTimeout(() => setCelebration(null), CELEBRATION_MS + 30),
    );
  };

  return (
    <>
      <RoomView
        state={state}
        viewerId={PREVIEW_VIEWER_ID}
        celebration={celebration}
        onVote={() => {}}
        onReveal={() => setRevealed(true)}
        onReset={() => {
          setRevealed(false);
          setCelebration(null);
          clearTimers();
        }}
        onUpdateRoom={(nextName, nextSettings) => {
          setName(nextName);
          setSettings(nextSettings);
        }}
      />

      <aside className="fixed top-1/2 left-3 z-50 w-48 -translate-y-1/2 rounded-panel border border-line bg-surface-deep/95 p-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-expanded={!collapsed}
          aria-controls={panelId}
          className="flex w-full cursor-pointer items-center justify-between gap-2 text-left text-meta font-semibold text-ink"
        >
          Example room
          <ChevronDownIcon
            size={14}
            className={cn(
              'shrink-0 text-ink-muted motion-safe:transition-transform motion-safe:duration-200',
              !collapsed && 'rotate-180',
            )}
          />
        </button>

        {collapsed ? null : (
          <div id={panelId} className="mt-0.5">
            <p className="mb-3 text-meta text-ink-muted">
              Nobody else is here — nothing you do is shared.
            </p>

            <Group label="Seats">
              {SEAT_COUNTS.map((count) => (
                <Chip key={count} active={seats === count} onClick={() => setSeats(count)}>
                  {count}
                </Chip>
              ))}
            </Group>

            <Group label="Cards">
              <Chip active={!revealed} onClick={() => setRevealed(false)}>
                Face down
              </Chip>
              <Chip active={revealed} onClick={() => setRevealed(true)}>
                Revealed
              </Chip>
            </Group>

            <Group label="Play">
              <Chip onClick={() => play('consensus')}>Consensus</Chip>
              <Chip onClick={() => play('scattered')}>Chaos</Chip>
            </Group>
          </div>
        )}
      </aside>
    </>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <p className="mb-1 font-mono text-nano tracking-[0.06em] text-ink-muted uppercase">{label}</p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-control border px-2.5 py-1 text-meta',
        active
          ? 'border-accent-500 bg-accent-500 text-white'
          : 'border-line text-ink-muted hover:border-accent-450 hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
