import { CARD_CATALOGUE, scatterThreshold, type VoteCard } from './constants';
import type { PublicParticipant } from './protocol';

export type VoteTally = { value: VoteCard; count: number };

export type VoteSummary = {
  /** Mean of the numeric votes; null when nobody played a number. */
  average: number | null;
  /** Distribution, most-picked first. Includes the special cards. */
  tallies: VoteTally[];
  voterCount: number;
  /** People who played nothing at all — `?` and `☕` are votes, not silence. */
  abstainCount: number;
  /** True when everyone who voted picked the same card (and at least two did). */
  consensus: boolean;
  /** True when the table spread across enough different cards for its size. */
  scattered: boolean;
};

/** A round that ended somewhere worth noticing. */
export type RoundOutcome = 'consensus' | 'scattered';

/** Numbers first and ascending, then the specials in catalogue order. */
function compareCards(a: VoteCard, b: VoteCard): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return CARD_CATALOGUE.indexOf(a) - CARD_CATALOGUE.indexOf(b);
}

/**
 * Computed from the revealed room state, so it lives in `shared` and stays
 * identical wherever it is used.
 */
export function summarizeVotes(participants: readonly PublicParticipant[]): VoteSummary {
  const cast = participants
    .map((participant) => participant.vote)
    .filter((vote): vote is VoteCard => vote !== null);

  // `?` and `☕` are opinions, but they are not quantities: they count towards
  // the distribution and consensus, and are left out of the average.
  const numeric = cast.filter((vote): vote is number => typeof vote === 'number');

  const counts = new Map<VoteCard, number>();
  for (const vote of cast) {
    counts.set(vote, (counts.get(vote) ?? 0) + 1);
  }

  const tallies = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || compareCards(a.value, b.value));

  // Scaled to the room, not to the turnout: a handful of split votes around a
  // big table is not the same event as a small room pulling apart.
  const threshold = scatterThreshold(participants.length);

  const average =
    numeric.length > 0 ? numeric.reduce((sum, v) => sum + v, 0) / numeric.length : null;

  return {
    average,
    tallies,
    voterCount: cast.length,
    abstainCount: participants.length - cast.length,
    consensus: cast.length > 1 && tallies.length === 1,
    scattered: threshold !== null && tallies.length >= threshold,
  };
}

/**
 * The two flags are mutually exclusive by construction — consensus is exactly
 * one distinct card, chaos is at least three — so no tie-break is needed.
 */
export function roundOutcome(summary: VoteSummary): RoundOutcome | null {
  if (summary.consensus) return 'consensus';
  if (summary.scattered) return 'scattered';
  return null;
}
