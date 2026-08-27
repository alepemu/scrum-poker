import {
  MAX_ROOM_NAME_LENGTH,
  MAX_USER_NAME_LENGTH,
  MIN_DECK_SIZE,
  isVoteCard,
  sortDeck,
  type RoomSettings,
  type VoteCard,
} from '@poker/shared';

/**
 * Payload guards. Cheap, and they keep a malformed or hostile client from
 * corrupting a room that everyone else is looking at.
 */

export type Valid<T> = { ok: true; value: T };
export type Invalid = { ok: false; error: string };
export type Validated<T> = Valid<T> | Invalid;

const valid = <T>(value: T): Valid<T> => ({ ok: true, value });
const invalid = (error: string): Invalid => ({ ok: false, error });

function normalizeName(raw: unknown, maxLength: number): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/\s+/g, ' ').slice(0, maxLength);
  return trimmed.length > 0 ? trimmed : null;
}

export function validateUserName(raw: unknown): Validated<string> {
  const name = normalizeName(raw, MAX_USER_NAME_LENGTH);
  return name ? valid(name) : invalid('Please enter a name.');
}

export function validateRoomName(raw: unknown): Validated<string> {
  const name = normalizeName(raw, MAX_ROOM_NAME_LENGTH);
  return name ? valid(name) : invalid('Please enter a room name.');
}

export function validateUserId(raw: unknown): Validated<string> {
  return typeof raw === 'string' && raw.length > 0 && raw.length <= 64
    ? valid(raw)
    : invalid('Invalid user id.');
}

export function validateRoomId(raw: unknown): Validated<string> {
  return typeof raw === 'string' && /^[a-z0-9]{1,32}$/.test(raw)
    ? valid(raw)
    : invalid('Invalid room id.');
}

/**
 * Shape only: whether the room actually offers the card is a question for the
 * room, and is answered in the handler where the room is in hand.
 */
export function validateVote(raw: unknown): Validated<VoteCard | null> {
  if (raw === null) return valid(null);
  return isVoteCard(raw) ? valid(raw) : invalid('Unknown vote value.');
}

/** Normalised into catalogue order, so a stored deck is always comparable. */
function validateDeck(raw: unknown): Validated<VoteCard[]> {
  if (!Array.isArray(raw)) return invalid('Invalid card deck.');
  if (!raw.every(isVoteCard)) return invalid('Unknown card in the deck.');

  const deck = sortDeck(raw);
  return deck.length >= MIN_DECK_SIZE
    ? valid(deck)
    : invalid(`Pick at least ${MIN_DECK_SIZE} cards.`);
}

/** Settings arrive as a whole object, so one guard covers it. */
export function validateRoomSettings(raw: unknown): Validated<RoomSettings> {
  if (typeof raw !== 'object' || raw === null) return invalid('Invalid room settings.');

  const { animations, deck } = raw as Record<string, unknown>;
  if (typeof animations !== 'boolean') return invalid('Invalid animation setting.');

  const cards = validateDeck(deck);
  if (!cards.ok) return cards;

  return valid({ animations, deck: cards.value });
}
