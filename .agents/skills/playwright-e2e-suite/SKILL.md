---
name: playwright-e2e-suite
description: >
  Protocolo de automatización de pruebas End-to-End (E2E) con Playwright.
  Enfocado en probar flujos reales de usuario sin mocks frágiles, usando selectores accesibles
  (getByRole, getByLabel), validaciones multi-viewport (mobile 390px y desktop 1280px)
  y ejecución headless determinista en CI.
license: MIT
---

# Playwright E2E Testing Suite

Las pruebas unitarias son insuficientes para garantizar que una aplicación funcione frente a usuarios reales. Fallos de enrutamiento, hidratación de componentes, selectores invisibles o CSS reactivo solo se detectan en el navegador. Esta skill establece la metodología para escribir pruebas E2E robustas y resistentes a refactorizaciones con Playwright.

---

## 1. Reglas Innegociables

1. **Selectores Basados en Accesibilidad (User-Facing First):**
   - **PROHIBIDO:** Usar clases de Tailwind o IDs frágiles (`page.locator('.bg-orange-600')` o `#btn-submit`).
   - **OBLIGATORIO:** Usar selectores semánticos:
     - `page.getByRole('button', { name: 'Confirmar Pedido' })`
     - `page.getByLabel('E-mail Corporativo')`
     - `page.getByPlaceholder('admin@centergas.com.br')`
     - `page.getByText('Entrega Finalizada!')`
2. **Cero Mocks Frágiles:**
   Probar el sistema real o servicios locales en lugar de mockear cada llamada de red, asegurando que los contratos de API y el DOM interactúen legítimamente.
3. **Validación Dual Responsive:**
   Todo flujo de usuario debe probarse como mínimo en:
   - **Mobile Viewport:** `390x844` (iPhone 14 / estándar Android).
   - **Desktop Viewport:** `1280x720`.
4. **Asincronía y Esperas Deterministas:**
   Nunca usar `page.waitForTimeout(3000)`. Usar aserciones automáticas de Playwright:
   ```typescript
   await expect(page.getByRole('heading', { name: 'Painel de Operações' })).toBeVisible({ timeout: 5000 });
   ```

---

## 2. Archivo Canónico `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

## 3. Ejemplo Canónico de Test E2E

```typescript
import { test, expect } from '@playwright/test';

test.describe('Flujo de Catálogo y Checkout', () => {
  test('debe permitir seleccionar un producto y avanzar al checkout', async ({ page }) => {
    await page.goto('/');

    // 1. Verificar carga del encabezado
    await expect(page.getByText('CENTER')).toBeVisible();

    // 2. Interactuar con botón de categoría
    const gasButton = page.getByRole('button', { name: /Gás GLP/i });
    if (await gasButton.isVisible()) {
      await gasButton.click();
    }

    // 3. Agregar producto
    const addButton = page.getByRole('button', { name: /Adicionar/i }).first();
    await expect(addButton).toBeEnabled();
    await addButton.click();

    // 4. Abrir carrito / checkout
    const cartButton = page.getByRole('button', { name: /Ver Pedido/i });
    await cartButton.click();

    // 5. Validar visibilidad del formulario
    await expect(page.getByLabel(/Nome/i)).toBeVisible();
  });
});
```

---

## 4. Checklist de Aceptación E2E

- [ ] ¿Los selectores son semánticos (`getByRole`, `getByLabel`)?
- [ ] ¿Se eliminaron los timeouts fijos (`waitForTimeout`)?
- [ ] ¿Pasa la suite completa en modo headless (`pnpm exec playwright test`)?
- [ ] ¿Se captura evidencia (screenshots/trazas) en fallos?
