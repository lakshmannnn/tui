import { Page, Locator } from '@playwright/test';

export class SearchResultsPage {
  readonly page: Page;
  readonly hotelCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hotelCards = page.locator('[data-test-id="hotel-name"]');
  }

  async pickFirstHotel() {
    await this.page.waitForLoadState('domcontentloaded');
    const count = await this.hotelCards.count();
    if (count === 0) throw new Error('No hotels found');
    const first = this.hotelCards.first();
    const hotelName = this.page.locator('[data-test-id="hotel-name"] span').first().getAttribute('text');

    await first.click();
    return hotelName;
  }
}