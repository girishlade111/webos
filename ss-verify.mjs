import { chromium } from 'playwright';

const OUT = 'C:/Users/GIRISH~1/AppData/Local/Temp/opencode';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });

// Short idle delay so the automatic trigger can be exercised
await page.goto('http://localhost:3111', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('webos_screen_saver_v1', JSON.stringify({
    enabled: true, idleDelayMs: 3000, variant: 'logo', showClock: true, lockOnWake: false,
  }));
});
await page.reload({ waitUntil: 'networkidle' });

// Boot -> locked -> desktop, no mouse input at all after this point
await page.waitForTimeout(4000);
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  const on = await page.evaluate(() => !!document.querySelector('.ss-root'));
  if (on) break;
}
console.log('desktop reached, ss mounted =', await page.evaluate(() => !!document.querySelector('.ss-root')));

// Now go completely idle
await page.waitForTimeout(5200);
console.log('after 5.2s idle -> ss mounted =', await page.evaluate(() => !!document.querySelector('.ss-root')));
await page.screenshot({ path: `${OUT}/ss-idle-auto.png` });

// Sub-pixel jitter must NOT dismiss it (wait past the 650ms wake fade)
for (let i = 0; i < 6; i++) await page.mouse.move(640 + (i % 2), 400);
await page.waitForTimeout(1100);
console.log('after 1px jitter -> ss mounted =', await page.evaluate(() => !!document.querySelector('.ss-root')));

// Real movement dismisses
await page.mouse.move(640, 400);
await page.mouse.move(760, 520, { steps: 6 });
await page.waitForTimeout(1000);
console.log('after real movement -> ss mounted =', await page.evaluate(() => !!document.querySelector('.ss-root')));

// Countdown must re-arm, and firing again must work
await page.waitForTimeout(5200);
console.log('re-engaged -> ss mounted =', await page.evaluate(() => !!document.querySelector('.ss-root')));

// lockOnWake path
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('webos_screen_saver_v1'));
  localStorage.setItem('webos_screen_saver_v1', JSON.stringify({ ...raw, lockOnWake: true }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  if (await page.evaluate(() => !!document.querySelector('.ss-root'))) break;
}
await page.waitForTimeout(5200);
console.log('lockOnWake: ss mounted =', await page.evaluate(() => !!document.querySelector('.ss-root')));
await page.mouse.move(500, 300);
await page.mouse.move(700, 500, { steps: 5 });
await page.waitForTimeout(1400);
console.log('lockOnWake: after wake, ss mounted =', await page.evaluate(() => !!document.querySelector('.ss-root')));

// Leaving the desktop mid-saver must not strand the overlay
await page.evaluate(() => {
  localStorage.setItem('webos_screen_saver_v1', JSON.stringify({
    enabled: true, idleDelayMs: 2000, variant: 'logo', showClock: true, lockOnWake: false,
  }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
for (let i = 0; i < 8; i++) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  if (await page.evaluate(() => !!document.querySelector('.desktop-icon'))) break;
}
await page.waitForTimeout(4000);
console.log('saver up =', await page.evaluate(() => !!document.querySelector('.ss-root')));
// Apple menu -> Sleep
await page.evaluate(() => {
  const apple = Array.from(document.querySelectorAll('svg')).find((s) => s.getAttribute('viewBox') === '0 0 170 170');
  (apple.closest('button') || apple.parentElement)?.click();
});
await page.waitForTimeout(500);
const sleep = page.getByText('Sleep', { exact: true });
if (await sleep.count()) await sleep.first().click({ force: true });
await page.waitForTimeout(800);
console.log('after Sleep -> saver overlay gone =', await page.evaluate(() => !document.querySelector('.ss-root')));

await browser.close();
console.log('done');
