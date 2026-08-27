import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@poker/shared';

export type PokerSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * No host argument on purpose: the socket connects to whatever origin served
 * the page, so the same build runs on localhost, a LAN IP or a private domain.
 */
export const socket: PokerSocket = io({
  autoConnect: true,
  transports: ['websocket', 'polling'],
});
