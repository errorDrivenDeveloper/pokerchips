import { test, expect } from '@playwright/test';

test('a full hand, split payout, winner correction and reload', async ({page}) => {
 await page.goto('/poker/'); await expect(page.getByRole('heading',{name:/Bring everyone/})).toBeVisible();
 await page.getByRole('button',{name:/Start the game/}).click();
 await expect(page.getByRole('heading',{name:/Alice.*preflop/})).toBeVisible();
 await page.getByRole('button',{name:'Call 10'}).click(); await page.getByRole('button',{name:'Call 5'}).click(); await page.getByRole('button',{name:'Check'}).click();
 for(const street of ['flop','turn','river']) { await expect(page.getByRole('heading',{name:`Reveal the ${street}`})).toBeVisible(); await page.getByRole('button',{name:`${street} revealed →`}).click(); for(let i=0;i<3;i++) await page.getByRole('button',{name:'Check'}).click(); }
 await expect(page.getByRole('heading',{name:'Who won?'})).toBeVisible();
 await page.getByRole('button',{name:'Alice',exact:true}).click(); await page.getByRole('button',{name:'Bob',exact:true}).click();
 await expect(page.getByText('Payout: Alice 15 · Bob 15')).toBeVisible(); await page.getByRole('button',{name:'Confirm payout'}).click();
 await page.reload(); await expect(page.getByText('Alice won 15 · Bob won 15')).toBeVisible();
 await page.getByRole('button',{name:'Edit winners'}).click(); await page.getByRole('button',{name:'Alice',exact:true}).click(); await page.getByRole('button',{name:'Confirm payout'}).click();
 await expect(page.getByText('Bob won 30')).toBeVisible(); await page.getByRole('button',{name:'Next hand →'}).click(); await expect(page.getByText('HAND 2')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('return to player and chip setup without accidental reset', async ({page}) => {
 await page.goto('/');
 await page.getByRole('button',{name:/Start the game/}).click();
 await page.getByRole('button',{name:/Players & chips/}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Cancel'}).click();
 await expect(page.getByRole('heading',{name:/Alice.*preflop/})).toBeVisible();
 await page.getByRole('button',{name:/Players & chips/}).click();
 await page.getByRole('button',{name:'Go to setup'}).click();
 await expect(page.getByRole('heading',{name:/Bring everyone/})).toBeVisible();
 await expect(page.getByLabel('Player 1')).toHaveValue('Alice');
 await page.getByLabel('Starting chips').fill('500');
 await page.getByLabel('Player 1').fill('Alex');
 await page.getByRole('button',{name:/Start the game/}).click();
 await expect(page.getByRole('heading',{name:/Alex.*preflop/})).toBeVisible();
});

test('mobile actions are visible without scrolling', async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
 const page = await context.newPage();
 await page.goto('/');
 await page.getByRole('button',{name:/Start the game/}).click();
 for (const label of ['Fold', 'Call 10', 'All in 1000', 'Raise']) {
   const button = page.getByRole('button', { name: label, exact: true });
   await expect(button).toBeVisible();
   const box = await button.boundingBox();
   expect(box.y).toBeGreaterThanOrEqual(0);
   expect(box.y + box.height).toBeLessThanOrEqual(844);
 }
 expect(await page.evaluate(() => window.scrollY)).toBe(0);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/mobile-actions.png', fullPage:true});
 await context.close();
});

test('bets move chips and reveals deal anonymous cards without changing game timing', async ({ page }) => {
 await page.goto('/');
 await page.addInitScript(() => { const original = Element.prototype.animate; Element.prototype.animate = function(...args) { if (this.classList.contains('flying-chip')) window.chipAnimations = (window.chipAnimations || 0) + 1; return original.apply(this, args); }; });
 await page.reload();
 await page.getByRole('button',{name:/Start the game/}).click();
 await expect(page.locator('.board-card.dealt')).toHaveCount(0);
 await page.getByRole('button',{name:'Call 10'}).click();
 await expect.poll(() => page.evaluate(() => window.chipAnimations)).toBe(1);
 await expect(page.locator('.pot')).toHaveText('25');
 await page.getByRole('button',{name:'Call 5'}).click();
 await page.getByRole('button',{name:'Check'}).click();
 await page.getByRole('button',{name:'flop revealed →'}).click();
 await expect(page.locator('.board-card.dealt')).toHaveCount(3);
 await expect(page.locator('.board-card.dealing')).toHaveCount(3);
 await page.getByRole('button',{name:/Undo last action/}).click();
 await expect(page.locator('.board-card.dealt')).toHaveCount(0);
 await page.getByRole('button',{name:'flop revealed →'}).click();
 for (let i=0;i<3;i++) await page.getByRole('button',{name:'Check'}).click();
 await page.getByRole('button',{name:'turn revealed →'}).click();
 await expect(page.locator('.board-card.dealt')).toHaveCount(4);
 await expect(page.locator('.board-card.dealing')).toHaveCount(1);
});

test('reduced motion skips chip movement and card animation', async ({ page }) => {
 await page.emulateMedia({ reducedMotion:'reduce' });
 await page.goto('/'); await page.getByRole('button',{name:/Start the game/}).click();
 await page.getByRole('button',{name:'Call 10'}).click();
 await expect(page.locator('.flying-chip')).toHaveCount(0);
 await page.getByRole('button',{name:'Call 5'}).click(); await page.getByRole('button',{name:'Check'}).click();
 await page.getByRole('button',{name:'flop revealed →'}).click();
 await expect(page.locator('.board-card.dealt')).toHaveCount(3);
 await expect(page.locator('.board-card.dealing').first()).toHaveCSS('animation-name','none');
});

test('pot chip stacks show exact denomination breakdown as bets change', async ({page}) => {
 await page.goto('/'); await page.getByRole('button',{name:/Start the game/}).click();
 const chips = page.locator('.felt .pot-chips');
 await expect(chips).toHaveAttribute('aria-label', 'Pot breakdown: 1 blue 10-chip, 1 red 5-chip');
 await expect(chips.locator('.chip-blue')).toHaveCount(1);
 await expect(chips.locator('.chip-red')).toHaveCount(1);
 await page.getByRole('button',{name:'Call 10'}).click();
 await expect(chips).toHaveAttribute('aria-label', 'Pot breakdown: 1 green 25-chip');
 await expect(chips.locator('.pot-chip-label')).toHaveText('1×25');
 await page.getByRole('button',{name:/Undo last action/}).click();
 await expect(chips).toHaveAttribute('aria-label', 'Pot breakdown: 1 blue 10-chip, 1 red 5-chip');
});

test('split winners receive animated chips and seats show current stack values', async ({page}) => {
 await page.addInitScript(() => {
  const original = Element.prototype.animate;
  Element.prototype.animate = function(...args) {
   if (this.classList.contains('payout-chip')) (window.payoutWinners ||= []).push(this.dataset.winner);
   return original.apply(this, args);
  };
 });
 await page.goto('/'); await page.getByRole('button',{name:/Start the game/}).click();
 await expect(page.locator('[data-seat="0"] .player-chips')).toHaveAttribute('aria-label', 'Alice stack breakdown: 1 gold 1000-chip');
 await page.getByRole('button',{name:'Call 10'}).click();
 await expect(page.locator('[data-seat="0"] .stack')).toContainText('990');
 await page.getByRole('button',{name:'Call 5'}).click(); await page.getByRole('button',{name:'Check'}).click();
 for (const street of ['flop','turn','river']) {
  await page.getByRole('button',{name:`${street} revealed →`}).click();
  for(let i=0;i<3;i++) await page.getByRole('button',{name:'Check'}).click();
 }
 await page.getByRole('button',{name:'Alice',exact:true}).click(); await page.getByRole('button',{name:'Bob',exact:true}).click();
 await page.getByRole('button',{name:'Confirm payout'}).click();
 expect(await page.evaluate(() => window.payoutWinners)).toEqual(['0','0','0','1','1','1']);
 await expect(page.locator('.win-banner')).toContainText('Alice +15 · Bob +15');
 await expect(page.locator('.confetti')).toHaveCount(32);
 await expect(page.locator('.win-celebration')).toHaveCSS('pointer-events', 'none');
 await expect(page.locator('[data-seat="0"] .stack')).toContainText('1005');
 await expect(page.locator('[data-seat="0"] .player-chips')).toHaveAttribute('aria-label', 'Alice stack breakdown: 1 gold 1000-chip, 1 red 5-chip');
 await page.getByRole('button',{name:'Edit winners'}).click();
 await expect(page.locator('[data-seat="0"] .stack')).toContainText('990');
});

test('reduced motion disables winner effects', async ({page}) => {
 await page.emulateMedia({ reducedMotion:'reduce' });
 await page.goto('/'); await page.getByRole('button',{name:/Start the game/}).click();
 await page.getByRole('button',{name:'Fold'}).click(); await page.getByRole('button',{name:'Fold'}).click();
 await page.getByRole('button',{name:'Confirm payout'}).click();
 await expect(page.locator('.payout-chip')).toHaveCount(0);
 await expect(page.locator('.celebrate-win')).toHaveCount(0);
 await expect(page.locator('.win-celebration')).toHaveCount(0);
 await expect(page.getByText('Cara won 10')).toBeVisible();
});

test('the displayed app version matches the files and remains visible during play', async ({ page }) => {
 const { execFileSync } = await import('node:child_process');
 const expected = execFileSync('node', ['scripts/version.js'], { encoding:'utf8' }).trim();
 await page.goto('/poker/');
 await expect(page.locator('#app-version')).toHaveText(expected);
 await page.getByRole('button',{name:/Start the game/}).click();
 await expect(page.locator('#app-version')).toHaveText(expected);
 await page.reload();
 await expect(page.locator('#app-version')).toHaveText(expected);
});
