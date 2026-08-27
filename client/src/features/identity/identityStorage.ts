export type Identity = {
  /** Stable across visits: it is what keeps your seat through a refresh. */
  userId: string;
  name: string;
};

const STORAGE_KEY = 'poker.identity.v1';

/**
 * `crypto.randomUUID` is only available in secure contexts, and this app is
 * expected to be reached over plain http on a LAN, so it needs a fallback.
 */
function generateUserId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readIdentity(): Identity {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof (parsed as Identity).userId === 'string' &&
        typeof (parsed as Identity).name === 'string'
      ) {
        return parsed as Identity;
      }
    }
  } catch {
    // Private browsing or blocked storage: fall through to a fresh identity.
  }
  return { userId: generateUserId(), name: '' };
}

export function writeIdentity(identity: Identity): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Not being able to remember the name is survivable; carry on.
  }
}
