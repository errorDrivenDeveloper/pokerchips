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
