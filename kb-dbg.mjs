import { chromium } from 'playwright';

const OUT = 'C:/Users/GIRISH~1/AppData/Local/Temp/opencode';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));
page.on('console', (m) => console.log('LOG:', m.type(), m.text().slice(0, 200)));

await page.goto('http://localhost:3111', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.removeItem('webos_shortcut_overrides_v1'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(4200);
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('.desktop-icon'))) break;
}

// open Settings
await page.evaluate(() => {
  const apple = Array.from(document.querySelectorAll('svg')).find((s) => s.getAttribute('viewBox') === '0 0 170 170');
  (apple?.closest('button') || apple?.parentElement)?.click();
});
await page.waitForTimeout(400);
await page.getByText('System Settings...', { exact: true }).first().click({ force: true });
await page.waitForTimeout(1400);
await page.getByText('Keyboard', { exact: true }).first().click({ force: true });
await page.waitForTimeout(900);

// Dump the chord buttons that exist
const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button[title="Click to change shortcut"]')).map((b) => ({
    title: b.getAttribute('title'),
    text: b.innerText.replace(/\n/g, ''),
  }));
});
console.log('chord buttons:', JSON.stringify(buttons.slice(0, 6), null, 1));

// click the FIRST chord button (should be Spotlight)
const target = page.locator('button[title="Click to change shortcut"]').first();
await target.click({ force: true });
await page.waitForTimeout(500);

const recordingActive = await page.evaluate(() =>
  !!Array.from(document.querySelectorAll('div')).find((d) => d.innerText?.trim() === 'Press keys…'),
);
console.log('recorder armed =', recordingActive);

// now press Alt+Shift+S
await page.keyboard.down('Alt');
await page.keyboard.down('Shift');
await page.keyboard.press('KeyS');
await page.keyboard.up('Shift');
await page.keyboard.up('Alt');
await page.waitForTimeout(800);

console.log('override =', await page.evaluate(() => localStorage.getItem('webos_shortcut_overrides_v1')));
await page.screenshot({ path: `${OUT}/kb-rebound.png` });

await browser.close();
console.log('done');