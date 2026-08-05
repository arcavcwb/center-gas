import { test, expect } from '@playwright/test';
import { CatalogPage } from '../pages/CatalogPage';

test.describe('Flujo B2C de Compra', () => {
  test('Cliente puede seleccionar un cilindro, y confirmar', async ({ page }) => {
    const catalog = new CatalogPage(page);
    
    // 1. Visitar catálogo
    await catalog.goto();

    // 2. Añadir producto
    await catalog.addCylinderToCart();

    // 3. Checkout con teléfono de prueba y dirección
    await catalog.checkout('41999999999', 'Rua das Flores 123');

    // 4. Validar mensaje de éxito o capturar error
    const submitError = page.locator('[data-testid="submit-error"]');
    
    try {
      await expect(catalog.successMessage).toBeVisible({ timeout: 10000 });
    } catch (e) {
      if (await submitError.isVisible()) {
        const errorText = await submitError.textContent();
        throw new Error(`RPC Failed with error: ${errorText}`);
      }
      throw e;
    }
  });
});
