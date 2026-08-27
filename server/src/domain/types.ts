import type { RoomSettings, VoteCard } from '@poker/shared';

/** A seat at the table. `vote` never leaves this process before a reveal. */
export type Participant = {
  userId: string;
  name: string;
  vote: VoteCard | null;
  connected: boolean;
  /** Drives stable seat ordering. */
  joinedAt: number;
  /** When they went offline; null while connected. Powers the grace period. */
  disconnectedAt: number | null;
};

export type Room = {
  id: string;
  name: string;
  revealed: boolean;
  settings: RoomSettings;
  /** Keyed by userId, so a reconnect lands in the same seat with its vote. */
  participants: ReadonlyMap<string, Participant>;
  createdAt: number;
  lastActivityAt: number;
};
