import { Page, Locator } from '@playwright/test';

export class CatalogPage {
  readonly page: Page;
  readonly cylinderItem: Locator;
  readonly comboBanner: Locator;
  readonly phoneInput: Locator;
  readonly confirmButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cylinderItem = page.locator('[data-testid="cylinder-item"]').first();
    this.comboBanner = page.locator('[data-testid="combo-banner"]');
    this.phoneInput = page.locator('input[type="tel"]');
    this.confirmButton = page.locator('button:has-text("Pedir Ahora")');
    this.successMessage = page.locator('text="Pedido confirmado"');
  }

  async goto() {
    // El catálogo corre en Astro (puerto 4321)
    await this.page.goto('http://localhost:4321');
  }

  async addCylinderToCart() {
    await this.cylinderItem.click();
  }

  async applyCombo() {
    if (await this.comboBanner.isVisible()) {
      await this.comboBanner.click();
    }
  }

  async checkout(phone: string) {
    await this.phoneInput.fill(phone);
    await this.confirmButton.click();
  }
}
