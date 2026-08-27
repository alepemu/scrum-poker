/** The two cards that carry no number: "I don't know" and "let's break". */
export const SPECIAL_CARDS = ['?', 'coffee'] as const;

export type SpecialCard = (typeof SPECIAL_CARDS)[number];

/** A card that can be played, or offered by a room. */
export type VoteCard = number | SpecialCard;

/** Every card a room may offer, in the order they are shown. */
export const CARD_CATALOGUE: readonly VoteCard[] = [
  0,
  0.25,
  0.5,
  0.75,
  1,
  1.5,
  2,
  3,
  4,
  5,
  8,
  13,
  '?',
  'coffee',
];

/** What a new room offers: the scale the app shipped with. */
export const DEFAULT_DECK: readonly VoteCard[] = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5];

/** A deck of one leaves nothing to estimate with. */
export const MIN_DECK_SIZE = 2;

/** Decimal notation used across the UI (the team writes `0,25`, not `0.25`). */
const DECIMAL_SEPARATOR = ',';

/** How each special card is written when it reaches a screen. */
const SPECIAL_LABELS: Record<SpecialCard, string> = {
  '?': '?',
  coffee: '☕',
};

/** How each special card is read aloud. */
const SPECIAL_NAMES: Record<SpecialCard, string> = {
  '?': 'unsure',
  coffee: 'break',
};

export function isSpecialCard(value: unknown): value is SpecialCard {
  return typeof value === 'string' && (SPECIAL_CARDS as readonly string[]).includes(value);
}

export function isVoteCard(value: unknown): value is VoteCard {
  return (
    (typeof value === 'number' || isSpecialCard(value)) &&
    (CARD_CATALOGUE as readonly unknown[]).includes(value)
  );
}

/**
 * Renders a number in the team's notation. The single place decimal formatting
 * is decided — change the separator here and the whole UI follows.
 */
export function formatNumber(value: number, maxDecimals = 2): string {
  const rounded = Number(value.toFixed(maxDecimals));
  return String(rounded).replace('.', DECIMAL_SEPARATOR);
}

/** Every card label in the UI comes through here, specials included. */
export function formatVote(card: VoteCard): string {
  return isSpecialCard(card) ? SPECIAL_LABELS[card] : formatNumber(card);
}

/** The spoken name, for screen readers that would otherwise read a glyph. */
export function describeVote(card: VoteCard): string {
  return isSpecialCard(card) ? SPECIAL_NAMES[card] : formatNumber(card);
}

/** Catalogue order, so a stored deck is always comparable element by element. */
export function sortDeck(cards: readonly VoteCard[]): VoteCard[] {
  return CARD_CATALOGUE.filter((card) => cards.includes(card));
}

export const MAX_USER_NAME_LENGTH = 24;
export const MAX_ROOM_NAME_LENGTH = 40;

/** What a freshly created room starts with. */
export const DEFAULT_ROOM_SETTINGS = {
  animations: true,
  deck: [...DEFAULT_DECK],
};

/** How long a disconnected participant keeps their seat (refresh, wifi blip, a step away). */
export const DISCONNECT_GRACE_MS = 5 * 60_000;
/** How long an empty room lingers in the lobby before it is collected. */
export const ROOM_TTL_MS = 6 * 60 * 60_000;
/** How often the server prunes stale participants and rooms. */
export const SWEEP_INTERVAL_MS = 10_000;

/**
 * How many different cards make a round worth calling chaotic. A bigger table
 * spreads out on its own, so it has to disagree harder to earn the moment.
 * Below three people there is no such thing as chaos — that is just a split.
 */
export function scatterThreshold(roomSize: number): number | null {
  if (roomSize < 3) return null;
  if (roomSize <= 4) return 3;
  if (roomSize <= 6) return 4;
  return 5;
}
/** How long a round celebration stays on the table. */
export const CELEBRATION_MS = 4400;
