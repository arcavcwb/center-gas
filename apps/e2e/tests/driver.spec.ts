import { test, expect } from '@playwright/test';
import { DriverApp } from '../pages/DriverApp';

test.describe('Flujo de Repartidor (Motoboy)', () => {
  test('Motoboy puede recibir, aceptar y entregar pedido con envase vacío', async ({ page }) => {
    const driver = new DriverApp(page);
    
    // 1. Login
    await driver.login('driver@centergas.com', 'driver123'); // Credentials de prueba
    
    // 2. Aceptar el pedido entrante
    // Requiere que el seed o la prueba del Owner asigne el pedido
    await driver.acceptOrder();

    // 3. Marcar como entregado validando el envase
    await driver.markAsDelivered();
    
    // 4. Validar que la pantalla vuelve al estado de Home "Esperando pedidos"
    await expect(page.locator('text="Esperando nuevos pedidos..."')).toBeVisible();
  });
});
