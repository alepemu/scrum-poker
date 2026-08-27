import { describe, expect, it } from 'vitest';
import type { VoteCard } from '@poker/shared';
import { cardForKey, type ShortcutKey } from './useVoteShortcuts';

const DECK: VoteCard[] = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5];

function press(key: string, over: Partial<ShortcutKey> = {}): ShortcutKey {
  return { key, ctrlKey: false, metaKey: false, altKey: false, repeat: false, ...over };
}

describe('cardForKey', () => {
  it('plays the card at the position of the digit', () => {
    expect(cardForKey(press('1'), DECK, null)).toBe(0.25);
    expect(cardForKey(press('4'), DECK, null)).toBe(1);
    expect(cardForKey(press('9'), DECK, null)).toBe(5);
  });

  it('reaches the tenth card with zero', () => {
    const ten: VoteCard[] = [...DECK, 8];

    expect(cardForKey(press('0'), ten, null)).toBe(8);
    // Nine cards means there is no tenth to reach.
    expect(cardForKey(press('0'), DECK, null)).toBeUndefined();
  });

  it('ignores a digit past the end of a short deck', () => {
    const short: VoteCard[] = [1, 2, 3];

    expect(cardForKey(press('3'), short, null)).toBe(3);
    expect(cardForKey(press('4'), short, null)).toBeUndefined();
  });

  it('retracts when the digit belongs to the card already held', () => {
    expect(cardForKey(press('4'), DECK, 1)).toBeNull();
    // A different digit swaps the card rather than retracting.
    expect(cardForKey(press('5'), DECK, 1)).toBe(1.5);
  });

  it('maps the special cards by position like any other', () => {
    const mixed: VoteCard[] = [1, 2, '?', 'coffee'];

    expect(cardForKey(press('3'), mixed, null)).toBe('?');
    expect(cardForKey(press('4'), mixed, null)).toBe('coffee');
    expect(cardForKey(press('4'), mixed, 'coffee')).toBeNull();
  });

  it('leaves keys that are not a single digit alone', () => {
    for (const key of ['a', 'Enter', 'Escape', 'F1', 'ArrowLeft', ' ', '.', '-']) {
      expect(cardForKey(press(key), DECK, null)).toBeUndefined();
    }
  });

  it('keeps out of the way of browser and system chords', () => {
    expect(cardForKey(press('1', { ctrlKey: true }), DECK, null)).toBeUndefined();
    expect(cardForKey(press('1', { metaKey: true }), DECK, null)).toBeUndefined();
    expect(cardForKey(press('1', { altKey: true }), DECK, null)).toBeUndefined();
  });

  it('fires once rather than on every autorepeat tick', () => {
    expect(cardForKey(press('1', { repeat: true }), DECK, null)).toBeUndefined();
  });
});
