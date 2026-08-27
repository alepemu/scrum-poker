import { projectRoomFor } from '../domain/projection';
import type { Room } from '../domain/types';
import type { RoomStore } from '../store/roomStore';
import { LOBBY_CHANNEL, type PokerServer } from './types';

/**
 * Room state is projected per viewer — everyone sees the same table, but you
 * also see your own vote before the reveal. Rooms hold a handful of people, so
 * emitting individually costs nothing and keeps the reveal gate exact.
 */
export async function broadcastRoom(io: PokerServer, room: Room): Promise<void> {
  const sockets = await io.in(room.id).fetchSockets();
  for (const socket of sockets) {
    socket.emit('room:state', projectRoomFor(room, socket.data.userId));
  }
}

export function broadcastLobby(io: PokerServer, store: RoomStore): void {
  io.to(LOBBY_CHANNEL).emit('rooms:updated', store.list());
}

export function broadcastRoomClosed(io: PokerServer, roomId: string): void {
  io.to(roomId).emit('room:closed', { roomId });
}
