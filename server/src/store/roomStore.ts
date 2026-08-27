import { randomBytes } from 'node:crypto';
import type { RoomSummary } from '@poker/shared';
import { summarizeRoom } from '../domain/projection';
import { createRoom } from '../domain/room';
import type { Room } from '../domain/types';

/**
 * The only module that knows rooms live in a Map. Swapping in Redis to run
 * more than one instance touches this file and nothing else.
 */
export type RoomStore = {
  create(name: string, now?: number): Room;
  get(roomId: string): Room | undefined;
  /** Applies a pure domain function and persists the result. */
  update(roomId: string, mutate: (room: Room) => Room): Room | undefined;
  delete(roomId: string): void;
  all(): Room[];
  list(): RoomSummary[];
};

// Ambiguous characters (0/o, 1/l) are left out so room ids survive being read aloud.
const ID_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';
const ID_LENGTH = 8;

function generateRoomId(): string {
  const bytes = randomBytes(ID_LENGTH);
  let id = '';
  for (const byte of bytes) {
    id += ID_ALPHABET[byte % ID_ALPHABET.length];
  }
  return id;
}

export function createRoomStore(): RoomStore {
  const rooms = new Map<string, Room>();

  return {
    create(name, now = Date.now()) {
      let id = generateRoomId();
      while (rooms.has(id)) id = generateRoomId();

      const room = createRoom({ id, name, now });
      rooms.set(id, room);
      return room;
    },

    get(roomId) {
      return rooms.get(roomId);
    },

    update(roomId, mutate) {
      const room = rooms.get(roomId);
      if (!room) return undefined;

      const updated = mutate(room);
      rooms.set(roomId, updated);
      return updated;
    },

    delete(roomId) {
      rooms.delete(roomId);
    },

    all() {
      return [...rooms.values()];
    },

    list() {
      return [...rooms.values()]
        .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
        .map(summarizeRoom);
    },
  };
}
