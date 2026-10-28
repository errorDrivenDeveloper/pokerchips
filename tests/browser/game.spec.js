import { test, expect } from '@playwright/test';

async function startWithOriginalValues(page) {
 await page.getByLabel('Starting chips').fill('1000');
 await page.getByLabel('Small blind').fill('5');
 await page.getByLabel('Big blind').fill('10');
 await page.getByRole('button',{name:/Start the game/}).click();
}


test('a full hand, split payout, winner correction and reload', async ({page}) => {
 await page.goto('/poker/'); await expect(page.getByRole('heading',{name:/Bring everyone/})).toBeVisible();
 await startWithOriginalValues(page);
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
 await startWithOriginalValues(page);
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
 await startWithOriginalValues(page);
 await expect(page.getByRole('heading',{name:/Alex.*preflop/})).toBeVisible();
});

test('mobile actions are visible without scrolling', async ({ browser }) => {
 const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
 const page = await context.newPage();
 await page.goto('/');
 await startWithOriginalValues(page);
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
 await startWithOriginalValues(page);
 await expect(page.locator('.board-card.dealt')).toHaveCount(0);
 await page.getByRole('button',{name:'Call 10'}).click();
 await expect.poll(() => page.evaluate(() => window.chipAnimations)).toBe(1);
 await expect(page.locator('.pot')).toHaveText('25');
 await page.getByRole('button',{name:'Call 5'}).click();
 await page.getByRole('button',{name:'Check'}).click();
 await page.getByRole('button',{name:'flop revealed →'}).click();
 await expect(page.locator('.board-card.dealt')).toHaveCount(3);
 await expect(page.locator('.board-card.dealing')).toHaveCount(3);
 await expect(page.locator('.board-card.dealing').first()).toHaveCSS('animation-name', 'cinematic-deal');
 await expect(page.locator('.board-card.dealing').first()).toHaveCSS('animation-duration', '1.8s');
 await expect(page.locator('.board-card.dealing').nth(1)).toHaveCSS('animation-delay', '0.4s');
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
 await page.goto('/'); await startWithOriginalValues(page);
 await page.getByRole('button',{name:'Call 10'}).click();
 await expect(page.locator('.flying-chip')).toHaveCount(0);
 await page.getByRole('button',{name:'Call 5'}).click(); await page.getByRole('button',{name:'Check'}).click();
 await page.getByRole('button',{name:'flop revealed →'}).click();
 await expect(page.locator('.board-card.dealt')).toHaveCount(3);
 await expect(page.locator('.board-card.dealing').first()).toHaveCSS('animation-name','none');
});

test('pot chip stacks show exact denomination breakdown as bets change', async ({page}) => {
 await page.goto('/'); await startWithOriginalValues(page);
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
 await page.goto('/'); await startWithOriginalValues(page);
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
 await expect(page.locator('.confetti')).toHaveCount(64);
 await expect(page.locator('.win-celebration')).toHaveCSS('pointer-events', 'none');
 await expect(page.locator('[data-seat="0"] .stack')).toContainText('1005');
 await expect(page.locator('[data-seat="0"] .player-chips')).toHaveAttribute('aria-label', 'Alice stack breakdown: 1 gold 1000-chip, 1 red 5-chip');
 await page.getByRole('button',{name:'Edit winners'}).click();
 await expect(page.locator('[data-seat="0"] .stack')).toContainText('990');
});

test('reduced motion disables winner effects', async ({page}) => {
 await page.emulateMedia({ reducedMotion:'reduce' });
 await page.goto('/'); await startWithOriginalValues(page);
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
 await startWithOriginalValues(page);
 await expect(page.locator('#app-version')).toHaveText(expected);
 await page.reload();
 await expect(page.locator('#app-version')).toHaveText(expected);
});

test('four player landscape keeps seats and betting controls on screen', async ({browser}) => {
 const context = await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const page = await context.newPage();
 await page.goto('/');
 await page.getByRole('button',{name:'+ Add player'}).click();
 await page.getByRole('textbox',{name:'Player 4'}).fill('Dana');
 await startWithOriginalValues(page);
 for (const selector of ['[data-seat="0"]','[data-seat="1"]','[data-seat="2"]','[data-seat="3"]','.table','[data-action="fold"]','[data-action="call"]','#raise-form button']) {
  const box=await page.locator(selector).boundingBox();
  expect(box.y, selector).toBeGreaterThanOrEqual(0);
  expect(box.y+box.height, selector).toBeLessThanOrEqual(390);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/landscape-four-players.png'});
 await context.close();
});

test('four player desktop layout fits multiple landscape windows', async ({ browser }) => {
 for (const viewport of [{width:1366,height:768}, {width:1024,height:600}]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto('/'); await page.getByRole('button',{name:'+ Add player'}).click();
  await page.getByRole('textbox',{name:'Player 4'}).fill('Dana');
  await startWithOriginalValues(page);
  for(const selector of ['header','[data-seat="0"]','[data-seat="1"]','[data-seat="2"]','[data-seat="3"]','.table','[data-action="call"]','#raise-form button']) {
   const box=await page.locator(selector).boundingBox();
   expect(box.y, `${viewport.width} ${selector}`).toBeGreaterThanOrEqual(0);
   expect(box.y+box.height, `${viewport.width} ${selector}`).toBeLessThanOrEqual(viewport.height);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/desktop-${viewport.width}.png`});
  await context.close();
 }
});

test('phone controls prevent double-tap zoom while retaining pinch zoom', async ({ browser }) => {
 const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page = await context.newPage();
 await page.goto('/');
 const add = page.getByRole('button',{name:'+ Add player'});
 await expect(add).toHaveCSS('touch-action','manipulation');
 await add.tap(); await add.tap();
 expect(await page.evaluate(() => window.visualViewport.scale)).toBe(1);
 expect(await page.locator('meta[name="viewport"]').getAttribute('content')).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?(?:\s*,|$)/i);
 await expect(page.getByRole('textbox',{name:'Player 1'})).toHaveCSS('font-size','16px');
 await context.close();
});

test('new games default to 500 chips and 10/20 blinds', async ({page}) => {
 await page.goto('/');
 await expect(page.getByLabel('Starting chips')).toHaveValue('500');
 await expect(page.getByLabel('Small blind')).toHaveValue('10');
 await expect(page.getByLabel('Big blind')).toHaveValue('20');
 await page.getByRole('button',{name:/Start the game/}).click();
 await expect(page.locator('[data-seat="0"] .stack')).toContainText('500');
 await expect(page.locator('[data-seat="1"] .stack')).toContainText('490');
 await expect(page.locator('[data-seat="2"] .stack')).toContainText('480');
 await expect(page.locator('.pot')).toHaveText('30');
});

test('German language persists and translates the game without changing state', async ({page}) => {
 await page.goto('/');
 await page.getByRole('button',{name:'Sprache auf Deutsch wechseln'}).click();
 await expect(page.getByLabel('Startchips')).toHaveValue('500');
 await expect(page.getByLabel('Spieler 1')).toHaveValue('Alice');
 await page.getByRole('button',{name:/Spiel starten/}).click();
 await expect(page.getByText('AM ZUG')).toBeVisible();
 await expect(page.getByRole('button',{name:'Mitgehen 20'})).toBeVisible();
 await page.getByRole('button',{name:'Mitgehen 20'}).click();
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('lang','de');
 await expect(page.getByRole('button',{name:'Mitgehen 10'})).toBeVisible();
 await page.getByRole('button',{name:'Mitgehen 10'}).click();
 await page.getByRole('button',{name:'Schieben'}).click();
 await expect(page.getByRole('heading',{name:'Flop aufdecken'})).toBeVisible();
 await page.getByRole('button',{name:'Flop aufgedeckt →'}).click();
 await page.getByRole('button',{name:'Switch language to English'}).click();
 await expect(page.getByRole('button',{name:'Check'})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('lang','en');
});

test('German showdown and winner correction use translated controls', async ({page}) => {
 await page.goto('/'); await page.getByRole('button',{name:'Sprache auf Deutsch wechseln'}).click();
 await page.getByRole('button',{name:/Spiel starten/}).click();
 await page.getByRole('button',{name:'Mitgehen 20'}).click(); await page.getByRole('button',{name:'Mitgehen 10'}).click(); await page.getByRole('button',{name:'Schieben'}).click();
 for (const street of ['Flop','Turn','River']) {
  await page.getByRole('button',{name:`${street} aufgedeckt →`}).click();
  for(let i=0;i<3;i++) await page.getByRole('button',{name:'Schieben'}).click();
 }
 await expect(page.getByRole('heading',{name:'Wer hat gewonnen?'})).toBeVisible();
 await page.getByRole('button',{name:'Alice',exact:true}).click();
 await page.getByRole('button',{name:'Auszahlung bestätigen'}).click();
 await expect(page.getByText('Alice gewinnt 60')).toBeVisible();
 await page.getByRole('button',{name:'Gewinner ändern'}).click();
 await expect(page.getByRole('heading',{name:'Wer hat gewonnen?'})).toBeVisible();
 await page.getByRole('button',{name:'Auszahlung bestätigen'}).click();
 await expect(page.getByRole('button',{name:'Nächste Runde →'})).toBeVisible();
 await page.getByRole('button',{name:'Nächste Runde →'}).click();
 await expect(page.getByText('RUNDE 2', {exact:true})).toBeVisible();
});

test('German controls fit a phone landscape with four players', async ({ browser }) => {
 const context = await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const page = await context.newPage(); await page.goto('/');
 await page.getByRole('button',{name:'Sprache auf Deutsch wechseln'}).click();
 await page.getByRole('button',{name:'+ Spieler hinzufügen'}).click();
 await page.getByRole('textbox',{name:'Spieler 4'}).fill('Dana');
 await page.getByRole('button',{name:/Spiel starten/}).click();
 for (const selector of ['header','[data-seat="3"]','[data-action="fold"]','[data-action="call"]','#raise-form button']) {
  const box = await page.locator(selector).boundingBox();
  expect(box.y,selector).toBeGreaterThanOrEqual(0);
  expect(box.y+box.height,selector).toBeLessThanOrEqual(390);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await context.close();
});
