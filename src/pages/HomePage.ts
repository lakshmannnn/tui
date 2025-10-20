import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly acceptCookiesBtn: Locator;
  readonly depInput: Locator;
  readonly depInputLon: Locator;
  readonly depInputLayOver: Locator;
  readonly destInput: Locator;
  readonly arrInputList: Locator;
  readonly arrInputAlbania: Locator;
  readonly dateField: Locator;
  readonly monthSelector: Locator;
  readonly roomsGuestsBtn: Locator;
  readonly searchBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.acceptCookiesBtn = page.locator('#cmCloseBanner, button:has-text("Accept"), button:has-text("Allow all")').first();
    this.depInput = page.getByTestId('input_departure-airport').first();
    this.depInputLon = page.getByText('London Heathrow');
    this.depInputLayOver = page.getByTestId('button_done');
    this.destInput = page.getByTestId('input_destinations-airport');
    this.arrInputList = page.locator('.destination-list');
    this.arrInputAlbania = page.locator('input#ALB');
    // this.dateField = page.locator('input[name="departDate"], [data-testid*="date"]').first();
    this.dateField = page.getByTestId('input_departure-date');
    this.monthSelector = page.locator('.monthSelector [data-testid="chevron"]');
    // this.roomsGuestsBtn = page.getByRole('button', { name: /rooms|guests|rooms & guests/i }).first();
    this.roomsGuestsBtn = page.getByTestId('input_pax-and-rooms');
    this.searchBtn = page.getByTestId('search-button');
  }

  async open() {
    await this.page.goto('https://www.tui.co.uk/', { waitUntil: 'domcontentloaded' });
  }

  async acceptCookiesIfVisible() {
    if (await this.acceptCookiesBtn.count()) {
      try { await this.acceptCookiesBtn.click({ timeout: 3000 }); } catch { }
    }
  }

  // select by choosing visible options from dropdown lists (random pick)
  async chooseRandomDeparture() {
    //TODO: COMMENTED CODE is  to randomize the Dep Airport selection, failig for some reason.
    await this.depInput.click();
    // const options = this.page.locator('role=option, [role="listitem"], .autocomplete__option, .dropdown__item').filter({ hasText: '' });
    // if (await options.count() === 0) {
    // try typing to reveal suggestions
    await this.depInputLon.click();
    // await this.page.waitForTimeout(500);
    // }
    // const resolved = this.page.locator('ul[role="listbox"] li, .suggestions li, role=option').first();
    // const candidates = this.page.locator('ul[role="listbox"] li, .suggestions li, role=option');
    // const count = await candidates.count();
    // const idx = count > 0 ? Math.floor(Math.random() * count) : 0;
    // const pick = candidates.nth(idx);
    // const text = (await pick.innerText()).trim();
    // await pick.click();
    // return text;
    await this.depInputLayOver.click();
  }

  async chooseRandomDestination() {
    await this.arrInputList.click();
    await this.arrInputList.click();
    // await this.page.locator('#ALB').click();
    //above #ALB is not accessible as it is under Shadow DOM element
    //This Element is inside 2 nested shadow DOM.
    // String cssSelectorForHost1 = "tui-choice-search-panel-container[market='UK']";
    // String cssSelectorForHost2 = "tui-search-panel-mfe[locale='en-GB']";
    // Thread.sleep(1000);
    // SearchContext shadow0 = driver.findElement(By.cssSelector("tui-choice-search-panel-container[market='UK']")).getShadowRoot();
    // Thread.sleep(1000);
    // SearchContext shadow1 = shadow0.findElement(By.cssSelector("tui-search-panel-mfe[locale='en-GB']")).getShadowRoot();
    // Thread.sleep(1000);
    // shadow1.findElement(By.cssSelector(" section:nth-child(3) > div:nth-child(1) > div:nth-child(1) > form:nth-child(1) > fieldset:nth-child(1) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div:nth-child(2) > label:nth-child(1) > span:nth-child(1) > span:nth-child(3)"));
    // ***TODO:The below logic is to randomize selection***
    // await this.arrInputAlbania.click();
    // await this.depInputLayOver.click();
    // await this.destInput.click();
    // await this.destInput.fill('P'); // nudge to reveal options
    // await this.page.waitForTimeout(500);
    // const candidates = this.page.locator('ul[role="listbox"] li, .suggestions li, role=option');
    // const count = await candidates.count();
    // const idx = count > 0 ? Math.floor(Math.random() * count) : 0;
    // const pick = candidates.nth(idx);
    // const text = (await pick.innerText()).trim();
    // await pick.click();
    // return text;


  }

  async chooseDepartureDate() {
    // basic approach: click date field and pick first available day in next month view
    await this.dateField.click();
    await this.page.waitForTimeout(500);
    await this.monthSelector.click();
    const availableDays = this.page.locator('.day.available');
    const count = await availableDays.count();
    const idx = Math.max(0, Math.floor(Math.random() * Math.max(1, count)));
    const day = availableDays.nth(idx);
    const text = await day.innerText();
    await day.click();
    return text;
  }

  async setRoomsAndGuests(adults = 2, childAge = 5) {
    await this.roomsGuestsBtn.click();
    const childSelected = this.page.locator('div[aria-label="nonAdults controlBlock"] span.stepper-counter').textContent();
    if (!childSelected)
      await this.page.getByLabel('nonAdults plus').click();
    await this.page.getByTestId('select_child-age').selectOption('5');



    // const childAges = this.page.locator('select option[aria-label]');
    // console.log('childAges');

    // simple selectors for common controls
    // const adultInc = this.page.locator('button:has-text("+"):near(:text("Adults"))').first();
    // const childInc = this.page.locator('button:has-text("+"):near(:text("Children"))').first();
    // reset to 1 adult then add
    // try {
    //   // increment adults to desired count
    //   for (let i = 1; i < adults; i++) await adultInc.click();
    // } catch { }
    // try {
    //   // ensure one child
    //   await childInc.click();
    //   // set child age if age dropdown appears
    //   const ageSelector = this.page.locator('select[name*="child"], select[aria-label*="child-age"]').first();
    //   if (await ageSelector.count()) {
    //     await ageSelector.selectOption({ label: String(childAge) }).catch(() => { });
    //   } else {
    //     // try clicking age buttons
    //     const ageBtn = this.page.locator(`button:has-text("${childAge}")`).first();
    //     if (await ageBtn.count()) await ageBtn.click();
    //   }
    // } catch { }
    // close rooms overlay if close/Done exists
    const done = this.page.getByTestId('button_done').first();
    if (await done.count()) await done.click();
    // return { adults, childAge };
  }

  async search() {
    await this.searchBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}