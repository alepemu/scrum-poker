import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Hides the label visually while keeping it for screen readers. */
  hideLabel?: boolean;
  error?: string | null;
  /** Marks the field wrong when the message is carried elsewhere, e.g. a toast. */
  invalid?: boolean;
};

export function TextField({
  label,
  hideLabel = false,
  error,
  invalid = false,
  className,
  id,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className={cn(
          'mb-2 block font-mono text-nano tracking-[0.06em] text-ink-muted uppercase',
          hideLabel && 'sr-only',
        )}
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error || invalid ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-11 w-full rounded-control border border-line bg-surface-raised px-3.5 text-body text-ink',
          'placeholder:text-ink-muted',
          'motion-safe:transition-colors motion-safe:duration-200',
          'focus:border-accent-450 focus:outline-none',
          (error || invalid) && 'border-warn-500',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-meta text-warn-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
