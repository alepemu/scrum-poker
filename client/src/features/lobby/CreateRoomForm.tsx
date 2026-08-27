import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { MAX_ROOM_NAME_LENGTH } from '@poker/shared';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useToast } from '../../hooks/useToast';
import { createRoom } from '../../lib/api';

export function CreateRoomForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    const result = await createRoom(name);
    setPending(false);

    if (!result.ok) {
      setInvalid(true);
      toast({ id: 'create-room', variant: 'error', message: result.error });
      return;
    }

    // The provider sits above the routes, so this survives the navigation and
    // lands on the room it is announcing.
    toast({ variant: 'success', message: `${result.data.name} is ready.` });
    void navigate(`/room/${result.data.id}`);
  };

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-3 rounded-panel border border-line bg-surface-raised p-5 sm:flex-row sm:items-end"
    >
      <TextField
        label="New room"
        value={name}
        maxLength={MAX_ROOM_NAME_LENGTH}
        placeholder="Sprint 42 estimation"
        onChange={(event) => {
          setName(event.target.value);
          setInvalid(false);
        }}
        invalid={invalid}
      />
      <Button type="submit" disabled={pending} className="sm:mb-0 sm:w-auto">
        {pending ? 'Creating…' : 'Create room'}
      </Button>
    </form>
  );
}
