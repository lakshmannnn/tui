import { test, expect, Page } from '@playwright/test';
import { chromium } from 'playwright';
import path from 'path';
import { HomePage } from '../src/pages/HomePage';
import { SearchResultsPage } from '../src/pages/SearchResultsPage';
import { HotelPage } from '../src/pages/HotelPage';
import { BookingPage } from '../src/pages/BookingPage';
import { text } from 'stream/consumers';

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

test('E2E flow - TUI PDP booking (CDP / persistent profile)', async () => {
  const chromePath = CHROME_DEFAULT;
  const { browser, context } = await connectToRunningChromeOrPersistent(USER_DATA_DIR, chromePath);
  let page: Page | undefined;

  try {
    // try { await applyAntiBotScripts(context); } catch { }
    await context.setExtraHTTPHeaders({ 'accept-language': 'en-GB,en;q=0.9' });

    const page = await context.newPage();

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
    console.log('\n ***********ERRORS***********\n Errors with Please select...:', await page.locator('text=Please select').allInnerTexts());
    // expect(await page.locator('text=Please select').allInnerTexts()).toContain("Please select a title.");

    console.log('Errors with Please enter...:', await page.locator('text=Please enter').allInnerTexts());
    // expect(await page.locator('text=Please enter').allInnerTexts()).toContain('[/Please enter .*/]');

    console.log('Errors with Please use...:', await page.locator('text=Please use').allInnerTexts());
    // expect(await page.locator('text=Please use').allInnerTexts()).toContain('/Please use .*/');

    console.log('Erros with This field is required :', await page.locator('text=This field is required').allInnerTexts())
    // expect(await page.locator('text=This field is required').allInnerTexts()).toContain('/This field is required .*/')

    console.log('Errors on Important Information checkbox...:', await page.locator('.ImportantInformation__error_message_red').innerText());
    // expect(await page.locator('.ImportantInformation__error_message_red').allInnerTexts()).toContain('/.* forget to tick the important .*/')

    console.log('Main error message with number of validation errors :', await page.locator('text=Oops, looks like you need to fix').innerText())
    // expect(await page.locator('text=Oops, looks like you need to fix').allInnerTexts()).toContain('/Oops, looks like you .*/');

    const summary = await page.locator('div.HolidaySummary__holidaySummary a h2 .sections__title, .booking-summary, .summary').first().innerText().catch(() => 'Summary unavailable');
    console.log('\n ****************** \n', summary, '\n ****************** \n Accom Details: \n ', await page.locator('[aria-label="Accomodation Details"]').innerText(), '\n *************************** \n  OB Flight Details: \n', await page.locator('[aria-label="outBound Flight Details0"]').innerText(), '\n *************************** \n  IB Flight Details: \n', await page.locator('[aria-label="inBound Flight Details0"]').innerText(), '\n *************************** \n Price: \n', await page.locator('li.PriceSummaryPanel__title').innerText());
    // Assertions for above erros

  } finally {
    try {
      if (page && !page.isClosed()) {
        await page.close().catch(() => { });
      }
    } catch {
    }
  }
});