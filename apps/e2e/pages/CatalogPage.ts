import { Page, Locator } from '@playwright/test';

export class CatalogPage {
  readonly page: Page;
  readonly addBtn: Locator;
  readonly phoneInput: Locator;
  readonly addressInput: Locator;
  readonly confirmButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addBtn = page.locator('button:has-text("+")').first();
    this.phoneInput = page.locator('input[type="tel"]');
    this.addressInput = page.locator('textarea');
    this.confirmButton = page.locator('button:has-text("PEDIR AHORA")');
    this.successMessage = page.locator('text=Pedido Confirmado');
  }

  async goto() {
    await this.page.goto('http://localhost:3001');
  }

  async addCylinderToCart() {
    await this.addBtn.click();
  }

  async checkout(phone: string, address: string) {
    await this.phoneInput.fill(phone);
    await this.addressInput.fill(address);
    await this.confirmButton.click();
  }
}
