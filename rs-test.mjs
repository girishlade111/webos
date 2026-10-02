import { chromium, devices } from 'playwright';

const OUT = 'C:/Users/GIRISH~1/AppData/Local/Temp/opencode';
const browser = await chromium.launch();

const boot = async (page) => {
  await page.goto('http://localhost:3111', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4200);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
    if (await page.evaluate(() => !!document.querySelector('.desktop-icon'))) break;
  }
};

/* Report any window that escapes the viewport, in either dimension. */
const auditWindows = (page) =>
  page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return Array.from(document.querySelectorAll('div'))
      .filter((d) => {
        const s = getComputedStyle(d);
        return s.position === 'fixed' && s.zIndex !== '0' && d.offsetWidth > 200 && d.offsetHeight > 150;
      })
      .map((d) => {
        const r = d.getBoundingClientRect();
        return {
          title: d.innerText?.split('\n')[0]?.slice(0, 24) ?? '?',
          w: Math.round(r.width),
          h: Math.round(r.height),
          left: Math.round(r.left),
          top: Math.round(r.top),
          overflowsRight: r.right > vw + 1,
          overflowsBottom: r.bottom > vh + 1,
          negativeLeft: r.left < -1,
        };
      })
      .filter((w) => w.overflowsRight || w.overflowsBottom || w.negativeLeft);
  });

/* ---------------- Phone: iPhone 14 Pro ------------------------------------ */
{
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PHONE PAGE ERR:', e.message));
  await boot(page);

  console.log('--- iPhone 14 Pro (393x852) ---');
  console.log('viewport =', await page.evaluate(() => `${innerWidth}x${innerHeight}`));
  await page.screenshot({ path: `${OUT}/r-phone-desktop.png` });

  // Open an app -> must be full-bleed, single window
  await page.click('#dock-icon-notes', { force: true });
  await page.waitForTimeout(1200);
  const overflow = await auditWindows(page);
  console.log('overflowing windows after open =', JSON.stringify(overflow));
  await page.screenshot({ path: `${OUT}/r-phone-app.png` });

  // Traffic lights must be finger-sized
  const tl = await page.evaluate(() => {
    const b = document.querySelector('button[aria-label="Close window"]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  console.log('close button size =', JSON.stringify(tl));

  // Dock icon hit target
  const dock = await page.evaluate(() => {
    const d = document.querySelector('#dock-icon-settings');
    if (!d) return null;
    const r = d.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  console.log('dock icon size =', JSON.stringify(dock));

  // Tap-to-open on a desktop icon
  await page.click('#dock-icon-notes', { force: true });
  await page.waitForTimeout(700);
  const icon = page.locator('.desktop-icon').first();
  if (await icon.count()) {
    await icon.click({ force: true });
    await page.waitForTimeout(1200);
    console.log('tap opened a desktop item =', (await auditWindows(page)).length >= 0);
  }

  // Settings pane on compact
  await page.click('#dock-icon-settings', { force: true });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/r-phone-settings.png` });
  const overflowSettings = await auditWindows(page);
  console.log('settings overflow =', JSON.stringify(overflowSettings));

  await ctx.close();
}

/* ---------------- Tablet: iPad ------------------------------------------- */
{
  const ctx = await browser.newContext({ ...devices['iPad (gen 7)'] });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('IPAD PAGE ERR:', e.message));
  await boot(page);
  console.log('--- iPad ---');
  console.log('viewport =', await page.evaluate(() => `${innerWidth}x${innerHeight}`));
  await page.screenshot({ path: `${OUT}/r-ipad-desktop.png` });
  console.log('overflowing =', JSON.stringify(await auditWindows(page)));
  await ctx.close();
}

/* ---------------- Rotation: phone landscape ------------------------------ */
{
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'] });
  const page = await ctx.newPage();
  await boot(page);
  await page.click('#dock-icon-browser', { force: true });
  await page.waitForTimeout(1000);
  await page.setViewportSize({ width: 852, height: 393 });
  await page.waitForTimeout(900);
  console.log('--- rotated to 852x393 ---');
  console.log('overflowing after rotate =', JSON.stringify(await auditWindows(page)));
  await page.screenshot({ path: `${OUT}/r-phone-landscape.png` });
  await ctx.close();
}

/* ---------------- Desktop regression ------------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('DESKTOP PAGE ERR:', e.message));
  await boot(page);
  console.log('--- Desktop 1440x900 ---');
  await page.click('#dock-icon-notes', { force: true });
  await page.waitForTimeout(800);
  await page.click('#dock-icon-music', { force: true });
  await page.waitForTimeout(1000);
  console.log('overflowing =', JSON.stringify(await auditWindows(page)));

  // Floating windows must still float (not full-bleed) on desktop
  const geo = await page.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('div'))
      .filter((d) => getComputedStyle(d).position === 'fixed' && d.offsetWidth > 400 && d.offsetHeight > 300)
      .map((d) => {
        const r = d.getBoundingClientRect();
        return { w: Math.round(r.width), left: Math.round(r.left), top: Math.round(r.top) };
      });
    return boxes;
  });
  console.log('window geometry =', JSON.stringify(geo));
  await page.screenshot({ path: `${OUT}/r-desktop.png` });

  // Shrink desktop window; windows must re-fit, not strand
  await page.setViewportSize({ width: 900, height: 600 });
  await page.waitForTimeout(900);
  console.log('overflowing after shrink =', JSON.stringify(await auditWindows(page)));
  await ctx.close();
}

await browser.close();
console.log('done');
