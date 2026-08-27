import { useState, type FormEvent } from 'react';
import { MAX_USER_NAME_LENGTH } from '@poker/shared';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useIdentity } from '../../hooks/useIdentity';

/**
 * Shown until the user has a name, over whatever they opened — home or a room
 * link someone shared. Nothing behind it has to cope with an anonymous seat.
 */
export function NamePrompt() {
  const { setName } = useIdentity();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) {
      setError('Please enter a name.');
      return;
    }
    setName(draft);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <form
        role="dialog"
        aria-modal="true"
        onSubmit={submit}
        className="w-full max-w-sm rounded-panel border border-line bg-surface-deep p-7 shadow-raised motion-safe:animate-fade-up"
      >
        <h1 className="text-title font-extrabold text-ink">What should we call you?</h1>
        <p className="mt-2 mb-6 text-body text-ink-muted">
          Your name shows on your card at the table. You can change it later from home.
        </p>

        <TextField
          label="Your name"
          hideLabel
          autoFocus
          value={draft}
          maxLength={MAX_USER_NAME_LENGTH}
          placeholder="e.g. Ada"
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          error={error}
        />

        <Button type="submit" className="mt-4 w-full" size="lg">
          Continue
        </Button>
      </form>
    </div>
  );
}
