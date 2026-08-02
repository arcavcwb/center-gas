import { Page, Locator, expect } from '@playwright/test';

export class DriverApp {
  readonly page: Page;
  readonly newOrderAlert: Locator;
  readonly acceptButton: Locator;
  readonly giantDeliveredButton: Locator;
  readonly emptyBottleCheckbox: Locator;
  readonly confirmDeliveryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newOrderAlert = page.locator('[data-testid="new-order-alert"]');
    this.acceptButton = page.locator('button:has-text("Aceptar Pedido")');
    this.giantDeliveredButton = page.locator('[data-testid="giant-delivered-btn"]');
    this.emptyBottleCheckbox = page.locator('[data-testid="empty-bottle-check"]');
    this.confirmDeliveryButton = page.locator('button:has-text("Confirmar Entrega")');
  }

  async login(email: string, pass: string) {
    await this.page.goto('http://localhost:3000/motoboy/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', pass);
    await this.page.click('button:has-text("Entrar")');
    await this.page.waitForURL('**/motoboy/home');
  }

  async acceptOrder() {
    await expect(this.newOrderAlert).toBeVisible();
    await this.acceptButton.click();
  }

  async markAsDelivered() {
    await this.giantDeliveredButton.click();
    await this.emptyBottleCheckbox.check();
    await this.confirmDeliveryButton.click();
  }
}
