import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));

await page.goto('http://localhost:3111', { waitUntil: 'networkidle' });
await page.waitForTimeout(4200);
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('.desktop-icon'))) break;
}

/* My earlier selector was too loose — `placeholder*="earch"` also matched the
   Music window's own filter field. Match the real Spotlight placeholder. */
const sl = () =>
  page.evaluate(
    () =>
      !!document.querySelector(
        'input[placeholder*="Spotlight Search" i]',
      ),
  );

console.log('baseline =', await sl());

await page.keyboard.down('Meta');
await page.keyboard.press('Space');
await page.keyboard.up('Meta');
await page.waitForTimeout(600);
console.log('after Cmd+Space =', await sl());

await page.keyboard.press('Escape');
await page.waitForTimeout(600);
console.log('after Escape =', await sl());

// Reopen, then typing must not re-trigger anything and must stay open
await page.keyboard.down('Meta');
await page.keyboard.press('Space');
await page.keyboard.up('Meta');
await page.waitForTimeout(500);
await page.keyboard.type('terminal', { delay: 50 });
await page.waitForTimeout(400);
console.log('still open after typing =', await sl());
console.log('typed value =', await page.evaluate(() => document.querySelector('input[placeholder*="Spotlight Search" i]')?.value));
await page.keyboard.press('Enter');
await page.waitForTimeout(900);
console.log('Enter launched + closed =', !(await sl()));

await browser.close();