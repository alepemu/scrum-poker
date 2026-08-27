import type { Ack, RoomSettings, RoomState, RoomSummary, VoteCard } from '@poker/shared';
import { socket } from './socket';

/**
 * One function per server call, each returning the acknowledgement as a promise.
 * Components never touch `socket.emit` directly, so the wire protocol has a
 * single point of contact with the UI.
 */

const NO_CONNECTION = 'No connection to the server.';

function request<T>(emit: (resolve: (res: Ack<T>) => void) => void): Promise<Ack<T>> {
  return new Promise((resolve) => {
    if (!socket.connected) {
      resolve({ ok: false, error: NO_CONNECTION });
      return;
    }
    emit(resolve);
  });
}

export function subscribeToRooms(): Promise<Ack<RoomSummary[]>> {
  return request<RoomSummary[]>((resolve) => socket.emit('rooms:subscribe', resolve));
}

export function unsubscribeFromRooms(): void {
  socket.emit('rooms:unsubscribe');
}

export function createRoom(name: string): Promise<Ack<RoomSummary>> {
  return request<RoomSummary>((resolve) => socket.emit('rooms:create', { name }, resolve));
}

export function joinRoom(payload: {
  roomId: string;
  userId: string;
  name: string;
}): Promise<Ack<RoomState>> {
  return request<RoomState>((resolve) => socket.emit('room:join', payload, resolve));
}

export function leaveRoom(roomId: string): void {
  socket.emit('room:leave', { roomId });
}

export function castVote(roomId: string, value: VoteCard | null): Promise<Ack<null>> {
  return request<null>((resolve) => socket.emit('vote:cast', { roomId, value }, resolve));
}

export function revealCards(roomId: string): Promise<Ack<null>> {
  return request<null>((resolve) => socket.emit('cards:reveal', { roomId }, resolve));
}

export function resetCards(roomId: string): Promise<Ack<null>> {
  return request<null>((resolve) => socket.emit('cards:reset', { roomId }, resolve));
}

export function renameUser(name: string): Promise<Ack<null>> {
  return request<null>((resolve) => socket.emit('user:rename', { name }, resolve));
}

export function updateRoom(
  roomId: string,
  name: string,
  settings: RoomSettings,
): Promise<Ack<null>> {
  return request<null>((resolve) =>
    socket.emit('room:update', { roomId, name, settings }, resolve),
  );
}
