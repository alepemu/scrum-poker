import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DECK,
  DEFAULT_ROOM_SETTINGS,
  type PublicParticipant,
  type RoomState,
} from '@poker/shared';
import { celebrationFor } from './useRoundCelebration';

function room(revealed: boolean, ...votes: Array<number | null>): RoomState {
  const participants: PublicParticipant[] = votes.map((vote, index) => ({
    userId: `u${index}`,
    name: `User ${index}`,
    connected: true,
    hasVoted: vote !== null,
    vote,
  }));

  return {
    id: 'abcdefgh',
    name: 'Sprint 42',
    revealed,
    settings: DEFAULT_ROOM_SETTINGS,
    participants,
  };
}

describe('celebrationFor', () => {
  it('fires on the moment the cards turn over', () => {
    expect(celebrationFor(false, room(true, 3, 3, 3))).toBe('consensus');
    expect(celebrationFor(false, room(true, 1, 3, 5))).toBe('scattered');
  });

  it('stays quiet for someone who joined after the reveal', () => {
    // A first payload of `revealed: true` — the reveal happened before we
    // arrived, so there is no moment to replay.
    expect(celebrationFor(null, room(true, 3, 3, 3))).toBeNull();
  });

  it('does not repeat on later broadcasts of the same round', () => {
    // Someone renames or leaves while the cards are up: revealed was already
    // true, so nothing fires again.
    expect(celebrationFor(true, room(true, 3, 3, 3))).toBeNull();
  });

  it('stays quiet while the cards are face down', () => {
    expect(celebrationFor(false, room(false, 3, 3, 3))).toBeNull();
    expect(celebrationFor(true, room(false, 3, 3, 3))).toBeNull();
    expect(celebrationFor(null, room(false))).toBeNull();
  });

  it('stays quiet for an ordinary round', () => {
    expect(celebrationFor(false, room(true, 1, 1, 5))).toBeNull();
    expect(celebrationFor(false, room(true, 2, 5))).toBeNull();
    expect(celebrationFor(false, room(true, 3))).toBeNull();
    expect(celebrationFor(false, room(true, null, null))).toBeNull();
  });
});

describe('celebrationFor with animations switched off', () => {
  it('stays quiet even on a round that would otherwise celebrate', () => {
    const off = {
      ...room(true, 3, 3, 3),
      settings: { animations: false, deck: [...DEFAULT_DECK] },
    };
    expect(celebrationFor(false, off)).toBeNull();
  });

  it('still celebrates once they are switched back on', () => {
    const on = { ...room(true, 3, 3, 3), settings: { animations: true, deck: [...DEFAULT_DECK] } };
    expect(celebrationFor(false, on)).toBe('consensus');
  });
});
