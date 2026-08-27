import { expect, test } from '@playwright/test';
import { createRoom, openRoom, play, seatAs } from './fixtures';

/*
 * `joinRoom` treats a repeat join as a reconnect and keeps the seat, its vote
 * and its join time. A refresh is the way that actually happens in the wild,
 * and it is the one path a unit test cannot walk.
 */
test('a refresh keeps your seat and the card you played', async ({ browser }) => {
  const ada = await browser.newContext();
  const ben = await browser.newContext();
  await seatAs(ada, 'Ada');
  await seatAs(ben, 'Ben');

  const adaPage = await ada.newPage();
  const benPage = await ben.newPage();

  const roomId = await createRoom(adaPage, 'Reconnect');
  await openRoom(benPage, roomId);

  await play(adaPage, '3');
  await expect(benPage.getByText('1/2 voted')).toBeVisible();

  await adaPage.reload();

  // The seat is the same seat: still two people, and Ada is still one of them.
  await expect(adaPage.getByTestId('seat')).toHaveCount(2);
  await expect(benPage.getByTestId('seat')).toHaveCount(2);
  await expect(adaPage.getByText('Ada')).toBeVisible();

  // And the vote survived the round trip rather than being reset to nothing.
  await expect(adaPage.getByText('1/2 voted')).toBeVisible();

  await benPage.getByRole('button', { name: 'Reveal cards' }).click();
  await expect(benPage.getByLabel('Card: 3')).toBeVisible();

  await ada.close();
  await ben.close();
});
