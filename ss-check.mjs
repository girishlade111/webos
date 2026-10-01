import { chromium } from 'playwright';

const OUT = 'C:/Users/GIRISH~1/AppData/Local/Temp/opencode/ss';

const browser = await chromium.launch();

const capture = async (variant, name, extraWait = 0) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text()); });
  page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));

  await page.goto('http://localhost:3111', { waitUntil: 'networkidle' });

  // Skip boot -> locked -> desktop
  await page.evaluate((v) => {
    localStorage.setItem('webos_screen_saver_v1', JSON.stringify({
      enabled: true, idleDelayMs: 300000, variant: v, showClock: true, lockOnWake: false,
    }));
  }, variant);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // force desktop
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('webos_settings') || '{}');
    localStorage.setItem('webos_settings', JSON.stringify(s));
  });
  await page.waitForTimeout(3500);
  // click through login if present
  for (let i = 0; i < 6; i++) {
    await page.mouse.click(720, 500);
    await page.waitForTimeout(900);
    const onDesktop = await page.evaluate(() => !!document.querySelector('.desktop-icon') || !!document.querySelector('[class*="fixed"][class*="bottom-0"]'));
    if (onDesktop) break;
  }

  const apple = page.locator('svg').first();
  await apple.click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  const item = page.getByText('Start Screen Saver', { exact: true });
  if (await item.count()) { await item.first().click({ force: true }); }
  await page.waitForTimeout(2600 + extraWait);

  await page.screenshot({ path: `${OUT}-${name}.png` });
  const visible = await page.locator('.ss-root').count();
  console.log(`${name}: ss-root mounted = ${visible}`);
  await ctx.close();
};

for (const [v, n] of [['logo','logo'],['aurora','aurora'],['starfield','starfield'],['ripple','ripple']]) {
  await capture(v, n);
}

await browser.close();
console.log('done');
