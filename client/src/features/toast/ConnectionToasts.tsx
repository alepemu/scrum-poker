import { useConnectionToasts } from './useConnectionToasts';

/** Renders nothing: it exists so the socket listeners sit inside the provider. */
export function ConnectionToasts() {
  useConnectionToasts();
  return null;
}
