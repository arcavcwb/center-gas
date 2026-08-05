import { Page, Locator, expect } from '@playwright/test';

export class DriverApp {
  readonly page: Page;
  readonly emptyBottleCheckbox: Locator;
  readonly confirmDeliveryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emptyBottleCheckbox = page.locator('text="✅ Sí, envase recogido"');
    this.confirmDeliveryButton = page.locator('button:has-text("FINALIZAR ENTREGA")');
  }

  async login(email: string, pass: string) {
    await this.page.goto('http://localhost:3001/driver');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', pass);
    await this.page.click('button:has-text("Ingresar")');
    await expect(this.page.locator('text="Sin pedidos activos"').or(this.page.locator('text="MARCAR COMO ENTREGADO"'))).toBeVisible({ timeout: 10000 });
  }

  async markAsDelivered() {
    await this.page.click('button:has-text("MARCAR COMO ENTREGADO")');
    await expect(this.emptyBottleCheckbox).toBeVisible();
    await this.emptyBottleCheckbox.click();
    await this.confirmDeliveryButton.click();
  }
}
