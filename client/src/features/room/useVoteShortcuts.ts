import { useEffect, useRef } from 'react';
import type { VoteCard } from '@poker/shared';

/**
 * The shape of a keypress this cares about. Structural rather than
 * `KeyboardEvent` so the rule below can be tested without a DOM.
 */
export type ShortcutKey = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat: boolean;
};

/** `0` reaches the tenth card; past that the deck is mouse-only. */
const KEYS = '1234567890';

/**
 * What a keypress means for the hand, on its own so it can be tested without a
 * DOM: a card to play, `null` to retract the one already chosen, or `undefined`
 * when the key is not a shortcut at all.
 */
export function cardForKey(
  event: ShortcutKey,
  deck: readonly VoteCard[],
  selected: VoteCard | null,
): VoteCard | null | undefined {
  // Cmd/Ctrl+1 switches browser tabs, and Alt+n opens menus — leave them alone.
  if (event.ctrlKey || event.metaKey || event.altKey) return undefined;
  // Holding a key down would send a vote on every autorepeat tick.
  if (event.repeat) return undefined;

  const index = KEYS.indexOf(event.key);
  if (index === -1 || event.key.length !== 1) return undefined;

  const card = deck[index];
  if (card === undefined) return undefined;

  // Pressing the card you already hold puts it back, as clicking it does.
  return card === selected ? null : card;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export type VoteShortcutsOptions = {
  deck: readonly VoteCard[];
  selected: VoteCard | null;
  /** False while the round is revealed or a dialog owns the screen. */
  active: boolean;
  onSelect: (value: VoteCard | null) => void;
};

/** Plays the nth card of the deck when the nth number key is pressed. */
export function useVoteShortcuts({ deck, selected, active, onSelect }: VoteShortcutsOptions): void {
  // Read at keypress time rather than depended on: re-subscribing on every
  // vote would tear the listener down and rebuild it for nothing.
  const latest = useRef({ deck, selected, active, onSelect });
  latest.current = { deck, selected, active, onSelect };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const current = latest.current;
      if (!current.active || event.isComposing) return;
      if (isEditable(event.target)) return;
      // Anything modal owns the keyboard while it is up.
      if (document.querySelector('[role="dialog"]')) return;

      const card = cardForKey(event, current.deck, current.selected);
      if (card === undefined) return;

      event.preventDefault();
      current.onSelect(card);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
