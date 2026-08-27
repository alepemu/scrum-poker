import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export type Toast = {
  /** Reusing an id replaces that toast instead of stacking a second one. */
  id: string;
  variant: ToastVariant;
  message: string;
  /** Milliseconds on screen, or null to stay until dismissed. */
  duration: number | null;
};

export type ToastOptions = Omit<Toast, 'id' | 'duration'> & {
  id?: string;
  duration?: number | null;
};

export type ToastContextValue = {
  /** Shows a toast and hands back its id, so a sticky one can be dismissed later. */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
