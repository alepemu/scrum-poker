import type { Ack } from '@poker/shared';
import { projectRoomFor, summarizeRoom } from '../domain/projection';
import {
  canVote,
  castVote,
  hasAnyVote,
  offersCard,
  sameDeck,
  disconnectParticipant,
  joinRoom,
  leaveRoom,
  renameParticipant,
  resetCards,
  revealCards,
  updateRoom,
} from '../domain/room';
import type { RoomStore } from '../store/roomStore';
import { broadcastLobby, broadcastRoom } from './broadcast';
import { LOBBY_CHANNEL, type PokerServer, type PokerSocket } from './types';
import {
  validateRoomId,
  validateRoomName,
  validateRoomSettings,
  validateUserId,
  validateUserName,
  validateVote,
} from './validate';

/**
 * The socket layer is a thin translation of events into domain calls:
 * validate → apply a pure function → persist → broadcast. No rules live here.
 */

const ok = <T>(data: T): Ack<T> => ({ ok: true, data });
const fail = (error: string): Ack<never> => ({ ok: false, error });

const ROOM_NOT_FOUND = 'That room no longer exists.';

export function registerHandlers(io: PokerServer, store: RoomStore): void {
  io.on('connection', (socket) => {
    socket.data.userId = null;
    socket.data.name = '';
    socket.data.roomIds = new Set();

    registerLobbyHandlers(io, socket, store);
    registerRoomHandlers(io, socket, store);
    registerRoundHandlers(io, socket, store);

    socket.on('disconnect', () => {
      void handleDisconnect(io, socket, store);
    });
  });
}

function registerLobbyHandlers(io: PokerServer, socket: PokerSocket, store: RoomStore): void {
  socket.on('rooms:subscribe', (ack) => {
    void socket.join(LOBBY_CHANNEL);
    ack(ok(store.list()));
  });

  socket.on('rooms:unsubscribe', () => {
    void socket.leave(LOBBY_CHANNEL);
  });

  socket.on('rooms:create', (payload, ack) => {
    const name = validateRoomName(payload?.name);
    if (!name.ok) return ack(fail(name.error));

    const room = store.create(name.value);
    broadcastLobby(io, store);
    ack(ok(summarizeRoom(room)));
  });
}

function registerRoomHandlers(io: PokerServer, socket: PokerSocket, store: RoomStore): void {
  socket.on('room:join', (payload, ack) => {
    const roomId = validateRoomId(payload?.roomId);
    if (!roomId.ok) return ack(fail(roomId.error));

    const userId = validateUserId(payload?.userId);
    if (!userId.ok) return ack(fail(userId.error));

    const name = validateUserName(payload?.name);
    if (!name.ok) return ack(fail(name.error));

    if (!store.get(roomId.value)) return ack(fail(ROOM_NOT_FOUND));

    socket.data.userId = userId.value;
    socket.data.name = name.value;
    socket.data.roomIds.add(roomId.value);
    void socket.join(roomId.value);

    const room = store.update(roomId.value, (current) =>
      joinRoom(current, { userId: userId.value, name: name.value, now: Date.now() }),
    );
    if (!room) return ack(fail(ROOM_NOT_FOUND));

    ack(ok(projectRoomFor(room, userId.value)));
    void broadcastRoom(io, room);
    broadcastLobby(io, store);
  });

  socket.on('room:leave', (payload) => {
    const roomId = validateRoomId(payload?.roomId);
    const userId = socket.data.userId;
    if (!roomId.ok || !userId) return;

    socket.data.roomIds.delete(roomId.value);
    void socket.leave(roomId.value);

    const room = store.update(roomId.value, (current) => leaveRoom(current, userId, Date.now()));
    if (!room) return;

    void broadcastRoom(io, room);
    broadcastLobby(io, store);
  });

  socket.on('room:update', (payload, ack) => {
    const roomId = validateRoomId(payload?.roomId);
    if (!roomId.ok) return ack(fail(roomId.error));

    const name = validateRoomName(payload?.name);
    if (!name.ok) return ack(fail(name.error));

    const settings = validateRoomSettings(payload?.settings);
    if (!settings.ok) return ack(fail(settings.error));

    // The deck is frozen for the round: changing it under someone who has
    // already played would silently invalidate their card.
    const current = store.get(roomId.value);
    if (!current) return ack(fail(ROOM_NOT_FOUND));
    if (!sameDeck(current.settings.deck, settings.value.deck) && hasAnyVote(current)) {
      return ack(fail('Cards are already out — reset the round to change the deck.'));
    }

    const room = store.update(roomId.value, (state) =>
      updateRoom(state, { name: name.value, settings: settings.value, now: Date.now() }),
    );
    if (!room) return ack(fail(ROOM_NOT_FOUND));

    ack(ok(null));
    void broadcastRoom(io, room);
    // The lobby list carries the room name, so a rename has to reach it too.
    broadcastLobby(io, store);
  });

  socket.on('user:rename', (payload, ack) => {
    const name = validateUserName(payload?.name);
    if (!name.ok) return ack(fail(name.error));

    socket.data.name = name.value;
    const userId = socket.data.userId;
    if (!userId) return ack(ok(null));

    // A rename follows the person into every room they are sitting in.
    for (const roomId of socket.data.roomIds) {
      const room = store.update(roomId, (current) =>
        renameParticipant(current, userId, name.value, Date.now()),
      );
      if (room) void broadcastRoom(io, room);
    }

    ack(ok(null));
  });
}

function registerRoundHandlers(io: PokerServer, socket: PokerSocket, store: RoomStore): void {
  socket.on('vote:cast', (payload, ack) => {
    const roomId = validateRoomId(payload?.roomId);
    if (!roomId.ok) return ack(fail(roomId.error));

    const value = validateVote(payload?.value);
    if (!value.ok) return ack(fail(value.error));

    const userId = socket.data.userId;
    if (!userId) return ack(fail('Join the room before voting.'));

    const current = store.get(roomId.value);
    if (!current) return ack(fail(ROOM_NOT_FOUND));
    if (!canVote(current)) return ack(fail('Cards are already on the table — reset first.'));
    if (!offersCard(current, value.value)) return ack(fail('That card is not in this room.'));

    const room = store.update(roomId.value, (state) =>
      castVote(state, { userId, value: value.value, now: Date.now() }),
    );
    if (!room) return ack(fail(ROOM_NOT_FOUND));

    ack(ok(null));
    void broadcastRoom(io, room);
  });

  socket.on('cards:reveal', (payload, ack) => {
    applyRound(io, store, payload?.roomId, ack, (room) => revealCards(room, Date.now()));
  });

  socket.on('cards:reset', (payload, ack) => {
    applyRound(io, store, payload?.roomId, ack, (room) => resetCards(room, Date.now()));
  });
}

/** Reveal and reset differ only in the domain call, so they share this path. */
function applyRound(
  io: PokerServer,
  store: RoomStore,
  rawRoomId: unknown,
  ack: (res: Ack<null>) => void,
  mutate: Parameters<RoomStore['update']>[1],
): void {
  const roomId = validateRoomId(rawRoomId);
  if (!roomId.ok) return ack(fail(roomId.error));

  const room = store.update(roomId.value, mutate);
  if (!room) return ack(fail(ROOM_NOT_FOUND));

  ack(ok(null));
  void broadcastRoom(io, room);
  broadcastLobby(io, store);
}

/**
 * A disconnect only marks seats offline — the sweeper frees them once the grace
 * period elapses, so a refresh or a wifi blip is invisible to everyone else.
 */
async function handleDisconnect(
  io: PokerServer,
  socket: PokerSocket,
  store: RoomStore,
): Promise<void> {
  const userId = socket.data.userId;
  if (!userId) return;

  for (const roomId of socket.data.roomIds) {
    // Another tab may still hold the same seat; only mark it offline if not.
    const remaining = await io.in(roomId).fetchSockets();
    const stillHere = remaining.some((other) => other.data.userId === userId);
    if (stillHere) continue;

    const room = store.update(roomId, (current) =>
      disconnectParticipant(current, userId, Date.now()),
    );
    if (room) await broadcastRoom(io, room);
  }
}
