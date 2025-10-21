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
  "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Automation\Playwright\tui\user-data" --no-first-run --no-default-browser-check
- Accept cookies on tui.co.uk, then close Chrome. (If you want Playwright to reuse that profile, modify playwright.config.ts to launch with executablePath and use launchPersistentContext.)

Run tests
- Run in headed mode (recommended for debugging):
  npm run test:headed OR
  npx playwright test tests/e2e.spec.ts --headed
- Run normal:
  npx playwright test
- View HTML report:
  npm run test:report OR
  npx playwright show-report

Notes / Best practices followed
- Page Object Model with small focused page classes.
- Single test file driving the end-to-end flow.
- Randomized selections and console logs for all picked inputs.
- Assertion added for passenger validation messages.

If something fails due to site changes (selectors, dynamic content), open the headed run and inspect selectors, then update the corresponding POM method.


Trouble Shooting
instructions to avoid Access Denied errors
1. Start Chrome manually with the seeded profile and remote
  debugging   port (close all Chrome first):
PowerShell:
$env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Automation\Playwright\tui\user-data" --no-first-run --no-default-browser-check
OR run below when above command returns error.
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Automation\Playwright\tui\user-data" --no-first-run --no-default-browser-check

2. In another terminal run:
 npm run test:headed
This forces Playwright to control the exact Chrome process (preserves fingerprint + cookies).




