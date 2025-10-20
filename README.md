# TUI E2E Assessment — Playwright + TypeScript

Overview
- Playwright TypeScript project demonstrating POM, randomized selections and validation checks for a booking flow on https://www.tui.co.uk.

Prerequisites
- Node 18+
- git (optional)
- install Playwright browsers: npx playwright install

Install
1. cd c:\Automation\Playwright\tui
2. npm install

Optional: use real Chrome profile
- To reduce bot blocking, you can run Chrome once with a dedicated profile and accept cookies:
  "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="C:\Automation\Playwright\tui\user-data" --no-first-run
- Accept cookies on tui.co.uk, then close Chrome. (If you want Playwright to reuse that profile, modify playwright.config.ts to launch with executablePath and use launchPersistentContext.)

Run tests
NOTE: Before running tests, open Chrome once manually with:
      "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="c:\Automation\Playwright\tui\user-data"
      visit https://www.tui.co.uk and accept cookies so the profile has proper session cookies.

- Run in headed mode (recommended for debugging):
  npm run test:headed
- Run normal:
  npm test
- View HTML report:
  npm run test:report

Notes / Best practices followed
- Page Object Model with small focused page classes.
- Single test file driving the end-to-end flow.
- Randomized selections and console logs for all picked inputs.
- Assertion added for passenger validation messages.

If something fails due to site changes (selectors, dynamic content), open the headed run and inspect selectors, then update the corresponding POM method.

Run instructions

Start Chrome manually with the seeded profile and remote debugging port (close all Chrome first):
PowerShell:
$env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Automation\Playwright\tui\user-data" --no-first-run --no-default-browser-check
In another terminal run:
npm run test:headed
This forces Playwright to control the exact Chrome process (preserves fingerprint + cookies).