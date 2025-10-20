import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TIMEOUT = 15000;

function abs(p: string) { return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p); }

export async function seedStorage(storagePath: string, chromePath?: string) {
  const CHROME = chromePath || process.env.CHROME_PATH || undefined;
  const STORAGE = abs(storagePath);
  const userDataDir = path.join(path.dirname(STORAGE), 'seed-profile');

  await fs.promises.mkdir(path.dirname(STORAGE), { recursive: true });
  await fs.promises.mkdir(userDataDir, { recursive: true });

  // Use a persistent context for seeding so profile files are equivalent to manual run
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: CHROME,
    viewport: { width: 1280, height: 800 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--no-first-run', '--no-default-browser-check']
  });

  try {
    const page = await context.newPage();
    console.log('Navigating to tui.co.uk (seeder)...');
    await page.goto('https://www.tui.co.uk/', { waitUntil: 'networkidle', timeout: TIMEOUT });

    // helper: try click selector on page and on all frames
    async function clickInAllFrames(selector: string) {
      try {
        const el = page.locator(selector).first();
        if (await el.count()) { await el.click({ timeout: 2000 }).catch(() => {}); return true; }
      } catch {}
      for (const frame of page.frames()) {
        try {
          const handle = await frame.$(selector);
          if (handle) { await handle.click({ timeout: 2000 }).catch(() => {}); return true; }
        } catch {}
      }
      return false;
    }

    // Try common cookie buttons (main frame + iframes)
    const cookieSelectors = [
      '#cmCloseBanner',
      'button:has-text("Accept all")',
      'button:has-text("Accept")',
      'button:has-text("Allow all")',
      'button:has-text("Allow")',
      'button:has-text("Got it")',
      'button[aria-label*="accept"]'
    ];
    for (const sel of cookieSelectors) {
      const ok = await clickInAllFrames(sel);
      if (ok) { console.log('Clicked cookie selector:', sel); await page.waitForTimeout(700); break; }
    }

    // Minimal interactions to get server-issued session cookies
    try {
      const dep = page.getByTestId('input_departure-airport').first();
      if (await dep.count()) {
        await dep.click().catch(() => {});
        await page.waitForTimeout(300);
        const he = page.getByText('London Heathrow').first();
        if (await he.count()) {
          await he.click().catch(() => {});
        } else {
          await dep.fill('London').catch(() => {});
          await page.keyboard.press('Enter').catch(() => {});
        }
      }
    } catch (e: any) { console.log('Departure set failed (ignored):', e.message); }

    try {
      const dest = page.getByTestId('input_destinations-airport').first();
      if (await dest.count()) {
        await dest.click().catch(() => {});
        await dest.fill('PMI').catch(() => {});
        await page.waitForTimeout(900);
        const sugg = page.locator('ul[role="listbox"] li, .suggestions li').first();
        if (await sugg.count()) await sugg.click().catch(() => {});
        else await page.keyboard.press('Enter').catch(() => {});
      } else {
        await page.fill('input[name*=destination], input[name*=dest]', 'PMI').catch(() => {});
      }
    } catch (e: any) { console.log('Destination set failed (ignored):', e.message); }

    try {
      const dateInput = page.locator('input[name="departDate"], [data-testid*="date"]').first();
      if (await dateInput.count()) {
        await dateInput.click().catch(() => {});
        await page.waitForTimeout(500);
        const day = page.locator('button[role="gridcell"]:not([disabled]), .DayPicker-Day:not(.disabled)').first();
        if (await day.count()) await day.click().catch(() => {});
      }
    } catch (e: any) { console.log('Date selection failed (ignored):', e.message); }

    // Click Search and wait for results or relevant network calls
    try {
      const searchBtn = page.getByRole('button', { name: /search|find/i }).first();
      if (await searchBtn.count()) {
        await Promise.all([
          page.waitForResponse(r => (r.url().includes('/search') || r.url().includes('/results') || r.url().includes('/api')) && r.status() >= 200, { timeout: 12000 }).catch(() => {}),
          searchBtn.click().catch(() => {})
        ]);
      } else {
        await page.click('button[type="submit"]').catch(() => {});
      }
      await page.waitForTimeout(1200);
      await page.waitForSelector('article, .hotel-card, [data-testid*="hotel"], .search-results', { timeout: 10000 }).catch(() => {});
    } catch (e: any) { console.log('Search/results flow may have failed (ignored):', e.message); }

    // Capture storage and log cookies/domains for verification
    const storage = await context.storageState();
    console.log('Captured cookies count:', (storage.cookies || []).length);
    const domains = Array.from(new Set((storage.cookies || []).map(c => c.domain)));
    console.log('Cookie domains:', domains);

    // Persist storageState.json
    await fs.promises.mkdir(path.dirname(STORAGE), { recursive: true });
    await fs.promises.writeFile(STORAGE, JSON.stringify(storage, null, 2));
    console.log('Saved storageState to', STORAGE);
  } finally {
    await context.close();
  }
}

// Standalone run support
if (require.main === module) {
  const target = path.join(process.cwd(), 'user-data', 'storageState.json');
  const chrome = process.env.CHROME_PATH;
  seedStorage(target, chrome).catch(err => { console.error(err); process.exit(1); });
}