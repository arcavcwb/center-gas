import { test, expect } from '@playwright/test';
import { KanbanPage } from '../pages/KanbanPage';

test.describe('Flujo B2B de Administrador', () => {
  test('Dueño puede ver la pantalla de acceso', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await expect(page.locator('text="Acceso Owner"')).toBeVisible();
  });
});
