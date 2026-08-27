import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Button } from './Button';
import { XIcon } from './icons';

export type ModalProps = {
  title: string;
  /** 'md' widens the panel for content that needs the room, like a card deck. */
  size?: 'sm' | 'md';
  onClose: () => void;
  children: ReactNode;
};

/**
 * A dismissible dialog. Deliberately separate from NamePrompt, which is a gate
 * that must not be escapable — this one closes on Escape, on the backdrop and
 * on its own close button.
 */
export function Modal({ title, size = 'sm', onClose, children }: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Focus the first control so the keyboard lands inside the dialog, not behind it.
  useEffect(() => {
    const focusable = panel.current?.querySelector<HTMLElement>(
      'input, select, textarea, button, [href]',
    );
    focusable?.focus();
  }, []);

  return (
    <div
      // A backdrop click closes; a click that started inside the panel does not.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'w-full rounded-panel border border-line bg-surface-deep p-7 shadow-raised motion-safe:animate-fade-up',
          size === 'md' ? 'max-w-lg' : 'max-w-sm',
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-title font-extrabold text-ink">
            {title}
          </h2>

          <Button
            variant="plain"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2"
          >
            <XIcon />
          </Button>
        </div>

        {children}
      </div>
    </div>
  );
}
