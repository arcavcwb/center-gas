import { Page, Locator, expect } from '@playwright/test';

export class KanbanPage {
  readonly page: Page;
  readonly incomingColumn: Locator;
  readonly assignedColumn: Locator;

  constructor(page: Page) {
    this.page = page;
    // B2B corre en Next.js (puerto 3000)
    this.incomingColumn = page.locator('[data-testid="column-incoming"]');
    this.assignedColumn = page.locator('[data-testid="column-assigned"]');
  }

  async goto() {
    await this.page.goto('http://localhost:3000/dashboard/kanban');
  }

  async login(email: string, pass: string) {
    await this.page.goto('http://localhost:3000/auth');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', pass);
    await this.page.click('button:has-text("Ingresar")');
    await this.page.waitForURL('**/dashboard/**');
  }

  async dragOrderToAssigned(orderId: string) {
    const orderCard = this.page.locator(`[data-order-id="${orderId}"]`);
    await expect(orderCard).toBeVisible();
    await orderCard.dragTo(this.assignedColumn);
  }
}
