import { Page, Locator } from '@playwright/test';
import { queryNestedShadow } from '../utils/shadow';

export class HomePage {
  readonly page: Page;
  readonly acceptCookiesBtn: Locator;
  readonly depInput: Locator;
  readonly depInputLon: Locator;
  readonly depInputOverlay: Locator;
  readonly arrInput: Locator;
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
    this.depInputOverlay = page.getByTestId('button_done');
    this.arrInput = page.getByTestId('input_destinations-airport');
    this.arrInputList = page.locator('.destination-list');
    // this.arrInput = page.locator('#destinations');
    this.arrInputAlbania = page.locator('input#ALB');
    this.dateField = page.getByTestId('input_departure-date');
    this.monthSelector = page.locator('.monthSelector [data-testid="chevron"]');
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
    await this.depInput.click();
    const checked = await this.page.locator('input[aria-label="London Heathrow"]').isChecked();
    if (!checked)
      await this.depInputLon.click();
    // ***TODO: depAirport is hardcoded in above code and below code randomizes depArport but need further finetuning
    //     await this.depInput.click();
    //   const depAirportOptions = this.page.getByTestId('airport-group').locator('.label-inline');

    // const depAirportOptionsCount = await depAirportOptions.count();
    //     const idx =  Math.floor(Math.random() * depAirportOptionsCount);
    //     const pick = depAirportOptions.nth(idx);
    //     const text = await depAirportOptions.nth(idx).textContent();
    //     console.log(idx,depAirportOptionsCount,text,depAirportOptions);
    //     await pick.click();
    // ****TODO:EoL
    const text = await this.depInputLon.textContent();
    await this.depInputOverlay.click();
    return text
  }

  async chooseRandomDestination() {
    // try to click the arrival option inside nested shadow DOM (#ALB)
    // const hosts = [
    //   'tui-choice-search-panel-container[market="UK"]',
    //   'tui-search-panel-mfe[locale="en-GB"]'
    // ];
    // const innerSelector = '#ALB';

    // try {
    //   // open destinations UI first so shadow roots render
    //   await this.arrInputList.click().catch(() => {});
    //   await this.page.waitForTimeout(300);

    //   const el = await queryNestedShadow(this.page, hosts, innerSelector, 4000);
    //   if (el) {
    //     const text = await el.innerText().catch(() => null);
    //     await el.click().catch(() => {});
    //     await el.dispose();
    //     return text;
    //   }
    // } catch (e) {
    //   // ignore and fall back
    // }

    // fallback: original approach (click destination list and pick first visible option)
    await this.arrInputList.click().catch(() => {});
    await this.page.waitForTimeout(500);
    const candidates = this.page.locator('.options #ESP');
    const count = await candidates.count().catch(() => 0);
    if (count > 0) {
      const pick = candidates.nth(0);
       const text = (await pick.innerText()).trim();
      await pick.click().catch(() => {});
      return text;
    }

    return null;
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
    await day.click();
    const text = await this.dateField.getAttribute('placeholder');
    return text;
  }

  async setRoomsAndGuests() {
    const adults = 2;
    await this.roomsGuestsBtn.click();
    const childSelectedStr = await this.page.locator('div[aria-label="nonAdults controlBlock"] span.stepper-counter').textContent();
    const childSelected = Number(childSelectedStr);
    // Check if the Children already selected. This is to avoid any default selections using cache.
    console.log('default children selected', childSelected);
    let childAgeRan = Math.floor(Math.random() * 100);
    while (childAgeRan > 17) {
      const childAgeRandom = Math.floor(Math.random() * 100);
      childAgeRan = childAgeRandom;
    }
    const childAge = childAgeRan;
    console.log('child age:', childAge)
    // Set the Children value to 1 and select random age for Child1
    if (Number(childSelected) == 0) {
      await this.page.getByLabel('nonAdults plus').click();
      await this.page.getByTestId('select_child-age').click()
      await this.page.getByTestId('select_child-age').selectOption(String(childAge));
    }
    else if (Number(childSelected) != 1) {
      while (Number(childSelected) != 1) {
        await this.page.getByLabel('nonAdults minus').click();
      }
      await this.page.getByTestId('select_child-age').click()
      await this.page.getByTestId('select_child-age').selectOption(String(childAge));
    }
    // close rooms overlay if close/Done exists
    const done = this.page.getByTestId('button_done').first();
    if (await done.count()) await done.click();
    return { adults, childAge };
  }

  async search() {
    await this.searchBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}