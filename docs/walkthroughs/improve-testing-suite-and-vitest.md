# Walkthrough: Reestructuración y Mejora Integral de la Suite de Pruebas

## 1. Problema Abordado
La pirámide de pruebas definida en `docs/14-agent-development-flow.md` carecía de su base fundamental:
1. **0% de Pruebas Unitarias:** Ninguna regla de negocio ni contrato Zod contaba con verificación automática.
2. **Playwright Inestable y Bloqueante:** El reporter HTML interactivo bloqueaba las ejecuciones en CI y terminales de agentes esperando entrada del usuario (`Ctrl+C`).
3. **Script de Integración Huérfano:** `test_rpc.js` fallaba por aislamiento de módulos en monorepo pnpm.

## 2. Solución Implementada
1. **Instalación y Configuración de Vitest (`packages/contracts`):**
   - Se añadió `vitest` y script `"test": "vitest run"`.
   - Se implementaron 24 pruebas unitarias que cubren:
     - **Contratos Zod:** `CustomerSchema`, `OrderSchema` (con máquina de estados exhaustiva), `ProductSchema`, `CartItemSchema`.
     - **Regla BR-001:** Descuento por Combo (R$ 5,00 por par Gas + Agua).
     - **Regla BR-002:** Validación de Troco y Pago en Efectivo.
     - **Regla BR-003:** Normalización de teléfonos con código de país Brasil (`55`).
     - **Regla BR-004:** Formato monetario BRL.
2. **Ajuste de Playwright E2E (`apps/e2e`):**
   - Se configuró `reporter: process.env.CI ? 'dot' : [['list'], ['html', { open: 'never' }]]` para evitar que el servidor de reportes se quede colgado esperando interacción humana.
   - Se habilitó la variable `E2E_BASE_URL` para permitir pruebas contra entornos remotos desplegados.
3. **Estabilización de Integración Supabase (`test_rpc.js`):**
   - Se inyectó la resolución de rutas hacia `apps/web/node_modules`, permitiendo ejecutar pruebas RPC directamente desde la raíz (`pnpm run test:rpc`).
4. **Scripts Granulares en `package.json`:**
   - `"test:unit"`: Ejecuta las pruebas unitarias de Vitest (<400ms).
   - `"test:rpc"`: Ejecuta la validación de RPC en vivo contra Supabase.
   - `"test:e2e"`: Ejecuta la suite de Playwright sin bloqueos.

## 3. Verificación Empírica
- **Vitest Unit Tests:** 24/24 tests pasando en 324ms.
- **Supabase RPC Test:** Exitoso (`create_b2c_order` respondió con Order ID).
- **Monorepo Build (`turbo build`):** 100% PASS (2/2 paquetes en verde en ~33s).
