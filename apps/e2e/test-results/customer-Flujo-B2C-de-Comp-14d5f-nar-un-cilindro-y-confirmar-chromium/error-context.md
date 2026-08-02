# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer.spec.ts >> Flujo B2C de Compra >> Cliente puede seleccionar un cilindro, y confirmar
- Location: tests/customer.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text="Pedido Confirmado"')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text="Pedido Confirmado"')

```

```yaml
- banner:
  - heading "CENTER GÁS" [level=1]
  - button "Ayuda"
- main:
  - heading "¡Hola! Haz tu pedido" [level=2]
  - paragraph: Selecciona tus productos abajo.
  - img
  - heading "¡Pedido Confirmado!" [level=3]
  - paragraph: Tu pedido ha sido recibido y está siendo procesado. Te contactaremos por WhatsApp.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { CatalogPage } from '../pages/CatalogPage';
  3  | 
  4  | test.describe('Flujo B2C de Compra', () => {
  5  |   test('Cliente puede seleccionar un cilindro, y confirmar', async ({ page }) => {
  6  |     const catalog = new CatalogPage(page);
  7  |     
  8  |     // 1. Visitar catálogo
  9  |     await catalog.goto();
  10 | 
  11 |     // 2. Añadir producto
  12 |     await catalog.addCylinderToCart();
  13 | 
  14 |     // 3. Checkout con teléfono de prueba y dirección
  15 |     await catalog.checkout('41999999999', 'Rua das Flores 123');
  16 | 
  17 |     // 4. Validar mensaje de éxito
> 18 |     await expect(catalog.successMessage).toBeVisible({ timeout: 10000 });
     |                                          ^ Error: expect(locator).toBeVisible() failed
  19 |   });
  20 | });
  21 | 
```