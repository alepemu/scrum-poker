import { useContext } from 'react';
import { IdentityContext, type IdentityContextValue } from '../features/identity/identityContext';

export function useIdentity(): IdentityContextValue {
  const value = useContext(IdentityContext);
  if (!value) throw new Error('useIdentity must be used inside <IdentityProvider>.');
  return value;
}
