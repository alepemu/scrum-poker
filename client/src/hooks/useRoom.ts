import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RoomSettings, RoomState, VoteCard } from '@poker/shared';
import * as api from '../lib/api';
import { socket } from '../lib/socket';
import { useIdentity } from './useIdentity';
import { useToast } from './useToast';

export type RoomActions = {
  vote: (value: VoteCard | null) => void;
  reveal: () => void;
  reset: () => void;
  updateRoom: (name: string, settings: RoomSettings) => void;
};

export type RoomResult = {
  state: RoomState | null;
  /** Set when the room is gone, so the page can send the user back to the lobby. */
  closed: boolean;
  /** Why the room ended, for the closed screen. Action failures go to a toast. */
  error: string | null;
  actions: RoomActions;
};

/**
 * Owns the lifecycle of one seat at one table: join on mount, rejoin on
 * reconnect, leave on unmount, and keep the room state fresh in between.
 */
export function useRoom(roomId: string): RoomResult {
  const { identity, hasName } = useIdentity();
  const { toast } = useToast();
  const [state, setState] = useState<RoomState | null>(null);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read at join time rather than depended on: a rename is delivered by
  // `user:rename`, and re-joining here would drop the seat and its vote.
  const nameRef = useRef(identity.name);
  nameRef.current = identity.name;

  const { userId } = identity;

  useEffect(() => {
    if (!hasName) return;
    let cancelled = false;

    const join = async () => {
      const result = await api.joinRoom({ roomId, userId, name: nameRef.current });
      if (cancelled) return;

      if (result.ok) {
        setState(result.data);
        setError(null);
        setClosed(false);
      } else {
        setError(result.error);
        setClosed(true);
      }
    };

    const onState = (next: RoomState) => {
      if (next.id === roomId) setState(next);
    };

    const onClosed = (payload: { roomId: string }) => {
      if (payload.roomId === roomId) setClosed(true);
    };

    void join();
    socket.on('connect', join);
    socket.on('room:state', onState);
    socket.on('room:closed', onClosed);

    return () => {
      cancelled = true;
      socket.off('connect', join);
      socket.off('room:state', onState);
      socket.off('room:closed', onClosed);
      api.leaveRoom(roomId);
    };
  }, [roomId, userId, hasName]);

  const run = useCallback(
    async (call: Promise<{ ok: boolean; error?: string }>) => {
      const result = await call;
      if (result.ok) return;

      toast({
        id: 'room-action',
        variant: 'error',
        message: result.error ?? 'Something went wrong.',
      });
    },
    [toast],
  );

  const actions = useMemo<RoomActions>(
    () => ({
      vote: (value) => void run(api.castVote(roomId, value)),
      reveal: () => void run(api.revealCards(roomId)),
      reset: () => void run(api.resetCards(roomId)),
      updateRoom: (name, settings) => void run(api.updateRoom(roomId, name, settings)),
    }),
    [roomId, run],
  );

  return { state, closed, error, actions };
}
