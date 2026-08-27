import { useEffect, useRef, useState } from 'react';
import {
  CELEBRATION_MS,
  roundOutcome,
  summarizeVotes,
  type RoomState,
  type RoundOutcome,
} from '@poker/shared';
import { pickCelebration } from './celebrations';

export type Celebration = {
  outcome: RoundOutcome;
  /** The chosen file, or null when that folder is empty. */
  source: string | null;
};

/**
 * The rule, on its own so it can be tested without a DOM: given what we last
 * saw and what just arrived, what (if anything) should play?
 *
 * Only the false -> true transition counts. `room:state` is broadcast on every
 * change, and someone joining a room whose cards are already up receives
 * `revealed: true` in their very first payload — replaying a moment they never
 * witnessed would be wrong, so a `previousRevealed` of null fires nothing.
 */
export function celebrationFor(
  previousRevealed: boolean | null,
  state: RoomState,
): RoundOutcome | null {
  if (!state.revealed) return null;
  if (previousRevealed !== false) return null;
  // Switched off for the room: nothing to play, for anyone.
  if (!state.settings.animations) return null;
  return roundOutcome(summarizeVotes(state.participants));
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * Watches for the moment the cards turn over and, when the round ended
 * somewhere notable, hands back something to show for a couple of seconds.
 *
 * Only the false -> true transition counts. `room:state` is broadcast on every
 * change, and someone joining a room whose cards are already up receives
 * `revealed: true` in their very first payload — replaying a moment they never
 * witnessed would be wrong.
 */
export function useRoundCelebration(state: RoomState | null, roomId: string): Celebration | null {
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const seenRevealed = useRef<boolean | null>(null);
  const lastSource = useRef<string | null>(null);

  // A different room starts the observation over.
  useEffect(() => {
    seenRevealed.current = null;
    setCelebration(null);
  }, [roomId]);

  useEffect(() => {
    if (!state) return;

    const previous = seenRevealed.current;
    seenRevealed.current = state.revealed;

    // Cards went back down: clear immediately rather than letting it linger.
    if (!state.revealed) {
      setCelebration(null);
      return;
    }

    const outcome = celebrationFor(previous, state);
    if (!outcome) return;

    // A GIF cannot be stilled, so the respectful thing is to skip it entirely.
    if (prefersReducedMotion()) return;

    const source = pickCelebration(outcome, lastSource.current);
    lastSource.current = source;
    setCelebration({ outcome, source });
  }, [state]);

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(() => setCelebration(null), CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [celebration]);

  return celebration;
}
