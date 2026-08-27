import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { MAX_USER_NAME_LENGTH } from '@poker/shared';
import { useToast } from '../../hooks/useToast';
import { renameUser } from '../../lib/api';
import { IdentityContext, type IdentityContextValue } from './identityContext';
import { readIdentity, writeIdentity, type Identity } from './identityStorage';

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity>(readIdentity);
  const { toast } = useToast();

  const setName = useCallback(
    (rawName: string) => {
      const name = rawName.trim().slice(0, MAX_USER_NAME_LENGTH);
      if (!name) return;

      setIdentity((current) => {
        const updated = { ...current, name };
        writeIdentity(updated);
        return updated;
      });

      // The server carries the new name into every room this socket is in. The
      // local save above already stands, so a failure here means the name is
      // right on this device and stale on the table — worth saying out loud.
      void renameUser(name).then((result) => {
        if (result.ok) return;
        toast({
          id: 'rename',
          variant: 'error',
          message: 'Saved on this device, but the table did not get your new name.',
        });
      });
    },
    [toast],
  );

  const value = useMemo<IdentityContextValue>(
    () => ({ identity, setName, hasName: identity.name.length > 0 }),
    [identity, setName],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}
