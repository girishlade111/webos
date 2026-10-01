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

// Count how many elements match the Spotlight search input
const count = () =>
  page.evaluate(() => document.querySelectorAll('input[placeholder*="earch" i]').length);

await page.keyboard.down('Meta');
await page.keyboard.press('Space');
await page.keyboard.up('Meta');
await page.waitForTimeout(600);
console.log('inputs after open =', await count());

await page.keyboard.press('Escape');
await page.waitForTimeout(600);
console.log('inputs after Escape =', await count());

// Inspect the actual DOM node and its ancestors
console.log(
  await page.evaluate(() => {
    const el = document.querySelector('input[placeholder*="earch" i]');
    if (!el) return 'none';
    const chain = [];
    let n = el;
    for (let i = 0; i < 6 && n; i++) {
      chain.push(`${n.tagName}.${(n.className || '').toString().slice(0, 60)}`);
      n = n.parentElement;
    }
    return chain.join('\n  <- ');
  }),
);

// What does the menu bar say about spotlight state?
console.log(
  'overlay text sample =',
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('div')).filter((d) =>
      (d.className || '').toString().includes('z-[9000]'),
    );
    return els.map((e) => (e.textContent || '').slice(0, 80)).join(' || ');
  }),
);

await browser.close();