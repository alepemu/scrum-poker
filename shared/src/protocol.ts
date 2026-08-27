import type { VoteCard } from './constants';

/**
 * The wire contract. Imported by both the server and the client so a mistyped
 * payload is a compile error rather than a runtime mystery.
 */

/** A participant as other people are allowed to see them. */
export type PublicParticipant = {
  userId: string;
  name: string;
  connected: boolean;
  hasVoted: boolean;
  /** Null unless the room is revealed — vote values never leave the server early. */
  vote: VoteCard | null;
};

/** Room-wide behaviour. Anyone in the room may change these. */
export type RoomSettings = {
  /** When false, a round never plays a celebration. Card flips are unaffected. */
  animations: boolean;
  /** Which cards this room offers, in catalogue order. */
  deck: VoteCard[];
};

export type RoomState = {
  id: string;
  name: string;
  revealed: boolean;
  settings: RoomSettings;
  /** Ordered by join time, so seats stay put as people come and go. */
  participants: PublicParticipant[];
};

export type RoomSummary = {
  id: string;
  name: string;
  participantCount: number;
  revealed: boolean;
};

export type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

export type JoinRoomPayload = { roomId: string; userId: string; name: string };
export type CreateRoomPayload = { name: string };
export type RoomRefPayload = { roomId: string };
export type CastVotePayload = { roomId: string; value: VoteCard | null };
export type RenamePayload = { name: string };
export type UpdateRoomPayload = { roomId: string; name: string; settings: RoomSettings };

export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void;
  'room:closed': (payload: RoomRefPayload) => void;
  'rooms:updated': (rooms: RoomSummary[]) => void;
}

export interface ClientToServerEvents {
  /** Subscribe/unsubscribe to lobby updates while the room list is on screen. */
  'rooms:subscribe': (ack: (res: Ack<RoomSummary[]>) => void) => void;
  'rooms:unsubscribe': () => void;
  'rooms:create': (payload: CreateRoomPayload, ack: (res: Ack<RoomSummary>) => void) => void;
  'room:join': (payload: JoinRoomPayload, ack: (res: Ack<RoomState>) => void) => void;
  'room:leave': (payload: RoomRefPayload) => void;
  /** Name and settings are saved together, so one payload replaces both. */
  'room:update': (payload: UpdateRoomPayload, ack: (res: Ack<null>) => void) => void;
  'vote:cast': (payload: CastVotePayload, ack: (res: Ack<null>) => void) => void;
  'cards:reveal': (payload: RoomRefPayload, ack: (res: Ack<null>) => void) => void;
  'cards:reset': (payload: RoomRefPayload, ack: (res: Ack<null>) => void) => void;
  'user:rename': (payload: RenamePayload, ack: (res: Ack<null>) => void) => void;
}

export type InterServerEvents = Record<string, never>;

export type SocketData = {
  userId: string | null;
  name: string;
  roomIds: Set<string>;
};
