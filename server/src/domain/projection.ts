import type { PublicParticipant, RoomState, RoomSummary } from '@poker/shared';
import { seatOrder } from './room';
import type { Room } from './types';

/**
 * The reveal gate. This is the only function in the codebase that reads
 * `participant.vote` for output — everything sent to a browser passes through
 * here, so hiding votes before a reveal is enforced in exactly one place.
 */
export function projectRoom(room: Room): RoomState {
  const participants: PublicParticipant[] = seatOrder(room).map((participant) => ({
    userId: participant.userId,
    name: participant.name,
    connected: participant.connected,
    hasVoted: participant.vote !== null,
    vote: room.revealed ? participant.vote : null,
  }));

  return {
    id: room.id,
    name: room.name,
    revealed: room.revealed,
    settings: room.settings,
    participants,
  };
}

/**
 * A viewer's own vote is theirs to see before the reveal. Applied on top of the
 * public projection so the gate above stays the single source of truth.
 */
export function projectRoomFor(room: Room, viewerId: string | null): RoomState {
  const state = projectRoom(room);
  if (room.revealed || viewerId === null) return state;

  const ownVote = room.participants.get(viewerId)?.vote ?? null;
  if (ownVote === null) return state;

  return {
    ...state,
    participants: state.participants.map((participant) =>
      participant.userId === viewerId ? { ...participant, vote: ownVote } : participant,
    ),
  };
}

export function summarizeRoom(room: Room): RoomSummary {
  return {
    id: room.id,
    name: room.name,
    participantCount: room.participants.size,
    revealed: room.revealed,
  };
}
