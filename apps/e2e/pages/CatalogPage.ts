import { Page, Locator } from '@playwright/test';

export class CatalogPage {
  readonly page: Page;
  
  // Step 1: Phone
  readonly phoneInput: Locator;
  readonly phoneContinueBtn: Locator;

  // Step 2: Register
  readonly nameInput: Locator;
  readonly neighborhoodSelect: Locator;
  readonly addressInput: Locator;
  readonly registerSubmitBtn: Locator;

  // Step 3: Catalog & Checkout
  readonly addBtn: Locator;
  readonly confirmButton: Locator;
  readonly successMessage: Locator;
  readonly submitError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.phoneInput = page.locator('input[type="tel"]');
    this.phoneContinueBtn = page.locator('button:has-text("Continuar")');

    this.nameInput = page.locator('input[type="text"]');
    this.neighborhoodSelect = page.locator('select').first(); // The neighborhood select
    this.addressInput = page.locator('textarea');
    this.registerSubmitBtn = page.locator('button:has-text("Guardar y Ver Catálogo")');

    this.addBtn = page.locator('button:has-text("+")').first();
    this.confirmButton = page.locator('button:has-text("PEDIR AHORA")');
    this.successMessage = page.locator('text=Pedido Confirmado');
    this.submitError = page.locator('[data-testid="submit-error"]');
  }

  async goto(phone?: string) {
    const url = phone ? `http://localhost:3001?phone=${phone}` : 'http://localhost:3001';
    await this.page.goto(url);
    await this.page.waitForTimeout(1500); // Wait for Astro/Solid hydration
  }

  async submitPhone(phone: string) {
    await this.phoneInput.fill(phone);
    await this.page.waitForTimeout(500);
    await this.phoneContinueBtn.click();
  }

  async registerCustomer(name: string, neighborhoodIndex: number, address: string) {
    await this.nameInput.fill(name);
    // Select the neighborhood by index (since we don't know the exact IDs in the DB from the test)
    // We can select the second option (index 1), since index 0 is the disabled placeholder
    await this.neighborhoodSelect.selectOption({ index: neighborhoodIndex });
    await this.addressInput.fill(address);
    await this.registerSubmitBtn.click();
  }

  async addCylinderToCart() {
    await this.addBtn.click();
  }

  async checkout() {
    // The phone and address are pre-filled in the new flow
    await this.confirmButton.click();
  }
}
