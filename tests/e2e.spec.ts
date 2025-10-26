import { test, expect } from '@playwright/test';
import { chromium, Browser, BrowserContext } from 'playwright';
import path from 'path';
import { HomePage } from '../src/pages/HomePage';
import { SearchResultsPage } from '../src/pages/SearchResultsPage';
import { HotelPage } from '../src/pages/HotelPage';
import { BookingPage } from '../src/pages/BookingPage';
import { applyAntiBotScripts } from '../src/utils/antiBot';

const CHROME_DEFAULT = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = path.join(__dirname, '..', 'user-data');

async function connectToRunningChromeOrPersistent(userDataDir: string, chromePath: string) {
  // Try persistent Playwright context first
  try {
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      executablePath: chromePath,
      ignoreDefaultArgs: ['--enable-automation'],
      args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check']
    });
    return { browser: undefined as any, context };
  } catch (e) {
    // fall through to CDP fallback
    // console.log('launchPersistentContext failed, will try CDP[Chrome DevTools Protocol] connect:', (e as Error).message);
  }

  // Fallback: try connecting to a Chrome started with --remote-debugging-port=9222
  try {
    const cdpUrl = 'http://127.0.0.1:9222';
    const browser = await chromium.connectOverCDP(cdpUrl);
    let context = browser.contexts()[0];
    if (!context) context = await browser.newContext();
    return { browser, context };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('connectOverCDP failed:', msg);
    throw err;
  }
}

// applyAntiBotScriptsInline injects a Playwright context-level init script that runs before any page script,
// modifying a few navigator/window properties to make the automated browser look more like a real user browser:
// 1.navigator.webdriver -> false
// 2.window.chrome -> provide a minimal chrome.runtime object
// 3.navigator.languages -> return ['en-GB','en']
// This is a surface-level spoof only, to trick Modern bot protections (Ex:Akamai)
async function applyAntiBotScriptsInline(context: BrowserContext) {
  await context.addInitScript(() => {
    try { Object.defineProperty(navigator, 'webdriver', { get: () => false }); } catch (e) {}
    try { (window as any).chrome = (window as any).chrome || { runtime: {} }; } catch (e) {}
    try { Object.defineProperty(navigator, 'languages', { get: () => ['en-GB', 'en'] }); } catch (e) {}
  });
  await Promise.resolve();
}

test('E2E flow - TUI PDP booking (CDP / persistent profile)', async () => {
  const chromePath = CHROME_DEFAULT;
  const { browser, context } = await connectToRunningChromeOrPersistent(USER_DATA_DIR, chromePath);

  try {
    try { await applyAntiBotScripts(context); } catch { await applyAntiBotScriptsInline(context); }
    await context.setExtraHTTPHeaders({ 'accept-language': 'en-GB,en;q=0.9' });

    const page = await context.newPage();

    // It logs failed HTTP responses (status >= 400) for tui URLs so you can debug server-side blocks (403/Access Denied from Akamai), missing resources, or unexpected errors.
    // page.on('response', async (response) => {
    //   const url = response.url();
    //   const status = response.status();
    //   if (status >= 400 && url.includes('tui')) {
    //     console.log(`Response ${status} for: ${url}`);
    //     console.log('Response headers:', response.headers());
    //     try { console.log((await response.text()).slice(0, 2000)); } catch { }
    //   }
    // });

    const home = new HomePage(page);
    await home.open();
    await home.acceptCookiesIfVisible();

    const departure = await home.chooseRandomDeparture();
    const destination = await home.chooseRandomDestination();
    const date = await home.chooseDepartureDate();
    const rooms = await home.setRoomsAndGuests();

    console.log('Search/Home Page - Selected test data:', { departure, destination, date, rooms });

    await home.search();

    const results = new SearchResultsPage(page);
    const hotelName = await results.pickFirstHotel();
    console.log('Search Results Page - Selected hotel:', hotelName);

    const hotel = new HotelPage(page);
    await hotel.continueToFlights();

    const booking = new BookingPage(page);
    await booking.selectFlight();
    await booking.continueToPassenger();

    const validationTriggered = await booking.triggerPassengerValidation();
    console.log('Passenger validation errors present:', validationTriggered);
    expect(validationTriggered).toBe(true);

    const summary = await page.locator('div.HolidaySummary__holidaySummary a h2 .sections__title, .booking-summary, .summary').first().innerText().catch(() => 'Summary unavailable');
    console.log('Booking summary snippet:', summary);
  } finally {
    try { await context.close(); } catch { }
    try { if (browser) await (browser as Browser).close(); } catch { }
  }
});