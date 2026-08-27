import { expect, test } from '@playwright/test';
import {
  createRoom,
  expectRoomStateOverSocket,
  openRoom,
  play,
  seatAs,
  socketFrames,
} from './fixtures';

/*
 * The promise the whole app is built around: a vote stays on the server until
 * someone reveals. `projectRoom` is unit tested, but only two real browsers can
 * show that the value never reaches the other one.
 */
test('a vote reaches nobody else until the reveal', async ({ browser }) => {
  const ada = await browser.newContext();
  const ben = await browser.newContext();
  await seatAs(ada, 'Ada');
  await seatAs(ben, 'Ben');

  const adaPage = await ada.newPage();
  const benPage = await ben.newPage();

  // Attached before either page navigates, or the handshake frames are missed.
  const adaFrames = socketFrames(adaPage);
  const benFrames = socketFrames(benPage);

  const roomId = await createRoom(adaPage, 'Reveal gate');
  await openRoom(benPage, roomId);
  await expect(adaPage.getByTestId('seat')).toHaveCount(2);

  await play(adaPage, '5');

  // Ben sees that Ada has played — the count is public, the card is not.
  await expect(benPage.getByText('1/2 voted')).toBeVisible();

  // `PlayingCard` only carries an aria-label once the round is revealed, so on
  // Ben's screen there is no labelled card at all.
  await expect(benPage.getByLabel(/^Card:/)).toHaveCount(0);

  // The real assertion. Ben's socket must never have carried the value.
  await expectRoomStateOverSocket(benFrames);
  expect(benFrames().filter((frame) => frame.includes('"vote":5'))).toEqual([]);

  // The other half of the rule: Ada does see her own card before the reveal,
  // which is `projectRoomFor` layering her vote on top of the public state.
  await expectRoomStateOverSocket(adaFrames);
  await expect
    .poll(() => adaFrames().filter((frame) => frame.includes('"vote":5')).length)
    .toBeGreaterThan(0);

  await benPage.getByRole('button', { name: 'Reveal cards' }).click();

  // Now the value is allowed out, and both tables show it.
  await expect(benPage.getByLabel('Card: 5')).toBeVisible();
  await expect(adaPage.getByLabel('Card: 5')).toBeVisible();
  // Ben never voted, so his card turns over empty rather than showing a number.
  await expect(benPage.getByLabel('Card: no vote')).toBeVisible();

  await ada.close();
  await ben.close();
});

test('a new round takes the cards back off the table', async ({ browser }) => {
  const ada = await browser.newContext();
  await seatAs(ada, 'Ada');
  const page = await ada.newPage();

  await createRoom(page, 'Second round');
  await play(page, '5');
  await page.getByRole('button', { name: 'Reveal cards' }).click();
  await expect(page.getByLabel('Card: 5')).toBeVisible();

  await page.getByRole('button', { name: 'New round' }).click();

  await expect(page.getByLabel(/^Card:/)).toHaveCount(0);
  await expect(page.getByText('0/1 voted')).toBeVisible();

  await ada.close();
});
