import { test, expect } from '@playwright/test';
import { CatalogPage } from '../pages/CatalogPage';

test.describe('Flujo B2C de Compra', () => {
  test('Cliente NUEVO puede registrarse y hacer un pedido', async ({ page }) => {
    page.on('console', msg => console.log(msg.text()));
    const catalog = new CatalogPage(page);
    
    // 1. Visitar catálogo
    await catalog.goto();

    // 2. Ingresar teléfono nuevo (aleatorio para evitar conflicto en reintentos)
    const randomPhone = `41999${Math.floor(10000 + Math.random() * 90000)}`;
    await catalog.submitPhone(randomPhone);

    // 3. Debería mostrar el formulario de registro
    try {
      await expect(catalog.nameInput).toBeVisible({ timeout: 5000 });
    } catch (e) {
      if (await catalog.submitError.isVisible()) {
        throw new Error("Phone Check Error: " + await catalog.submitError.textContent());
      }
      throw e;
    }
    await catalog.registerCustomer('Cliente Nuevo E2E', 1, 'Rua das Flores 123');

    // 4. Debería mostrar el catálogo
    await expect(catalog.addBtn).toBeVisible();
    await catalog.addCylinderToCart();

    // 5. Confirmar Checkout (ya tiene los datos)
    await catalog.checkout();

    // 6. Validar mensaje de éxito
    try {
      await expect(catalog.successMessage).toBeVisible({ timeout: 10000 });
    } catch (e) {
      if (await catalog.submitError.isVisible()) {
        const errorText = await catalog.submitError.textContent();
        throw new Error(`RPC Failed with error: ${errorText}`);
      }
      throw e;
    }
  });

  test('Cliente EXISTENTE pasa directo al catálogo', async ({ page }) => {
    page.on('console', msg => console.log(msg.text()));
    const catalog = new CatalogPage(page);
    
    // Primero, necesitamos un cliente que ya exista. Usamos un teléfono específico 
    // y lo registramos si no existe, o simplemente aprovechamos el comportamiento del RPC.
    // Como el bot de WhatsApp manda la URL con "?phone=", probemos ese entrypoint.
    
    // Asumimos que el teléfono 41999999999 ya existe o lo registramos on the fly.
    // Para asegurar que existe, lo registramos primero (o saltará directo al catálogo si existe)
    await catalog.goto();
    await catalog.submitPhone('41888888888');
    
    try {
      await expect(catalog.nameInput).toBeVisible({ timeout: 5000 });
      await catalog.registerCustomer('Cliente Frecuente', 1, 'Rua Antiga 456');
      await expect(catalog.addBtn).toBeVisible();
    } catch (e) {
      // Ya existía
      await expect(catalog.addBtn).toBeVisible();
    }
    
    // Ahora simulamos que entra otra vez (por link de WhatsApp)
    await catalog.goto('41888888888');
    
    // Debería ir directo al catálogo sin pedir registro
    await expect(catalog.addBtn).toBeVisible({ timeout: 10000 });
    await expect(catalog.nameInput).not.toBeVisible();
    
    // Verifica que el teléfono y dirección están pre-cargados
    await expect(catalog.phoneInput).toHaveValue('41888888888');
    // En solidJS el textarea asocia su value.
    await expect(catalog.addressInput).toHaveValue('Rua Antiga 456');
  });
});
