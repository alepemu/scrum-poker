import { useCallback, useEffect, useState } from 'react';
import type { RoomSummary } from '@poker/shared';
import { subscribeToRooms, unsubscribeFromRooms } from '../lib/api';
import { socket } from '../lib/socket';

export type RoomListResult = {
  rooms: RoomSummary[];
  loading: boolean;
  error: string | null;
};

/** Live list of open rooms, kept current while the lobby is on screen. */
export function useRoomList(): RoomListResult {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await subscribeToRooms();
    if (result.ok) {
      setRooms(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();

    // Re-subscribing on reconnect: socket.io rooms do not survive a new session.
    socket.on('connect', load);
    socket.on('rooms:updated', setRooms);

    return () => {
      socket.off('connect', load);
      socket.off('rooms:updated', setRooms);
      unsubscribeFromRooms();
    };
  }, [load]);

  return { rooms, loading, error };
}
