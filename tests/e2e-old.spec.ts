import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import path from 'path';
import { HomePage } from '../src/pages/HomePage';
import { SearchResultsPage } from '../src/pages/SearchResultsPage';
import { HotelPage } from '../src/pages/HotelPage';
import { BookingPage } from '../src/pages/BookingPage';

// Inline anti-bot helper to avoid missing module error
async function applyAntiBotScripts(context: import('playwright').BrowserContext) {
  // Inject scripts early to reduce automation traces
  await context.addInitScript(() => {
    // make webdriver false
    try {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    } catch (e) {}
    // provide a minimal chrome runtime object
    try {
      // @ts-ignore
      window.chrome = window.chrome || { runtime: {} };
    } catch (e) {}
    // set common languages
    try {
      Object.defineProperty(navigator, 'languages', { get: () => ['en-GB', 'en'] });
    } catch (e) {}
  });

  // no-op await to preserve async usage
  await Promise.resolve();
}

const CHROME_DEFAULT = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('E2E flow - TUI booking (persistent Chrome to avoid Access Denied)', async () => {
  const userDataDir = path.join(__dirname, '..', 'user-data'); // persistent profile folder
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: CHROME_DEFAULT,
    userAgent,
    viewport: { width: 1280, height: 800 },
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check']
  });

  try {
    // Centralised anti-bot script (handles TS-safe cast for window.chrome)
    await applyAntiBotScripts(context);

    // realistic headers only
    await context.setExtraHTTPHeaders({
      'accept-language': 'en-GB,en;q=0.9'
    });

    const page = await context.newPage();

    // helpful logging for debugging 403s
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      if (status >= 400 && url.includes('tui')) {
        console.log(`Response ${status} for: ${url}`);
        console.log('Response headers:', response.headers());
        try { console.log((await response.text()).slice(0, 2000)); } catch (e) {}
      }
    });

    // NOTE: Before running tests, open Chrome once manually with:
    // "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="c:\Automation\Playwright\tui\user-data"
    // visit https://www.tui.co.uk and accept cookies so the profile has proper session cookies.

    // POM driven flow
    const home = new HomePage(page);
    await home.open();
    await home.acceptCookiesIfVisible();

    const departure = await home.chooseRandomDeparture();
    const destination = await home.chooseRandomDestination();
    const date = await home.chooseDepartureDate();

    const childAge = Math.floor(Math.random() * 10) + 2;
    const rooms = await home.setRoomsAndGuests();

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
    await context.close();
  }
});