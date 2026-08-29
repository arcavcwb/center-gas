import { Page, Locator, expect } from '@playwright/test';

export class KanbanPage {
  readonly page: Page;
  readonly incomingColumn: Locator;
  readonly assignedColumn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.incomingColumn = page.locator('text="NUEVOS"');
    this.assignedColumn = page.locator('text="ASIGNADOS / EN CAMINO"');
  }

  async goto() {
    await this.page.goto('http://localhost:3000');
  }

  async login(email: string, pass: string) {
    await this.page.goto('http://localhost:3000/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', pass);
    await this.page.click('button:has-text("Ingresar")');
    await expect(this.page.locator('text="Panel de Control B2B"')).toBeVisible({ timeout: 10000 });
  }
}
