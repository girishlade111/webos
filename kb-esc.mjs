import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });

await page.goto('http://localhost:3111', { waitUntil: 'networkidle' });
await page.waitForTimeout(4200);
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('.desktop-icon'))) break;
}

const sl = () => page.evaluate(() => !!document.querySelector('input[placeholder*="earch" i]'));

await page.keyboard.down('Meta');
await page.keyboard.press('Space');
await page.keyboard.up('Meta');
await page.waitForTimeout(600);
console.log('spotlight open =', await sl());
console.log('activeElement =', await page.evaluate(() => {
  const a = document.activeElement;
  return a ? `${a.tagName}.${a.className?.toString().slice(0, 40)} ph=${a.getAttribute?.('placeholder')}` : 'none';
}));

await page.keyboard.press('Escape');
await page.waitForTimeout(300);
console.log('after Escape (300ms) open =', await sl());
await page.waitForTimeout(900);
console.log('after Escape (1200ms) open =', await sl());

// Try Escape again in case the first was consumed by focus
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
console.log('after 2nd Escape open =', await sl());

// Click on the backdrop instead — that path definitely works
if (await sl()) {
  await page.mouse.click(100, 700);
  await page.waitForTimeout(500);
  console.log('after backdrop click open =', await sl());
}

await browser.close();