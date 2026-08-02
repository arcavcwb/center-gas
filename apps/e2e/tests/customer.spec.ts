import { test, expect } from '@playwright/test';
import { CatalogPage } from '../pages/CatalogPage';

test.describe('Flujo B2C de Compra', () => {
  test('Cliente puede seleccionar un cilindro, aplicar combo y confirmar', async ({ page }) => {
    const catalog = new CatalogPage(page);
    
    // 1. Visitar catálogo
    await catalog.goto();

    // 2. Añadir producto (P13)
    await catalog.addCylinderToCart();

    // 3. (Opcional) Aplicar combo de agua si es visible
    await catalog.applyCombo();

    // 4. Checkout con teléfono de prueba
    await catalog.checkout('41999999999');

    // 5. Validar mensaje de éxito
    await expect(catalog.successMessage).toBeVisible({ timeout: 10000 });
  });
});
