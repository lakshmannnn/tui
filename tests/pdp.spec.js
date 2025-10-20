const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

// Path to real Chrome on Windows - set CHROME_PATH env var if different
const CHROME_DEFAULT = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('E2E flow-PDP booking', async () => {
    const userDataDir = path.join(__dirname, '..', 'user-data'); // persistent profile folder
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // Launch real Chrome with the persistent profile
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

    // Minimal navigator overrides (don't overdo fingerprints)
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        try { delete window.chrome; } catch (e) {}
    });

    // Only realistic extra header(s); let Chrome supply client hints
    await context.setExtraHTTPHeaders({
        'accept-language': 'en-GB,en;q=0.9'
    });

    const page = await context.newPage();

    // log failing responses (keep for debugging)
    page.on('response', async (response) => {
        const url = response.url();
        const status = response.status();
        if (status >= 400 && url.includes('tui')) {
            console.log(`Response ${status} for: ${url}`);
            console.log('Response headers:', response.headers());
            try { console.log((await response.text()).slice(0, 2000)); } catch (e) {}
        }
    });

    // NOTE: Before running tests, start Chrome once with:
    // "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="c:\Automation\Playwright\tui\user-data"
    // then visit https://www.tui.co.uk and accept cookies so the profile has proper session cookies.
    const res = await page.goto('https://www.tui.co.uk/', { waitUntil: 'domcontentloaded' });
    if (res && res.status() >= 400) {
        console.log('Navigation failed with status', res.status());
        await context.close();
        return;
    }

    // const acceptCookies = page.locator('#cmCloseBanner');
    const inputDepSearchField = page.getByTestId('input_departure-airport');
    const inputDep = page.getByText('London Heathrow');
    const inputDepWin = page.getByTestId('button_done');
    const inputArrSearchField = page.getByTestId('input_destinations-airport');


    // await acceptCookies.waitFor();
    // await acceptCookies.click();
    await inputDepSearchField.click();
    await inputDep.click();
    await inputDepWin.click();
    await inputArrSearchField.fill('PMI');

    await context.close();
});
