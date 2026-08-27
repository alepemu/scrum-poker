import { useIdentity } from '../../hooks/useIdentity';
import { NamePrompt } from './NamePrompt';

/** Renders the name prompt over the app until the user has picked a name. */
export function NameGate() {
  const { hasName } = useIdentity();
  return hasName ? null : <NamePrompt />;
}
