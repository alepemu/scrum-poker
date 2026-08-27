import { SpadeIcon } from '../../components/ui/icons';
import { useRoomList } from '../../hooks/useRoomList';
import { NameBadge } from '../identity/NameBadge';
import { CreateRoomForm } from './CreateRoomForm';
import { RoomList } from './RoomList';

export function LobbyPage() {
  const { rooms, loading, error } = useRoomList();

  return (
    <div className="relative min-h-dvh bg-surface">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 dot-grid" />

      <div className="relative mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-20">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center rounded-card-sm bg-accent-500 text-white"
            >
              <SpadeIcon size={32} />
            </span>
            <div>
              <h1 className="text-value font-black tracking-[-0.03em] text-ink">Scrum Poker</h1>
              <p className="mt-1 font-mono text-micro text-ink-muted uppercase">
                Estimate together · reveal at once
              </p>
            </div>
          </div>

          {/* Home is the only place the name is edited. */}
          <NameBadge />
        </header>

        <CreateRoomForm />

        <section className="mt-10">
          <h2 className="mb-3.5 font-mono text-micro text-ink-muted uppercase">Open rooms</h2>

          {error ? (
            <p className="mb-3 text-meta text-warn-500" role="alert">
              {error}
            </p>
          ) : null}

          <RoomList rooms={rooms} loading={loading} />
        </section>
      </div>
    </div>
  );
}
