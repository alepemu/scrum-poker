import {
  DEFAULT_ROOM_SETTINGS,
  DEFAULT_DECK,
  type PublicParticipant,
  type RoomSettings,
  type RoomState,
  type VoteCard,
} from '@poker/shared';

/**
 * Builds a mannequin room so the ring can be seen at any headcount without a
 * server, a second browser, or anyone else voting. Reached at /preview, which
 * the lobby no longer links to — it is how table layout gets checked.
 */

export const PREVIEW_VIEWER_ID = 'preview-you';

const NAMES = [
  'Ada',
  'Grace',
  'Marta',
  'Tom',
  'Priya',
  'Jonas',
  'Lena',
  'Rui',
  'Ines',
  'Karl',
  'Sofia',
  'Otto',
  'Nadia',
  'Bruno',
];

export type PreviewOptions = {
  settings?: RoomSettings;
  seats: number;
  revealed: boolean;
  /** How the votes fall, which decides whether a celebration is warranted. */
  spread: 'mixed' | 'consensus' | 'scattered';
};

function voteFor(index: number, spread: PreviewOptions['spread']): VoteCard | null {
  if (spread === 'consensus') return 3;
  if (spread === 'scattered') return DEFAULT_DECK[index % DEFAULT_DECK.length] ?? 1;
  // Mixed: a plausible round — most voted, one still thinking, one away.
  if (index % 5 === 4) return null;
  return DEFAULT_DECK[(index * 3) % DEFAULT_DECK.length] ?? 1;
}

export function buildPreviewRoom({ seats, revealed, spread, settings }: PreviewOptions): RoomState {
  const participants: PublicParticipant[] = Array.from({ length: seats }, (_, index) => {
    const vote = voteFor(index, spread);

    return {
      // The viewer is seated first so arrangeSeats puts them at the near edge.
      userId: index === 0 ? PREVIEW_VIEWER_ID : `preview-${index}`,
      name: NAMES[index % NAMES.length] ?? `User ${index + 1}`,
      // One person offline from six seats up, to see the dimmed state too.
      connected: !(seats >= 6 && index === 3),
      hasVoted: vote !== null,
      vote: revealed ? vote : null,
    };
  });

  return {
    id: 'preview',
    name: 'Preview Room',
    revealed,
    settings: settings ?? DEFAULT_ROOM_SETTINGS,
    participants,
  };
}
