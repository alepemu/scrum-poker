import { DEFAULT_ROOM_SETTINGS, type RoomSettings, type VoteCard } from '@poker/shared';
import type { Participant, Room } from './types';

/**
 * Pure room state. Nothing here imports express, socket.io or a timer: every
 * function takes state plus arguments and returns the next state, which is what
 * makes the rules directly testable.
 */

type Participants = ReadonlyMap<string, Participant>;

function next(room: Room, participants: Participants, now: number, revealed = room.revealed): Room {
  return { ...room, participants, revealed, lastActivityAt: now };
}

function replace(room: Room, participant: Participant): Map<string, Participant> {
  const participants = new Map(room.participants);
  participants.set(participant.userId, participant);
  return participants;
}

export function createRoom(input: { id: string; name: string; now: number }): Room {
  return {
    id: input.id,
    name: input.name,
    revealed: false,
    settings: DEFAULT_ROOM_SETTINGS,
    participants: new Map(),
    createdAt: input.now,
    lastActivityAt: input.now,
  };
}

/** Joining twice is a reconnect: the seat, its vote and its join time survive. */
export function joinRoom(room: Room, input: { userId: string; name: string; now: number }): Room {
  const existing = room.participants.get(input.userId);
  const participant: Participant = {
    userId: input.userId,
    name: input.name,
    vote: existing?.vote ?? null,
    connected: true,
    joinedAt: existing?.joinedAt ?? input.now,
    disconnectedAt: null,
  };
  return next(room, replace(room, participant), input.now);
}

export function leaveRoom(room: Room, userId: string, now: number): Room {
  if (!room.participants.has(userId)) return room;
  const participants = new Map(room.participants);
  participants.delete(userId);
  return next(room, participants, now);
}

/** Marks a seat offline without freeing it — see `pruneDisconnected`. */
export function disconnectParticipant(room: Room, userId: string, now: number): Room {
  const existing = room.participants.get(userId);
  if (!existing || !existing.connected) return room;
  return next(room, replace(room, { ...existing, connected: false, disconnectedAt: now }), now);
}

export function renameParticipant(room: Room, userId: string, name: string, now: number): Room {
  const existing = room.participants.get(userId);
  if (!existing || existing.name === name) return room;
  return next(room, replace(room, { ...existing, name }), now);
}

/** Both decks arrive in catalogue order, so position-by-position is enough. */
export function sameDeck(a: readonly VoteCard[], b: readonly VoteCard[]): boolean {
  return a.length === b.length && a.every((card, index) => card === b[index]);
}

/**
 * Name and settings in one step, since they are saved together.
 *
 * next() only carries participants and revealed, so this spreads by hand the
 * way pruneDisconnected does. Identical input returns the same room, which
 * keeps a no-op save from broadcasting to everyone.
 */
export function updateRoom(
  room: Room,
  input: { name: string; settings: RoomSettings; now: number },
): Room {
  const unchanged =
    room.name === input.name &&
    room.settings.animations === input.settings.animations &&
    sameDeck(room.settings.deck, input.settings.deck);
  if (unchanged) return room;

  return { ...room, name: input.name, settings: input.settings, lastActivityAt: input.now };
}

/** Votes are locked once cards are on the table; reset first. */
export function canVote(room: Room): boolean {
  return !room.revealed;
}

/** A card the room does not offer cannot be played. */
export function offersCard(room: Room, card: VoteCard | null): boolean {
  return card === null || room.settings.deck.includes(card);
}

/** True once anyone holds a vote; the deck is frozen for as long as that lasts. */
export function hasAnyVote(room: Room): boolean {
  for (const participant of room.participants.values()) {
    if (participant.vote !== null) return true;
  }
  return false;
}

export function castVote(
  room: Room,
  input: { userId: string; value: VoteCard | null; now: number },
): Room {
  const existing = room.participants.get(input.userId);
  if (!existing || !canVote(room) || !offersCard(room, input.value)) return room;
  return next(room, replace(room, { ...existing, vote: input.value }), input.now);
}

export function revealCards(room: Room, now: number): Room {
  if (room.revealed) return room;
  return next(room, room.participants, now, true);
}

export function resetCards(room: Room, now: number): Room {
  const participants = new Map<string, Participant>();
  for (const [userId, participant] of room.participants) {
    participants.set(userId, { ...participant, vote: null });
  }
  return next(room, participants, now, false);
}

/** Frees seats whose grace period has elapsed. Returns the room unchanged if none have. */
export function pruneDisconnected(room: Room, now: number, graceMs: number): Room {
  const participants = new Map(room.participants);
  let removed = false;

  for (const [userId, participant] of room.participants) {
    if (participant.disconnectedAt !== null && now - participant.disconnectedAt >= graceMs) {
      participants.delete(userId);
      removed = true;
    }
  }

  // lastActivityAt is intentionally left alone: pruning is not activity, and
  // bumping it would keep an abandoned room alive forever.
  return removed ? { ...room, participants } : room;
}

export function hasConnectedParticipants(room: Room): boolean {
  for (const participant of room.participants.values()) {
    if (participant.connected) return true;
  }
  return false;
}

export function isRoomExpired(room: Room, now: number, ttlMs: number): boolean {
  return (
    room.participants.size === 0 &&
    !hasConnectedParticipants(room) &&
    now - room.lastActivityAt >= ttlMs
  );
}

/** Seats in a stable order, so nobody hops around the table mid-round. */
export function seatOrder(room: Room): Participant[] {
  return [...room.participants.values()].sort(
    (a, b) => a.joinedAt - b.joinedAt || a.userId.localeCompare(b.userId),
  );
}
