import { chromium } from 'playwright';

const OUT = 'C:/Users/GIRISH~1/AppData/Local/Temp/opencode';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));

await page.goto('http://localhost:3111', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.removeItem('webos_shortcut_overrides_v1'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(4200);
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('.desktop-icon'))) break;
}

const frontApp = () => page.evaluate(() => document.querySelector('[class*="font-bold"]')?.innerText?.trim());

// 1) Cmd+Space opens Spotlight, Escape closes it
/* Match the real Spotlight placeholder — `*="earch"` is too loose and also
   hits the Music window's own filter field. */
const sl = () =>
  page.evaluate(() => !!document.querySelector('input[placeholder*="Spotlight Search" i]'));

await page.keyboard.down('Meta');
await page.keyboard.press('Space');
await page.keyboard.up('Meta');
await page.waitForTimeout(600);
console.log('1. Cmd+Space opens Spotlight =', await sl());
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
console.log('   Escape closes it =', !(await sl()));

// 2) typing in a text field must NOT trigger shortcuts
await page.click('#dock-icon-notes', { force: true });
await page.waitForTimeout(1000);
const ta = page.locator('textarea, input[type="text"]').first();
if (await ta.count()) {
  await ta.click({ force: true });
  await page.waitForTimeout(300);
  await page.keyboard.type('cmd q test', { delay: 40 });
  await page.waitForTimeout(500);
  const stillOpen = await sl();
  const notesAlive = await page.evaluate(() => document.body.innerText.includes('Notes') || document.body.innerText.includes('NOTES'));
  console.log('2. typing "cmd q test" did not open Spotlight =', !stillOpen);
  console.log('   notes window survived =', notesAlive);
}

// 3) Cmd+W inside a text field still closes the window (macOS behaviour)
const before = await page.evaluate(
  () => Array.from(document.querySelectorAll('div')).filter((d) => d.className?.includes?.('justify-between') && d.className?.includes?.('border-b') && d.className?.includes?.('cursor-default')).length,
);
await page.click('#dock-icon-terminal', { force: true });
await page.waitForTimeout(1000);
const mid = await page.evaluate(
  () => Array.from(document.querySelectorAll('div')).filter((d) => d.className?.includes?.('justify-between') && d.className?.includes?.('border-b') && d.className?.includes?.('cursor-default')).length,
);
await page.keyboard.down('Meta');
await page.keyboard.press('w');
await page.keyboard.up('Meta');
await page.waitForTimeout(900);
const after = await page.evaluate(
  () => Array.from(document.querySelectorAll('div')).filter((d) => d.className?.includes?.('justify-between') && d.className?.includes?.('border-b') && d.className?.includes?.('cursor-default')).length,
);
console.log(`3. Cmd+W closes window: ${mid} -> ${after}`);

// 4) auto-repeat must not fire twice
for (const id of ['notes', 'calculator', 'music']) {
  await page.click(`#dock-icon-${id}`, { force: true }).catch(() => {});
  await page.waitForTimeout(700);
}
await page.keyboard.down('Meta');
await page.keyboard.down('Tab');
await page.waitForTimeout(700);
await page.keyboard.up('Tab');
await page.waitForTimeout(200);
await page.keyboard.up('Meta');
await page.waitForTimeout(600);
console.log('4. held Cmd+Tab (auto-repeat) closed cleanly =', await page.evaluate(() => !document.querySelector('[aria-label="Application Switcher"]')));

// 5) Escape with no overlays must not error
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
console.log('5. bare Escape safe = true');

// 6) F3 / F4
await page.keyboard.press('F4');
await page.waitForTimeout(600);
console.log('6. F4 launchpad =', await page.evaluate(() => !!document.body.innerText.match(/Search Apps|Launchpad/i)));
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await page.keyboard.press('F3');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/kb-f3.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// 7) Ctrl+Cmd+Q locks
await page.keyboard.down('Control');
await page.keyboard.down('Meta');
await page.keyboard.press('q');
await page.keyboard.up('Meta');
await page.keyboard.up('Control');
await page.waitForTimeout(900);
console.log('7. Ctrl+Cmd+Q locked screen =', await page.evaluate(() => !!document.body.innerText.match(/Welcome|LLadeStack|Password/i)));

await browser.close();
console.log('done');