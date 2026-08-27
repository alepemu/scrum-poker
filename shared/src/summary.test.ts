import { describe, expect, it } from 'vitest';
import { formatNumber, formatVote, isVoteCard, type VoteCard } from './constants';
import type { PublicParticipant } from './protocol';
import { roundOutcome, summarizeVotes } from './summary';

function participant(name: string, vote: VoteCard | null): PublicParticipant {
  return { userId: name, name, connected: true, hasVoted: vote !== null, vote };
}

describe('summarizeVotes', () => {
  it('averages only the votes actually cast', () => {
    const summary = summarizeVotes([
      participant('Ada', 2),
      participant('Grace', 3),
      participant('Alan', null),
    ]);

    expect(summary.average).toBe(2.5);
    expect(summary.voterCount).toBe(2);
    expect(summary.abstainCount).toBe(1);
  });

  it('has no average when nobody voted', () => {
    expect(summarizeVotes([participant('Ada', null)]).average).toBeNull();
  });

  it('orders the distribution by popularity', () => {
    const summary = summarizeVotes([
      participant('Ada', 1),
      participant('Grace', 3),
      participant('Alan', 3),
    ]);

    expect(summary.tallies).toEqual([
      { value: 3, count: 2 },
      { value: 1, count: 1 },
    ]);
  });

  it('flags consensus only when more than one person agreed', () => {
    expect(summarizeVotes([participant('Ada', 3)]).consensus).toBe(false);
    expect(summarizeVotes([participant('Ada', 3), participant('Grace', 3)]).consensus).toBe(true);
    expect(summarizeVotes([participant('Ada', 3), participant('Grace', 2)]).consensus).toBe(false);
  });
});

describe('formatting', () => {
  it('renders values in the team notation', () => {
    expect(formatVote(0.25)).toBe('0,25');
    expect(formatVote(1)).toBe('1');
    expect(formatVote(1.5)).toBe('1,5');
  });

  it('rounds averages to two decimals', () => {
    expect(formatNumber(2.6666)).toBe('2,67');
    expect(formatNumber(3)).toBe('3');
  });

  it('recognises only cards in the catalogue', () => {
    expect(isVoteCard(0.75)).toBe(true);
    // 13 joined the catalogue when the deck became configurable.
    expect(isVoteCard(13)).toBe(true);
    expect(isVoteCard(7)).toBe(false);
    expect(isVoteCard('?')).toBe(true);
    expect(isVoteCard('coffee')).toBe(true);
    expect(isVoteCard('3')).toBe(false);
  });

  it('writes the special cards as glyphs', () => {
    expect(formatVote('?')).toBe('?');
    expect(formatVote('coffee')).toBe('☕');
  });
});

describe('scattered rounds', () => {
  // Every entry is one seat; null is someone who has not voted.
  const scattered = (...votes: Array<VoteCard | null>) =>
    summarizeVotes(votes.map((vote, index) => participant(`p${index}`, vote))).scattered;

  it('is not a thing below three people', () => {
    // Two people disagreeing is an ordinary split, not a moment.
    expect(scattered(2, 5)).toBe(false);
    expect(scattered(3)).toBe(false);
  });

  it('needs three different cards in a room of three or four', () => {
    expect(scattered(1, 3, 5)).toBe(true);
    expect(scattered(1, 1, 5)).toBe(false);
    // A repeat is fine as long as three different cards are on the table.
    expect(scattered(1, 3, 5, 5)).toBe(true);
    expect(scattered(1, 1, 5, 5)).toBe(false);
  });

  it('needs four in a room of five or six', () => {
    expect(scattered(1, 2, 3, 5, 5)).toBe(true);
    expect(scattered(1, 2, 3, 3, 3)).toBe(false);
    expect(scattered(1, 2, 3, 4, 5, 5)).toBe(true);
  });

  it('needs five once the room is bigger than six', () => {
    expect(scattered(1, 2, 3, 4, 4, 4, 4)).toBe(false);
    expect(scattered(1, 2, 3, 4, 5, 5, 5)).toBe(true);
  });

  it('measures the room, not the turnout', () => {
    // Three people pulling apart around a table of five is not yet the moment
    // the whole room is: the seats that stayed quiet still count.
    expect(scattered(1, 3, 5, null, null)).toBe(false);
    expect(scattered(1, 2, 3, 5, null)).toBe(true);
    // Abstainers cannot make up the numbers on their own.
    expect(scattered(1, 3, null)).toBe(false);
  });

  it('counts the special cards as their own opinion', () => {
    expect(scattered(1, 3, '?')).toBe(true);
    expect(scattered(1, 2, 3, '?', 'coffee', 5)).toBe(true);
  });

  it('is never true at the same time as consensus', () => {
    const rounds = [[3, 3, 3], [1, 3, 5], [1, 1, 5], [2, 5], [3], []];

    for (const votes of rounds) {
      const summary = summarizeVotes(votes.map((vote, index) => participant(`p${index}`, vote)));
      expect(summary.consensus && summary.scattered).toBe(false);
    }
  });
});

describe('roundOutcome', () => {
  const outcomeOf = (...votes: VoteCard[]) =>
    roundOutcome(summarizeVotes(votes.map((vote, index) => participant(`p${index}`, vote))));

  it('names the two notable endings and nothing else', () => {
    expect(outcomeOf(3, 3, 3)).toBe('consensus');
    expect(outcomeOf(1, 3, 5)).toBe('scattered');
    expect(outcomeOf(1, 1, 5)).toBeNull();
    expect(outcomeOf(3)).toBeNull();
  });
});

describe('special cards', () => {
  const summaryOf = (...votes: Array<VoteCard | null>) =>
    summarizeVotes(votes.map((vote, index) => participant(`p${index}`, vote)));

  it('leaves them out of the average but keeps them in the distribution', () => {
    const summary = summaryOf(2, 4, '?');

    expect(summary.average).toBe(3);
    expect(summary.tallies).toContainEqual({ value: '?', count: 1 });
  });

  it('counts a special card as a vote, not as silence', () => {
    // Picking `?` says something; staying quiet does not.
    const summary = summaryOf(3, '?', null);

    expect(summary.voterCount).toBe(2);
    expect(summary.abstainCount).toBe(1);
  });

  it('has no average when only special cards were played', () => {
    expect(summaryOf('?', 'coffee').average).toBeNull();
  });

  it('treats a table that all wants a break as agreement', () => {
    const summary = summaryOf('coffee', 'coffee', 'coffee');

    expect(summary.consensus).toBe(true);
    expect(roundOutcome(summary)).toBe('consensus');
  });

  it('orders numbers before specials in the distribution', () => {
    const summary = summaryOf('coffee', 5, '?', 1);

    expect(summary.tallies.map((tally) => tally.value)).toEqual([1, 5, '?', 'coffee']);
  });
});
