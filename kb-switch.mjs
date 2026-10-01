import { chromium } from 'playwright';

const OUT = 'C:/Users/GIRISH~1/AppData/Local/Temp/opencode';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));

await page.goto('http://localhost:3111', { waitUntil: 'networkidle' });
await page.waitForTimeout(4200);
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('.desktop-icon'))) break;
}

// Launch several apps from the dock so the switcher has a full row
const dockNames = ['Notes', 'Terminal', 'Calculator', 'Music', 'Photos', 'Clock'];
for (const name of dockNames) {
  const el = page.locator(`text="${name}"`).last();
  if (await el.count()) {
    await el.dblclick({ force: true }).catch(() => {});
    await page.waitForTimeout(900);
  }
}
const running = await page.evaluate(() => {
  const raw = localStorage.getItem('webos_windows_v1');
  return raw ? JSON.parse(raw).length : 0;
});
console.log('windows open =', running);

// Cmd+Tab, hold, capture mid-switcher
await page.keyboard.down('Meta');
await page.keyboard.press('Tab');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/kb-switch-1.png` });
await page.keyboard.press('Tab');
await page.keyboard.press('Tab');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/kb-switch-3.png` });

// reverse with Cmd+Shift+Tab
await page.keyboard.down('Shift');
await page.keyboard.press('Tab');
await page.keyboard.up('Shift');
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/kb-switch-reverse.png` });

const title = await page.evaluate(
  () => document.querySelector('[aria-label="Application Switcher"]')?.innerText.replace(/\n/g, ' | '),
);
console.log('switcher content =', title);

await page.keyboard.up('Meta');
await page.waitForTimeout(600);
console.log('closed on release =', await page.evaluate(() => !document.querySelector('[aria-label="Application Switcher"]')));

// Cmd+Q should quit the frontmost app
const before = await page.evaluate(() => JSON.parse(localStorage.getItem('webos_windows_v1') || '[]').length);
await page.keyboard.down('Meta');
await page.keyboard.press('q');
await page.keyboard.up('Meta');
await page.waitForTimeout(900);
const after = await page.evaluate(() => JSON.parse(localStorage.getItem('webos_windows_v1') || '[]').length);
console.log(`Cmd+Q: windows ${before} -> ${after}`);

// Cmd+W closes just the focused window
const wBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('webos_windows_v1') || '[]').length);
await page.keyboard.down('Meta');
await page.keyboard.press('w');
await page.keyboard.up('Meta');
await page.waitForTimeout(900);
const wAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('webos_windows_v1') || '[]').length);
console.log(`Cmd+W: windows ${wBefore} -> ${wAfter}`);

// Cmd+` cycles windows
await page.keyboard.down('Meta');
await page.keyboard.press('Backquote');
await page.keyboard.up('Meta');
await page.waitForTimeout(600);
console.log('Cmd+` did not error');

// Cmd+, opens settings
await page.keyboard.down('Meta');
await page.keyboard.press('Comma');
await page.keyboard.up('Meta');
await page.waitForTimeout(1200);
const settingsFront = await page.evaluate(() => document.body.innerText.includes('Appearance') || document.body.innerText.includes('Keyboard Shortcuts'));
console.log('Cmd+, opened Settings =', settingsFront);

// Cmd+M minimizes
const mBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('webos_windows_v1') || '[]').filter((w) => w.isMinimized).length);
await page.keyboard.down('Meta');
await page.keyboard.press('m');
await page.keyboard.up('Meta');
await page.waitForTimeout(900);
const mAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('webos_windows_v1') || '[]').filter((w) => w.isMinimized).length);
console.log(`Cmd+M: minimized ${mBefore} -> ${mAfter}`);

await browser.close();
console.log('done');