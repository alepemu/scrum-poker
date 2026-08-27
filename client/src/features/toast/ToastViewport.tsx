import { AlertIcon, CheckIcon, XIcon } from '../../components/ui/icons';
import { cn } from '../../lib/cn';
import type { Toast, ToastVariant } from './toastContext';

/** Colour and glyph per variant; the surface itself stays the panel grey. */
const VARIANTS: Record<ToastVariant, { accent: string; Icon: typeof CheckIcon }> = {
  success: { accent: 'text-ok-500', Icon: CheckIcon },
  error: { accent: 'text-warn-500', Icon: AlertIcon },
  info: { accent: 'text-ink-soft', Icon: AlertIcon },
};

export type ToastViewportProps = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

/**
 * The stack, pinned top-right above every overlay in the app: the name prompt
 * and the preview panel both sit at z-50.
 */
export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-80 flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { accent, Icon } = VARIANTS[toast.variant];

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex items-start gap-2.5 rounded-panel border border-line bg-surface-deep py-2.5 pr-2 pl-3',
        'text-meta text-ink shadow-raised',
        'motion-safe:animate-toast-in',
      )}
    >
      <Icon size={16} className={cn('mt-0.5 shrink-0', accent)} />
      <p className="min-w-0 flex-1 break-words">{toast.message}</p>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="-mt-0.5 shrink-0 cursor-pointer rounded-control p-1 text-ink-muted hover:text-ink motion-safe:transition-colors motion-safe:duration-200"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}
