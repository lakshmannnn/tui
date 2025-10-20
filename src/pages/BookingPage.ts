import { Page } from '@playwright/test';

export class BookingPage {
  constructor(private page: Page) {}

  async selectFlight() {
    // pick first selectable flight
    const flight = this.page.locator('button:has-text("Select flight"), button:has-text("Continue"), .flight-card').first();
    await flight.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async continueToPassenger() {
    const cont = this.page.locator('button:has-text("Continue"), button:has-text("Proceed")').first();
    await cont.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async triggerPassengerValidation() {
    // attempt to continue without filling passenger name to surface validation
    await this.continueToPassenger();
    // look for common validation messages
    // const error = this.page.locator('text=Please enter, text=required, .error, .validation-message').first();
     const error = this.page.locator('text=Please enter').first();
   return (await error.count()) > 0;
  }
}