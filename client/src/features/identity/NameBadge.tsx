import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MAX_USER_NAME_LENGTH } from '@poker/shared';
import { EditIcon } from '../../components/ui/icons';
import { cn } from '../../lib/cn';
import { useIdentity } from '../../hooks/useIdentity';
import { useToast } from '../../hooks/useToast';

/**
 * The name, click to edit. Lives on the home screen only — rooms show your
 * name on your card and send you here to change it.
 */
export function NameBadge({ className }: { className?: string }) {
  const { identity, setName } = useIdentity();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(identity.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = (event?: FormEvent) => {
    event?.preventDefault();
    const next = draft.trim();

    if (next && next !== identity.name) {
      setName(next);
      // Submitting can be followed by a blur; a stable id collapses the pair.
      toast({ id: 'name', variant: 'success', message: `You are now ${next}.` });
    }

    setEditing(false);
  };

  const startEditing = () => {
    setDraft(identity.name);
    setEditing(true);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        title="Change your name"
        aria-label={`Change your name (${identity.name})`}
        className={cn(
          'flex h-11 max-w-52 cursor-pointer items-center gap-2.5 rounded-control border border-line px-3.5',
          'text-meta text-ink',
          'hover:border-accent-450 motion-safe:transition-colors motion-safe:duration-200',
          className,
        )}
      >
        <span className="truncate font-semibold">{identity.name}</span>
        <EditIcon size={14} className="shrink-0 text-ink-muted" />
      </button>
    );
  }

  return (
    <form onSubmit={commit} className={cn('flex items-center', className)}>
      <input
        ref={inputRef}
        value={draft}
        autoFocus
        maxLength={MAX_USER_NAME_LENGTH}
        aria-label="Your name"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setEditing(false);
        }}
        className="h-11 w-44 rounded-control border border-accent-450 bg-surface-raised px-3.5 text-body text-ink focus:outline-none"
      />
    </form>
  );
}
