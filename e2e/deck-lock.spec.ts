import { expect, test } from '@playwright/test';
import { createRoom, play, seatAs } from './fixtures';

/*
 * `hasAnyVote` → `deckLocked` → a disabled fieldset is a three-layer chain that
 * no single test crosses. Changing the deck mid-round would move cards out from
 * under a vote already cast, so the UI has to hold the line.
 */
test('the deck is editable until someone votes, then frozen', async ({ browser }) => {
  const ada = await browser.newContext();
  await seatAs(ada, 'Ada');
  const page = await ada.newPage();

  await createRoom(page, 'Deck lock');

  const openSettings = () => page.getByRole('button', { name: 'Room settings' }).click();
  const dialog = page.getByRole('dialog');
  // Same labels as the hand, so the dialog scopes this away from the vote picker.
  const thirteen = dialog.getByLabel('13', { exact: true });

  await openSettings();
  await expect(thirteen).toBeEnabled();
  await expect(dialog.getByText('Everyone at the table votes with these.')).toBeVisible();

  // Add a card while it is still allowed, and check it reaches the hand.
  await thirteen.click();
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByRole('group', { name: 'Your estimate' }).getByLabel('13', { exact: true }),
  ).toBeVisible();

  await play(page, '13');

  await openSettings();
  await expect(thirteen).toBeDisabled();
  await expect(
    dialog.getByText('The round has started — reset it to change the deck.'),
  ).toBeVisible();

  await ada.close();
});
