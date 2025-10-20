import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { HomePage } from '../src/pages/HomePage';
import { SearchResultsPage } from '../src/pages/SearchResultsPage';
import { HotelPage } from '../src/pages/HotelPage';
import { BookingPage } from '../src/pages/BookingPage';
import { applyAntiBotScripts } from '../src/utils/antiBot';
import { seedStorage } from '../scripts/seedStorage';

const CHROME_DEFAULT = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const STORAGE = path.join(__dirname, '..', 'user-data', 'storageState.json');

async function createContextWithStorage() {
  // Ensure seed-profile exists; create it via seeder if missing
  const userDataDir = path.join(__dirname, '..', 'user-data', 'seed-profile');
  if (!fs.existsSync(userDataDir)) {
    console.log('Persistent profile not found — running seeder to create seed-profile...');
    await seedStorage(STORAGE, CHROME_DEFAULT);
    // seeder creates seed-profile next to storageState.json
  }

  // Launch persistent context that reuses the real Chrome profile (avoid storageState.json limitations)
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: CHROME_DEFAULT,
    viewport: { width: 1280, height: 800 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check']
  });

  // when using persistent context there is no separate browser handle to return; return undefined for browser
  return { browser: undefined as any, context };
}

// Try to connect to an already-running Chrome (started with --remote-debugging-port)
async function connectToRunningChromeOrPersistent(userDataDir: string, chromePath: string) {
  // prefer persistent Playwright launch first
  try {
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      executablePath: chromePath,
      ignoreDefaultArgs: ['--enable-automation'],
      args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check']
    });
    return { browser: undefined as any, context };
  } catch (e) {
    // console.log('launchPersistentContext failed, will try CDP connect:', e.message);
  }

  // fallback: try connecting to a Chrome started with --remote-debugging-port=9222
  try {
    const cdpUrl = 'http://127.0.0.1:9222';
    const browser = await chromium.connectOverCDP(cdpUrl); // controls the real Chrome
    // try to reuse an existing context or create a new one
    let context = browser.contexts()[0];
    if (!context) context = await browser.newContext();
    return { browser, context };
  } catch (err) {
    // err has type unknown in TypeScript; guard before accessing .message
    const msg = err instanceof Error ? err.message : String(err);
    console.log('connectOverCDP failed:', msg);
    throw err;
  }
}

async function applyAntiBotScriptsInline(context: import('playwright').BrowserContext) {
  await context.addInitScript(() => {
    try { Object.defineProperty(navigator, 'webdriver', { get: () => false }); } catch (e) {}
    try { (window as any).chrome = (window as any).chrome || { runtime: {} }; } catch (e) {}
    try { Object.defineProperty(navigator, 'languages', { get: () => ['en-GB', 'en'] }); } catch (e) {}
  });
  await Promise.resolve();
}

test('E2E flow - TUI booking (persistent profile)', async () => {
  const { browser, context } = await createContextWithStorage();

  try {
    // apply anti-bot scripts (use central helper if available)
    try { await applyAntiBotScripts(context); } catch { await applyAntiBotScriptsInline(context); }

    await context.setExtraHTTPHeaders({ 'accept-language': 'en-GB,en;q=0.9' });

    const page = await context.newPage();

    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      if (status >= 400 && url.includes('tui')) {
        console.log(`Response ${status} for: ${url}`);
        console.log('Response headers:', response.headers());
        try { console.log((await response.text()).slice(0, 2000)); } catch (e) {}
      }
    });

    // POM driven flow
    const home = new HomePage(page);
    await home.open();
    await home.acceptCookiesIfVisible();

    const departure = await home.chooseRandomDeparture();
    const destination = await home.chooseRandomDestination();
    const date = await home.chooseDepartureDate();

    const childAge = Math.floor(Math.random() * 10) + 2;
    const rooms = await home.setRoomsAndGuests(2, childAge);

    console.log('Selected test data:', { departure, destination, date, rooms });

    await home.search();

    const results = new SearchResultsPage(page);
    const hotelName = await results.pickFirstHotel();
    console.log('Picked hotel:', hotelName);

    const hotel = new HotelPage(page);
    await hotel.continueToFlights();

    const booking = new BookingPage(page);
    await booking.selectFlight();

    await booking.continueToPassenger();
    const validationTriggered = await booking.triggerPassengerValidation();
    console.log('Passenger validation errors present:', validationTriggered);
    expect(validationTriggered).toBe(true);

    const summary = await page.locator('h1, .booking-summary, .summary').first().innerText().catch(() => 'Summary unavailable');
    console.log('Booking summary snippet:', summary);
  } finally {
    try { await context.close(); } catch (e) {}
    try { if (browser) await browser.close(); } catch (e) {}
  }
});

test.only('E2E flow - TUI booking (CDP fallback)', async () => {
  const userDataDir = path.join(__dirname, '..', 'user-data');
  const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const { browser, context } = await connectToRunningChromeOrPersistent(userDataDir, chromePath);

  try {
    await applyAntiBotScripts(context).catch(() => {/* ignore */});
    await context.setExtraHTTPHeaders({ 'accept-language': 'en-GB,en;q=0.9' });

    const page = await context.newPage();

    // log cookies before search (quick verification)
    const cookies = await context.cookies('https://www.tui.co.uk/');
    console.log('Pre-search cookies for tui.co.uk:', cookies.map(c => ({ name: c.name, domain: c.domain })));

    // POM driven flow
    const home = new HomePage(page);
    await home.open();
    await home.acceptCookiesIfVisible();

    const departure = await home.chooseRandomDeparture();
    const destination = await home.chooseRandomDestination();
    const date = await home.chooseDepartureDate();

    const childAge = Math.floor(Math.random() * 10) + 2;
    const rooms = await home.setRoomsAndGuests(2, childAge);

    console.log('Selected test data:', { departure, destination, date, rooms });

    await home.search();

    const results = new SearchResultsPage(page);
    const hotelName = await results.pickFirstHotel();
    console.log('Picked hotel:', hotelName);

    const hotel = new HotelPage(page);
    await hotel.continueToFlights();

    const booking = new BookingPage(page);
    await booking.selectFlight();

    await booking.continueToPassenger();
    const validationTriggered = await booking.triggerPassengerValidation();
    console.log('Passenger validation errors present:', validationTriggered);
    expect(validationTriggered).toBe(true);

    const summary = await page.locator('h1, .booking-summary, .summary').first().innerText().catch(() => 'Summary unavailable');
    console.log('Booking summary snippet:', summary);
  } finally {
    try { await context.close(); } catch {}
    try { if (browser) await browser.close(); } catch {}
  }
});