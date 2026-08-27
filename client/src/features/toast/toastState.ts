import type { Toast } from './toastContext';

/**
 * The list rules, kept pure so they can be tested without a DOM. The provider
 * owns the timers; everything about *which* toasts are on screen lives here.
 */

/** Older toasts fall off the bottom rather than letting the stack grow forever. */
export const MAX_TOASTS = 3;

/**
 * Adds a toast, or replaces the one already holding that id.
 *
 * Replacing in place is what keeps repeated events quiet: socket.io re-fires
 * `connect_error` on every retry, and a name can be committed twice (submit
 * then blur), so both reuse a stable id and overwrite instead of stacking.
 */
export function upsertToast(toasts: Toast[], toast: Toast): Toast[] {
  const index = toasts.findIndex((current) => current.id === toast.id);
  if (index !== -1) {
    const next = [...toasts];
    next[index] = toast;
    return next;
  }

  return [...toasts, toast].slice(-MAX_TOASTS);
}

export function dismissToast(toasts: Toast[], id: string): Toast[] {
  return toasts.filter((toast) => toast.id !== id);
}
