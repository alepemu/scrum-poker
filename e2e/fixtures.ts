import { expect, type BrowserContext, type Page } from '@playwright/test';

/*
 * Helpers shared by the specs. Everything here is about getting a browser to
 * the point where the interesting assertion can be made — the assertions
 * themselves stay in the spec that cares about them.
 */

/** The key `client/src/features/identity/identityStorage.ts` reads on boot. */
const IDENTITY_KEY = 'poker.identity.v1';

/**
 * Seats a context under a name before any page script runs, so the name prompt
 * never appears. Each context gets its own userId, which is what makes two
 * contexts two people rather than one person in two tabs.
 */
export async function seatAs(context: BrowserContext, name: string): Promise<void> {
  const userId = `e2e-${name.toLowerCase()}-${Math.random().toString(36).slice(2, 10)}`;

  await context.addInitScript(
    ([key, identity]) => {
      window.localStorage.setItem(key as string, identity as string);
    },
    [IDENTITY_KEY, JSON.stringify({ userId, name })] as const,
  );
}

/** Creates a room from the lobby and returns its id, once the room is on screen. */
export async function createRoom(page: Page, name: string): Promise<string> {
  await page.goto('/');
  await page.getByLabel('New room').fill(name);
  await page.getByRole('button', { name: 'Create room' }).click();

  await page.waitForURL(/\/room\/[a-z0-9]+$/);
  await expect(page.getByRole('heading', { name })).toBeVisible();

  const roomId = new URL(page.url()).pathname.split('/').pop();
  if (!roomId) throw new Error(`No room id in ${page.url()}`);
  return roomId;
}

/** Opens an existing room and waits until this viewer has a seat at the table. */
export async function openRoom(page: Page, roomId: string): Promise<void> {
  await page.goto(`/room/${roomId}`);
  await expect(page.getByTestId('seat').first()).toBeVisible();
}

/** Plays a card from the hand along the bottom. Labels come from `describeVote`. */
export async function play(page: Page, label: string): Promise<void> {
  await page
    .getByRole('group', { name: 'Your estimate' })
    .getByLabel(label, { exact: true })
    .click();
}

/**
 * Every socket.io frame this page has received, newest last.
 *
 * Must be called before the page navigates, or the handshake is missed. The
 * returned reader is how the reveal gate is checked at the wire rather than at
 * the DOM: a value that never arrives cannot be leaked by a future UI change.
 */
export function socketFrames(page: Page): () => string[] {
  const frames: string[] = [];

  page.on('websocket', (ws) => {
    ws.on('framereceived', (frame) => {
      if (typeof frame.payload === 'string') frames.push(frame.payload);
    });
  });

  return () => [...frames];
}

/**
 * Guards the absence assertions below. If the socket fell back to polling there
 * would be no frames at all, and "the vote never arrived" would pass for the
 * wrong reason.
 */
export async function expectRoomStateOverSocket(read: () => string[]): Promise<void> {
  await expect
    .poll(() => read().filter((frame) => frame.includes('room:state')).length, {
      message: 'no room:state frames captured — did the socket fall back to polling?',
    })
    .toBeGreaterThan(0);
}
