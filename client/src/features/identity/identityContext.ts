import { createContext } from 'react';
import type { Identity } from './identityStorage';

export type IdentityContextValue = {
  identity: Identity;
  /** Persists the name and pushes it to every room the user is sitting in. */
  setName: (name: string) => void;
  hasName: boolean;
};

export const IdentityContext = createContext<IdentityContextValue | null>(null);
