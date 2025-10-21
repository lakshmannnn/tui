# TUI E2E Assessment — Playwright + TypeScript

Overview
- Playwright + TypeScript project demonstrating a POM-driven E2E flow for https://www.tui.co.uk.
- Automates: homepage → accept cookies → random departure → random destination → pick date → rooms & guests (2 adults + 1 child with random age) → search → pick first hotel → continue → select flights → passenger validation checks.

Prerequisites
- Node 18+
- npm
- Playwright browsers: npx playwright install
- (Optional but recommended) Real Chrome for seeding/avoiding bot protections

Quick install
1. cd c:\Automation\Playwright\tui
2. npm install
3. npx playwright install

Folder structure (key files)
- /tests
  - e2e.spec.ts        → main E2E test (CDP / persistent-profile fallback)
  - UIBasics.spec.js   → smaller example tests (Playwright basics)
  - (remove old e2e-old*.spec.ts if not needed)
- /src/pages          → Page Objects (HomePage.ts, SearchResultsPage.ts, HotelPage.ts, BookingPage.ts)
- /src/utils
  - shadow.ts          → helper to query nested shadow DOM (used by HomePage)
  - antiBot.ts         → optional anti-bot init scripts
- /scripts
  - seedStorage.ts     → seeder that creates a persistent profile and storageState.json
- /user-data
  - storageState.json  → saved cookies/storage (created by seeder)
  - seed-profile       → persistent Chrome profile used by tests (created by seeder)

How it maps to the assessment requirements
- TypeScript + Playwright: implemented.
- Page Object Model: UI actions encapsulated under /src/pages.
- Random selections: departure, destination and date chosen randomly from available UI options.
- Rooms & Guests: selects 2 adults + 1 child; child age chosen randomly from available values.
- Search & pick first hotel: implemented in SearchResultsPage and HotelPage.
- Passenger validation checks: BookingPage exposes methods to trigger and read validation errors.
- Logging: all selected test data and booking snippets are printed to console.

Running the seeder (recommended)
- The seeder opens a headed browser, accepts cookies, performs a minimal search and saves storageState.json and seed-profile.
- Use real Chrome to make the profile match production behavior:
  PowerShell:
  $env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
  npm run seed
- If seeder fails to click the cookie banner automatically, run it headed and interact with the opened browser (the script is headed so you can click).

Using a persistent Chrome (CDP) if Access Denied occurs
- Start Chrome manually with the seeded profile and remote debugging:
  PowerShell:
  "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Automation\Playwright\tui\user-data" --no-first-run --no-default-browser-check
- Then run tests:
  npm run test:headed
- The test includes logic to either launch a persistent context or connect over CDP to a running Chrome instance so cookies/fingerprint are preserved.

Run tests
- Full suite (Playwright runner):
  npm run test
- Headed E2E (single file):
  npm run test:headed
  or
  npx playwright test tests/e2e.spec.ts --headed
- Debug UI:
  npm run test:ui

Common troubleshooting
- storageState.json remains empty:
  - The seeder must interact with the same profile Playwright uses; ensure the seeder ran and saved to /user-data/storageState.json.
  - If seeder did not click cookie banner (iframe or selector mismatch), run seeder headed and click cookie accept manually.
- ECONNREFUSED 127.0.0.1:9222:
  - Start Chrome with --remote-debugging-port=9222 before running tests that use CDP.
  - Ensure no other process blocks port 9222 and close other Chrome instances using the same user-data-dir.
- Still blocked (Akamai/Access Denied):
  - Use the persistent profile (seed-profile) and/or run seeder from the same network/IP as tests.
  - If automation cannot bypass protections, run tests against a staging environment or request allowlisting.

Best practices & notes
- POM: keep page objects small and return values (e.g., selected departure/destination/date) so tests can assert and log.
- Assertions: add explicit expects for page transitions (results visible, hotel heading) and validation messages.
- Logging: tests print selected data (departure, destination, date, childAge, hotel name, validation errors).
- Keep src/utils/shadow.ts — it is required to access nested shadow DOM (#ALB element).
- Remove legacy/duplicate test files to avoid confusion.

Useful commands
- Install deps: npm install
- Install Playwright browsers: npx playwright install
- Seed storage/profile: npm run seed
- Run tests headed: npm run test:headed
- Run full tests: npm run test
- Open Playwright UI for debugging: npm run test:ui




