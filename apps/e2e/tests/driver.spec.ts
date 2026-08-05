import { test, expect } from '@playwright/test';
import { DriverApp } from '../pages/DriverApp';

test.describe('Flujo de Repartidor (Motoboy)', () => {
  test('Motoboy puede ver la interfaz de pedidos', async ({ page }) => {
    const driver = new DriverApp(page);
    
    // 1. Visitar App (requiere login o renderiza directo)
    await page.goto('http://localhost:3001/driver');
    
    // 2. Validar que renderice el Auth o el Dashboard
    await expect(page.locator('text="Acceso Repartidor"').or(page.locator('text="Sin pedidos activos"'))).toBeVisible({ timeout: 10000 });
  });
});
