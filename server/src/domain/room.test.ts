import { describe, expect, it } from 'vitest';
import { DEFAULT_DECK, type VoteCard } from '@poker/shared';
import { projectRoom, projectRoomFor, summarizeRoom } from './projection';
import {
  canVote,
  castVote,
  hasAnyVote,
  createRoom,
  disconnectParticipant,
  isRoomExpired,
  joinRoom,
  leaveRoom,
  pruneDisconnected,
  renameParticipant,
  resetCards,
  revealCards,
  seatOrder,
  updateRoom,
} from './room';
import type { Room } from './types';

const T0 = 1_000_000;

function roomWith(...people: Array<{ userId: string; name: string; at?: number }>): Room {
  return people.reduce(
    (room, person) =>
      joinRoom(room, { userId: person.userId, name: person.name, now: person.at ?? T0 }),
    createRoom({ id: 'abcdefgh', name: 'Sprint 42', now: T0 }),
  );
}

describe('joining', () => {
  it('seats a participant with no vote', () => {
    const room = roomWith({ userId: 'u1', name: 'Ada' });
    expect(room.participants.get('u1')).toMatchObject({ name: 'Ada', vote: null, connected: true });
  });

  it('treats a repeat join as a reconnect, keeping the vote and the seat', () => {
    let room = roomWith({ userId: 'u1', name: 'Ada' });
    room = castVote(room, { userId: 'u1', value: 3, now: T0 + 10 });
    room = disconnectParticipant(room, 'u1', T0 + 20);

    room = joinRoom(room, { userId: 'u1', name: 'Ada', now: T0 + 30 });

    expect(room.participants.get('u1')).toMatchObject({
      vote: 3,
      connected: true,
      joinedAt: T0,
      disconnectedAt: null,
    });
  });

  it('orders seats by join time regardless of insertion order', () => {
    const room = roomWith(
      { userId: 'u2', name: 'Grace', at: T0 + 50 },
      { userId: 'u1', name: 'Ada', at: T0 },
    );
    expect(seatOrder(room).map((p) => p.userId)).toEqual(['u1', 'u2']);
  });

  it('removes a seat on leave', () => {
    const room = leaveRoom(roomWith({ userId: 'u1', name: 'Ada' }), 'u1', T0 + 5);
    expect(room.participants.size).toBe(0);
  });
});

describe('voting', () => {
  it('records a vote and allows retracting it', () => {
    let room = roomWith({ userId: 'u1', name: 'Ada' });
    room = castVote(room, { userId: 'u1', value: 1.5, now: T0 + 1 });
    expect(room.participants.get('u1')?.vote).toBe(1.5);

    room = castVote(room, { userId: 'u1', value: null, now: T0 + 2 });
    expect(room.participants.get('u1')?.vote).toBeNull();
  });

  it('ignores votes from people who are not in the room', () => {
    const room = roomWith({ userId: 'u1', name: 'Ada' });
    expect(castVote(room, { userId: 'ghost', value: 2, now: T0 + 1 })).toBe(room);
  });

  it('locks voting once the cards are revealed', () => {
    let room = revealCards(roomWith({ userId: 'u1', name: 'Ada' }), T0 + 1);
    expect(canVote(room)).toBe(false);

    room = castVote(room, { userId: 'u1', value: 5, now: T0 + 2 });
    expect(room.participants.get('u1')?.vote).toBeNull();
  });
});

describe('reveal gate', () => {
  it('never leaks another participant vote before the reveal', () => {
    let room = roomWith({ userId: 'u1', name: 'Ada' }, { userId: 'u2', name: 'Grace' });
    room = castVote(room, { userId: 'u1', value: 5, now: T0 + 1 });
    room = castVote(room, { userId: 'u2', value: 2, now: T0 + 2 });

    const seenByGrace = projectRoomFor(room, 'u2');
    const ada = seenByGrace.participants.find((p) => p.userId === 'u1');

    expect(ada).toMatchObject({ hasVoted: true, vote: null });
    // Every participant field is checked, not only the one we expect the leak
    // in. Scoped to the seats because the room's own deck legitimately lists 5.
    expect(JSON.stringify(seenByGrace.participants)).not.toContain('5');
  });

  it('shows a participant their own vote before the reveal', () => {
    let room = roomWith({ userId: 'u1', name: 'Ada' });
    room = castVote(room, { userId: 'u1', value: 4, now: T0 + 1 });

    expect(projectRoomFor(room, 'u1').participants[0]?.vote).toBe(4);
    expect(projectRoom(room).participants[0]?.vote).toBeNull();
  });

  it('shows every vote once revealed', () => {
    let room = roomWith({ userId: 'u1', name: 'Ada' }, { userId: 'u2', name: 'Grace' });
    room = castVote(room, { userId: 'u1', value: 5, now: T0 + 1 });
    room = revealCards(room, T0 + 3);

    const state = projectRoomFor(room, 'u2');
    expect(state.revealed).toBe(true);
    expect(state.participants.map((p) => p.vote)).toEqual([5, null]);
  });

  it('clears every vote on reset', () => {
    let room = roomWith({ userId: 'u1', name: 'Ada' }, { userId: 'u2', name: 'Grace' });
    room = castVote(room, { userId: 'u1', value: 5, now: T0 + 1 });
    room = revealCards(room, T0 + 2);
    room = resetCards(room, T0 + 3);

    expect(room.revealed).toBe(false);
    expect(seatOrder(room).every((p) => p.vote === null)).toBe(true);
  });
});

describe('renaming', () => {
  it('updates the name in place', () => {
    const room = renameParticipant(roomWith({ userId: 'u1', name: 'Ada' }), 'u1', 'Ada L.', T0 + 1);
    expect(room.participants.get('u1')?.name).toBe('Ada L.');
  });
});

describe('disconnect grace and expiry', () => {
  const GRACE = 30_000;

  it('keeps the seat while inside the grace period', () => {
    let room = disconnectParticipant(roomWith({ userId: 'u1', name: 'Ada' }), 'u1', T0);
    room = pruneDisconnected(room, T0 + GRACE - 1, GRACE);
    expect(room.participants.size).toBe(1);
  });

  it('frees the seat once the grace period elapses', () => {
    let room = disconnectParticipant(roomWith({ userId: 'u1', name: 'Ada' }), 'u1', T0);
    room = pruneDisconnected(room, T0 + GRACE, GRACE);
    expect(room.participants.size).toBe(0);
  });

  it('leaves connected participants alone', () => {
    const room = roomWith({ userId: 'u1', name: 'Ada' });
    expect(pruneDisconnected(room, T0 + 10 * GRACE, GRACE)).toBe(room);
  });

  it('expires only an empty room past its ttl', () => {
    const ttl = 60_000;
    const occupied = roomWith({ userId: 'u1', name: 'Ada' });
    expect(isRoomExpired(occupied, T0 + ttl, ttl)).toBe(false);

    const emptied = leaveRoom(occupied, 'u1', T0 + 1);
    expect(isRoomExpired(emptied, T0 + 1 + ttl - 1, ttl)).toBe(false);
    expect(isRoomExpired(emptied, T0 + 1 + ttl, ttl)).toBe(true);
  });

  it('does not treat pruning as activity', () => {
    const ttl = 60_000;
    let room = disconnectParticipant(roomWith({ userId: 'u1', name: 'Ada' }), 'u1', T0);
    room = pruneDisconnected(room, T0 + GRACE, GRACE);
    expect(isRoomExpired(room, T0 + ttl, ttl)).toBe(true);
  });
});

describe('summary', () => {
  it('reports the room for the lobby list', () => {
    const room = roomWith({ userId: 'u1', name: 'Ada' }, { userId: 'u2', name: 'Grace' });
    expect(summarizeRoom(room)).toEqual({
      id: 'abcdefgh',
      name: 'Sprint 42',
      participantCount: 2,
      revealed: false,
    });
  });
});

describe('room settings', () => {
  const LATER = T0 + 500;

  it('starts a new room on the defaults', () => {
    const room = createRoom({ id: 'abcdefgh', name: 'Sprint 42', now: T0 });
    expect(room.settings).toEqual({ animations: true, deck: [...DEFAULT_DECK] });
  });

  it('saves a new name and settings together', () => {
    const room = updateRoom(roomWith({ userId: 'u1', name: 'Ada' }), {
      name: 'Sprint 43',
      settings: { animations: false, deck: [...DEFAULT_DECK] },
      now: LATER,
    });

    expect(room.name).toBe('Sprint 43');
    expect(room.settings).toEqual({ animations: false, deck: [...DEFAULT_DECK] });
    expect(room.lastActivityAt).toBe(LATER);
  });

  it('leaves the seats and the round alone', () => {
    const before = revealCards(roomWith({ userId: 'u1', name: 'Ada' }), T0);
    const after = updateRoom(before, {
      name: 'Sprint 43',
      settings: { animations: true, deck: [...DEFAULT_DECK] },
      now: LATER,
    });

    expect(after.revealed).toBe(true);
    expect(after.participants).toBe(before.participants);
  });

  it('returns the same room when nothing actually changed', () => {
    // Saving an untouched dialog must not broadcast to everyone else.
    const room = roomWith({ userId: 'u1', name: 'Ada' });
    expect(updateRoom(room, { name: room.name, settings: room.settings, now: LATER })).toBe(room);
  });

  it('carries the settings onto the wire', () => {
    const room = updateRoom(roomWith({ userId: 'u1', name: 'Ada' }), {
      name: 'Sprint 42',
      settings: { animations: false, deck: [...DEFAULT_DECK] },
      now: LATER,
    });

    expect(projectRoom(room).settings).toEqual({ animations: false, deck: [...DEFAULT_DECK] });
  });
});

describe('the deck', () => {
  const LATER = T0 + 500;
  const deckOf = (...cards: VoteCard[]) => ({ animations: true, deck: cards });

  it('starts a new room on the default scale', () => {
    expect(createRoom({ id: 'abcdefgh', name: 'Sprint 42', now: T0 }).settings.deck).toEqual([
      ...DEFAULT_DECK,
    ]);
  });

  it('knows whether anyone is holding a card', () => {
    let room = roomWith({ userId: 'u1', name: 'Ada' });
    expect(hasAnyVote(room)).toBe(false);

    room = castVote(room, { userId: 'u1', value: 3, now: T0 + 1 });
    expect(hasAnyVote(room)).toBe(true);

    // A fresh round frees the deck again.
    expect(hasAnyVote(resetCards(room, T0 + 2))).toBe(false);
  });

  it('ignores a card the room does not offer', () => {
    const room = updateRoom(roomWith({ userId: 'u1', name: 'Ada' }), {
      name: 'Sprint 42',
      settings: deckOf(1, 2, 3),
      now: LATER,
    });

    expect(
      castVote(room, { userId: 'u1', value: 8, now: LATER }).participants.get('u1')?.vote,
    ).toBeNull();
    expect(
      castVote(room, { userId: 'u1', value: 2, now: LATER }).participants.get('u1')?.vote,
    ).toBe(2);
  });

  it('accepts the special cards when they are on offer', () => {
    const room = updateRoom(roomWith({ userId: 'u1', name: 'Ada' }), {
      name: 'Sprint 42',
      settings: deckOf(1, '?', 'coffee'),
      now: LATER,
    });

    expect(
      castVote(room, { userId: 'u1', value: 'coffee', now: LATER }).participants.get('u1')?.vote,
    ).toBe('coffee');
  });

  it('returns the same room when an equal deck is saved again', () => {
    // The client always sends a fresh array, so this has to compare by value —
    // otherwise every save would broadcast to everyone.
    const room = roomWith({ userId: 'u1', name: 'Ada' });
    const settings = { animations: room.settings.animations, deck: [...room.settings.deck] };

    expect(updateRoom(room, { name: room.name, settings, now: LATER })).toBe(room);
  });

  it('saves a deck that really did change', () => {
    const room = updateRoom(roomWith({ userId: 'u1', name: 'Ada' }), {
      name: 'Sprint 42',
      settings: deckOf(1, 2, 3),
      now: LATER,
    });

    expect(room.settings.deck).toEqual([1, 2, 3]);
    expect(room.lastActivityAt).toBe(LATER);
  });
});
