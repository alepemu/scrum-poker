import { useEffect, useRef } from 'react';
import { useToast } from '../../hooks/useToast';
import { socket } from '../../lib/socket';

const CONNECTION_ID = 'connection';
/** How long a first connection may take before it is worth mentioning. */
const SLOW_CONNECT_MS = 1500;
const BACK_ONLINE_MS = 2500;

/**
 * Turns the socket lifecycle into toasts. Every one of them reuses a single id,
 * so a reconnect storm replaces one toast rather than stacking dozens.
 */
export function useConnectionToasts(): void {
  const { toast, dismiss } = useToast();
  const hasConnected = useRef(socket.connected);
  const showing = useRef(false);

  useEffect(() => {
    // The socket connects a few milliseconds after the page loads, so the first
    // attempt stays silent — announcing that gap would flash a warning at every
    // cold start, which is what the banner this replaced used to do.
    let grace: ReturnType<typeof setTimeout> | undefined = setTimeout(() => {
      grace = undefined;
      if (socket.connected) return;

      showing.current = true;
      toast({ id: CONNECTION_ID, variant: 'info', message: 'Connecting…', duration: null });
    }, SLOW_CONNECT_MS);

    const clearGrace = () => {
      clearTimeout(grace);
      grace = undefined;
    };

    const showOffline = () => {
      // A first attempt that has not yet outlived the grace period is left to
      // the timer above; only a dropped connection is worth saying immediately.
      if (!hasConnected.current && grace !== undefined) return;
      clearGrace();
      showing.current = true;

      const dropped = hasConnected.current;
      toast({
        id: CONNECTION_ID,
        variant: dropped ? 'info' : 'error',
        message: dropped ? 'Reconnecting…' : 'Can’t reach the server.',
        duration: null,
      });
    };

    const onConnect = () => {
      clearGrace();
      const dropped = hasConnected.current;
      hasConnected.current = true;

      if (dropped) {
        toast({
          id: CONNECTION_ID,
          variant: 'success',
          message: 'Back online',
          duration: BACK_ONLINE_MS,
        });
      } else if (showing.current) {
        // A first connection that was merely slow: the app coming to life is
        // the confirmation, so retract the notice rather than celebrating it.
        dismiss(CONNECTION_ID);
      }

      showing.current = false;
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', showOffline);
    socket.on('connect_error', showOffline);

    return () => {
      clearGrace();
      socket.off('connect', onConnect);
      socket.off('disconnect', showOffline);
      socket.off('connect_error', showOffline);
    };
  }, [toast, dismiss]);
}
