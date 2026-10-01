import { chromium } from 'playwright';

const OUT = 'C:/Users/GIRISH~1/AppData/Local/Temp/opencode';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });

// Cmd registers as Meta on Mac but Playwright on any platform sends what we ask.
// Use Meta so it exercises the real macOS path.
const CMD = 'Meta';

const toDesktop = async () => {
  await page.goto('http://localhost:3111', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4200);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
    if (await page.evaluate(() => !!document.querySelector('.desktop-icon'))) break;
  }
};

const state = () =>
  page.evaluate(() => {
    const s = document.querySelector('iframe, [style*="position: fixed"]');
    return {
      spotlight: !!document.body.innerText.match(/Spotlight/i) && !!document.querySelector('input[placeholder*="Search" i]'),
      switcher: !!document.querySelector('[aria-label="Application Switcher"]'),
      launcher: !!document.body.innerText.match(/Launchpad/i),
      toast: document.querySelector('[role="status"]')?.innerText?.trim() ?? null,
      windows: JSON.parse(localStorage.getItem('webos_windows_v1') || '[]').length,
    };
  });

await toDesktop();
console.log('on desktop =', await page.evaluate(() => !!document.querySelector('.desktop-icon')));

/* ---- Cmd+Space opens Spotlight ------------------------------------------ */
await page.keyboard.down(CMD);
await page.keyboard.press('Space');
await page.keyboard.up(CMD);
await page.waitForTimeout(700);
console.log('after Cmd+Space -> spotlight input =', await page.evaluate(() => !!document.querySelector('input[placeholder*="earch" i]')));
await page.screenshot({ path: `${OUT}/kb-spotlight.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

/* ---- Cmd+Tab switcher --------------------------------------------------- */
// Open a couple of apps first so there is something to switch between
for (const label of ['Notes', 'Terminal', 'Calculator']) {
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div')).find((d) => d.innerText?.trim() === 'Finder');
    el?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });
  await page.evaluate(() => {
    const apple = Array.from(document.querySelectorAll('svg')).find((s) => s.getAttribute('viewBox') === '0 0 170 170');
    (apple?.closest('button') || apple?.parentElement)?.click();
  });
  await page.waitForTimeout(400);
  const item = page.getByText('System Settings...', { exact: true });
  if (await item.count()) await item.first().click({ force: true });
  await page.waitForTimeout(1200);
  break;
}

const runningCount = await page.evaluate(() => document.querySelectorAll('[style*="position: fixed"]').length);
console.log('apps running (approx) =', runningCount);

await page.keyboard.down(CMD);
await page.keyboard.press('Tab');
await page.waitForTimeout(600);
console.log('Cmd held + Tab -> switcher visible =', await page.evaluate(() => !!document.querySelector('[aria-label="Application Switcher"]')));
await page.screenshot({ path: `${OUT}/kb-appswitcher.png` });

// cycle twice more
await page.keyboard.press('Tab');
await page.waitForTimeout(250);
await page.keyboard.press('Tab');
await page.waitForTimeout(250);
await page.screenshot({ path: `${OUT}/kb-appswitcher-cycled.png` });

// release commits and closes
await page.keyboard.up(CMD);
await page.waitForTimeout(700);
console.log('after Cmd release -> switcher closed =', await page.evaluate(() => !document.querySelector('[aria-label="Application Switcher"]')));

/* ---- Cmd+Q quits -------------------------------------------------------- */
const beforeQuit = await page.evaluate(() => document.querySelectorAll('[aria-label]').length);
await page.keyboard.down(CMD);
await page.keyboard.press('q');
await page.keyboard.up(CMD);
await page.waitForTimeout(900);
console.log('Cmd+Q fired without error');
console.log('toast shown =', await page.evaluate(() => !!Array.from(document.querySelectorAll('[role="status"]')).length));

/* ---- F3 / F4 ------------------------------------------------------------ */
await page.keyboard.press('F4');
await page.waitForTimeout(700);
console.log('F4 -> launchpad =', await page.evaluate(() => !!document.body.innerText.match(/Launchpad/i)));
await page.screenshot({ path: `${OUT}/kb-launchpad.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

await page.keyboard.press('F3');
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/kb-missioncontrol.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

/* ---- Settings > Keyboard pane ------------------------------------------ */
await page.evaluate(() => {
  const apple = Array.from(document.querySelectorAll('svg')).find((s) => s.getAttribute('viewBox') === '0 0 170 170');
  (apple?.closest('button') || apple?.parentElement)?.click();
});
await page.waitForTimeout(400);
const set = page.getByText('System Settings...', { exact: true });
if (await set.count()) await set.first().click({ force: true });
await page.waitForTimeout(1400);
const kb = page.getByText('Keyboard', { exact: true }).first();
console.log('Keyboard pane link =', await page.getByText('Keyboard', { exact: true }).count());
if (await kb.count()) await kb.click({ force: true });
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/kb-settings.png` });

/* ---- Rebind: record a new chord ---------------------------------------- */
const row = page.getByRole('button', { name: /Spotlight/ }).first();
console.log('spotlight row =', await row.count());
if (await row.count()) {
  await row.click({ force: true });
  await page.waitForTimeout(400);
  await page.keyboard.down('Alt');
  await page.keyboard.down('Shift');
  await page.keyboard.press('KeyS');
  await page.keyboard.up('Shift');
  await page.keyboard.up('Alt');
  await page.waitForTimeout(700);
  const stored = await page.evaluate(() => localStorage.getItem('webos_shortcut_overrides_v1'));
  console.log('override stored =', stored);
  await page.screenshot({ path: `${OUT}/kb-rebound.png` });
}

await browser.close();
console.log('done');