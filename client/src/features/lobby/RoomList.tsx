import { Link } from 'react-router';
import type { RoomSummary } from '@poker/shared';

export type RoomListProps = {
  rooms: RoomSummary[];
  loading: boolean;
};

function describe(room: RoomSummary): string {
  const people =
    room.participantCount === 0
      ? 'Empty'
      : `${room.participantCount} ${room.participantCount === 1 ? 'user' : 'users'}`;

  return room.revealed ? `${people} · cards up` : people;
}

export function RoomList({ rooms, loading }: RoomListProps) {
  if (loading) {
    return (
      <p className="py-10 text-center font-mono text-micro text-ink-muted uppercase">
        Loading rooms…
      </p>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-panel border border-dashed border-line-dashed px-5 py-10 text-center">
          <p className="font-semibold text-ink">No rooms open yet</p>
          <p className="mt-1 text-meta text-ink-muted">Create one above and share the link.</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {rooms.map((room) => (
        <li key={room.id}>
          <Link
            to={`/room/${room.id}`}
            className="group flex items-center justify-between gap-4 rounded-panel border border-line bg-surface-raised px-5 py-4.5 hover:border-accent-450 hover:bg-accent-tint motion-safe:transition-colors motion-safe:duration-200"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{room.name}</p>
              <p className="mt-0.5 font-mono text-nano text-ink-muted uppercase">
                {describe(room)}
              </p>
            </div>

            <span className="shrink-0 font-mono text-nano text-accent-400 uppercase opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
              Join →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
