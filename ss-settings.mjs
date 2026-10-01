import { chromium } from 'playwright';

const OUT = 'C:/Users/GIRISH~1/AppData/Local/Temp/opencode';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));

await page.goto('http://localhost:3111', { waitUntil: 'networkidle' });
await page.waitForTimeout(4200);
for (let i = 0; i < 8; i++) {
  await page.mouse.click(720, 500);
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('.desktop-icon'))) break;
}
console.log('desktop =', await page.evaluate(() => !!document.querySelector('.desktop-icon')));

// Open Settings via the dock
const settings = page.locator('text=System Settings').first();
if (await settings.count()) { await settings.first().dblclick({ force: true }); }
await page.waitForTimeout(1400);

const pane = page.getByText('Screen Saver', { exact: true }).first();
console.log('pane link count =', await page.getByText('Screen Saver', { exact: true }).count());
await pane.click({ force: true }).catch((e) => console.log('pane click failed', e.message));
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/settings-saver.png` });

// toggle a style + open the delay dropdown
const ripple = page.getByRole('button', { name: /Ripple/ }).first();
if (await ripple.count()) await ripple.click({ force: true });
await page.waitForTimeout(500);
const stored = await page.evaluate(() => localStorage.getItem('webos_screen_saver_v1'));
console.log('persisted =', stored);

await browser.close();
console.log('done');
