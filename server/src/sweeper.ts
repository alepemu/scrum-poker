import { DISCONNECT_GRACE_MS, ROOM_TTL_MS, SWEEP_INTERVAL_MS } from '@poker/shared';
import { isRoomExpired, pruneDisconnected } from './domain/room';
import { broadcastLobby, broadcastRoom, broadcastRoomClosed } from './socket/broadcast';
import type { PokerServer } from './socket/types';
import type { RoomStore } from './store/roomStore';

/**
 * A single periodic sweep does both jobs a planning-poker server needs a clock
 * for: freeing seats whose grace period elapsed, and collecting rooms nobody
 * came back to. One timer beats a per-participant timer to cancel and leak.
 */
export function startSweeper(io: PokerServer, store: RoomStore): () => void {
  const timer = setInterval(() => {
    void sweep(io, store);
  }, SWEEP_INTERVAL_MS);

  // Never hold the process open on account of housekeeping.
  timer.unref();

  return () => clearInterval(timer);
}

async function sweep(io: PokerServer, store: RoomStore): Promise<void> {
  const now = Date.now();
  let lobbyChanged = false;

  for (const room of store.all()) {
    const pruned = pruneDisconnected(room, now, DISCONNECT_GRACE_MS);

    if (pruned !== room) {
      store.update(room.id, () => pruned);
      await broadcastRoom(io, pruned);
      lobbyChanged = true;
    }

    if (isRoomExpired(pruned, now, ROOM_TTL_MS)) {
      store.delete(room.id);
      broadcastRoomClosed(io, room.id);
      lobbyChanged = true;
    }
  }

  if (lobbyChanged) broadcastLobby(io, store);
}
