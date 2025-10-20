import { Page } from '@playwright/test';

export class HotelPage {
  constructor(private page: Page) {}

  async continueToFlights() {
    // click Continue / Book / Select Room
    const cont = this.page.locator('button:has-text("Continue"), button:has-text("Book"), button:has-text("Select")').first();
    await cont.click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}