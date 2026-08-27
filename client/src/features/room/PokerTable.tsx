import type { PublicParticipant } from '@poker/shared';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';
import { RoundCelebration } from './RoundCelebration';
import { Seat } from './Seat';
import type { Celebration } from './useRoundCelebration';
import { arrangeSeats, revealOrder } from './seatLayout';

const REVEAL_STAGGER_MS = 45;

export type PokerTableProps = {
  participants: PublicParticipant[];
  revealed: boolean;
  viewerId: string;
  onReveal: () => void;
  onReset: () => void;
  celebration?: Celebration | null;
};

export function PokerTable({
  participants,
  revealed,
  viewerId,
  onReveal,
  onReset,
  celebration,
}: PokerTableProps) {
  const layout = arrangeSeats(participants, viewerId);
  const delays = new Map(
    revealOrder(layout).map((participant, index) => [
      participant.userId,
      index * REVEAL_STAGGER_MS,
    ]),
  );
  const votesIn = participants.filter((participant) => participant.hasVoted).length;

  const renderSeat = (participant: PublicParticipant) => (
    <Seat
      key={participant.userId}
      participant={participant}
      revealed={revealed}
      isSelf={participant.userId === viewerId}
      delayMs={delays.get(participant.userId) ?? 0}
    />
  );

  // The widest row decides how much width one seat may claim; the seat-scale
  // utility turns it into a card size that always fits.
  const rowSeats = Math.max(layout.top.length, layout.bottom.length, 1);

  const status = revealed
    ? 'Round revealed'
    : participants.length === 0
      ? 'Waiting for the team'
      : votesIn === participants.length
        ? 'Everyone is in'
        : 'Cards on the table';

  return (
    <div
      className="seat-ring grid h-full w-full place-items-center"
      style={{ '--row-seats': rowSeats } as React.CSSProperties}
    >
      <div
        className={cn(
          'grid items-center justify-items-center seat-scale',
          'gap-x-[calc(var(--seat-gap)*1.4)] gap-y-(--seat-gap)',
          'grid-cols-[auto_auto_auto] grid-rows-[auto_auto_auto]',
        )}
      >
        <div className="col-start-2 row-start-1 flex gap-(--seat-gap)">
          {layout.top.map(renderSeat)}
        </div>

        <div className="col-start-1 row-start-2 flex flex-col gap-(--seat-gap)">
          {layout.left.map(renderSeat)}
        </div>

        <TableTop
          revealed={revealed}
          disabled={votesIn === 0}
          status={status}
          votesIn={votesIn}
          total={participants.length}
          onReveal={onReveal}
          onReset={onReset}
          celebration={celebration}
        />

        <div className="col-start-3 row-start-2 flex flex-col gap-(--seat-gap)">
          {layout.right.map(renderSeat)}
        </div>

        <div className="col-start-2 row-start-3 flex gap-(--seat-gap)">
          {layout.bottom.map(renderSeat)}
        </div>
      </div>
    </div>
  );
}

function TableTop({
  revealed,
  disabled,
  status,
  votesIn,
  total,
  onReveal,
  onReset,
  celebration,
}: {
  revealed: boolean;
  disabled: boolean;
  status: string;
  votesIn: number;
  total: number;
  onReveal: () => void;
  onReset: () => void;
  celebration?: Celebration | null;
}) {
  // The celebration covers the middle of the screen, so the button steps
  // aside rather than being covered by it.
  const buttonHidden = Boolean(celebration);

  return (
    <div
      className={cn(
        'relative col-start-2 row-start-2 flex flex-col items-center justify-center',
        'h-(--table-h) w-(--table-w) max-w-full rounded-pill table-felt',
        'gap-[clamp(10px,2cqh,16px)] px-4 sm:px-6',
      )}
    >
      {celebration ? <RoundCelebration celebration={celebration} /> : null}

      <p className="font-mono text-nano text-ink-muted uppercase sm:text-micro sm:tracking-[0.18em]">
        {status}
      </p>

      <div
        className={cn(
          'motion-safe:transition-opacity motion-safe:duration-200',
          buttonHidden && 'opacity-0',
        )}
      >
        {revealed ? (
          <Button size="lg" className="px-5 sm:px-10" onClick={onReset}>
            New round
          </Button>
        ) : (
          <Button size="lg" className="px-5 sm:px-10" onClick={onReveal} disabled={disabled}>
            Reveal cards
          </Button>
        )}
      </div>

      <p className="font-mono text-nano text-ink-faint uppercase sm:text-micro">
        {votesIn}/{total} voted
      </p>
    </div>
  );
}
