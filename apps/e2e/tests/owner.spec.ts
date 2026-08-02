import { test, expect } from '@playwright/test';
import { KanbanPage } from '../pages/KanbanPage';

test.describe('Flujo B2B de Administrador', () => {
  test('Dueño puede ver un pedido nuevo y asignarlo', async ({ page }) => {
    const kanban = new KanbanPage(page);
    
    // 1. Login
    await kanban.login('owner@centergas.com', 'owner123'); // Credentials de prueba
    
    // 2. Ir a Kanban
    await kanban.goto();

    // 3. Mover tarjeta de Incoming a Assigned
    // NOTA: Para no depender de datos estáticos, este test asume que 
    // mockeamos la red o hay un script de seed corriendo antes del test.
    // Usamos un ID dummy que el seed script debe inyectar.
    await kanban.dragOrderToAssigned('mock-order-123');
    
    // 4. Validar que la tarjeta está en la nueva columna
    const orderInAssigned = kanban.assignedColumn.locator('[data-order-id="mock-order-123"]');
    await expect(orderInAssigned).toBeVisible();
  });
});
