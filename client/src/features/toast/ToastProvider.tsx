import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ToastContext,
  type Toast,
  type ToastContextValue,
  type ToastOptions,
} from './toastContext';
import { dismissToast, upsertToast } from './toastState';
import { ToastViewport } from './ToastViewport';

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // One timer per toast id. Replacing a toast replaces its timer, so a sticky
  // toast that overwrites a timed one never inherits the old countdown.
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer === undefined) return;
    clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((current) => dismissToast(current, id));
    },
    [clearTimer],
  );

  const toast = useCallback(
    ({ id, duration = DEFAULT_DURATION, ...rest }: ToastOptions) => {
      const toastId = id ?? `toast-${(nextId.current += 1)}`;
      const next: Toast = { id: toastId, duration, ...rest };

      clearTimer(toastId);
      setToasts((current) => upsertToast(current, next));

      if (duration !== null) {
        timers.current.set(
          toastId,
          setTimeout(() => dismiss(toastId), duration),
        );
      }

      return toastId;
    },
    [clearTimer, dismiss],
  );

  // Capture the map itself: `timers.current` would be re-read at unmount, and
  // the ref is stable anyway.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
