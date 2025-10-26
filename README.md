# TUI E2E Assessment — Playwright + TypeScript

Overview
- Playwright + TypeScript project demonstrating a POM-driven E2E flow for https://www.tui.co.uk.
- Automates: homepage → accept cookies → random departure → random destination → pick date → rooms & guests (2 adults + 1 child with random age) → search → pick first hotel → continue → select flights → passenger validation checks.

Prerequisites
- Node 18+
- npm
- Playwright browsers: npx playwright install
- (Optional but recommended) Real Chrome to avoid bot protections

Quick install
1. cd c:\Automation\Playwright\tui
2. npm install
3. npx playwright install

Folder structure (key files)
- /tests
  - e2e.spec.ts        → main E2E test (CDP / persistent-profile fallback)
- /src/pages          → Page Objects (HomePage.ts, SearchResultsPage.ts, HotelPage.ts, BookingPage.ts)
- /src/utils
  - shadow.ts          → helper to query nested shadow DOM (used by HomePage)
  - antiBot.ts         → optional anti-bot init scripts

Chrome Profile Settings to avoid 'Access Denied':

Manual: Using a persistent Chrome (CDP)
- Start Chrome manually with the remote debugging:
  PowerShell:
  "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\Automation\Playwright\tui\user-data" --no-first-run --no-default-browser-check
- Then run tests:
  npm run test:headed
- The test includes logic to either launch a persistent context or connect over CDP to a running Chrome instance so cookies/fingerprint are preserved.

Run tests:

Pre-requisite: Follow 'Chrome Profile Settings to avoid 'Access Denied'
- Full suite (Playwright runner):
  npm run test
- Headed E2E (single file):
  npm run test:headed
  or
  npx playwright test tests/e2e.spec.ts --headed
- Debug UI:
  npm run test:ui

Common troubleshooting

  - Start Chrome with --remote-debugging-port=9222 before running tests that use CDP.
  - Ensure no other process blocks port 9222 and close other Chrome instances using the same user-data-dir.
- Still blocked (Akamai/Access Denied):
  - Use the persistent profile
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
- Run tests headed: npm run test:headed
- Run full tests: npm run test
- Open Playwright UI for debugging: npm run test:ui
- Open Playwright in debug mode: npm run test:debug


How the artifacts maps to the assessment requirements
- TypeScript + Playwright: implemented.
- Page Object Model: UI actions encapsulated under /src/pages.
- Random selections: departure, destination and date chosen randomly from available UI options.
- Rooms & Guests: selects 2 adults + 1 child; child age chosen randomly from available values.
- Search & pick first hotel: implemented in SearchResultsPage and HotelPage.
- Passenger validation checks: BookingPage exposes methods to trigger and read validation errors.
- Logging: all selected test data and booking snippets are printed to console.
- Assertions: wherever required ex: to verify validation errors


Improvements:
--Cache need to be cleared everytime we run the test as sometimes the site throws Access Denied when the site tghrew the same earlier, I mean the cookies updated in the last session are used in the new session.
--Extra Validation checks on Pax Details page to be added
--The Holiday details need to be shown such as 'Holiday Summary'
--run in multiple browsers