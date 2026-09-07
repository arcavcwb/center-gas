# Walkthrough: Integración de Contratos, Descuento de Combo (BR-001) & Catálogo B2C

> **Rama:** `feat/catalog-combo-and-contracts-integration`  
> **Fecha:** 2026-09-07  
> **Filosofía:** "Plane for the Business, Git for the Code" — Zero-Trust Backend & Testing Pyramid

---

## 🎯 Resumen Ejecutivo
Se unificaron las reglas de negocio centralizadas de `@center-gas/contracts` tanto en el Frontend B2C (`apps/site` en Astro + SolidJS) como en el Backend PostgreSQL (`create_b2c_order` RPC en Supabase). Ahora el cliente ve el cálculo de descuento por combo (Gás P13 + Água 20L = -R$ 5,00) en tiempo real, el banner de cross-selling sugiere agua mineral con los SKUs correctos, los números telefónicos se normalizan con el código de país `55` de Brasil y las pruebas de integración en `test_rpc.js` son 100% idempotentes y auto-limpiantes.

---

## 🛠️ Cambios Realizados

### 1. Conexión de Paquetes Monorepo
- **[`apps/site/package.json`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/package.json):** Se vinculó `"@center-gas/contracts": "workspace:*"`.
- **[`packages/contracts/src/index.ts`](file:///home/arcav/projects/center-gas/center-gas-platform/packages/contracts/src/index.ts):** Se agregó el campo contable `discount_applied` al `OrderSchema`.

### 2. Catálogo B2C de Autoservicio (`apps/site/src/components/Catalog.tsx`)
- **Regla BR-001 (Combo):** Implementación de `calculateComboDiscount(items)`. Al agregar Gas y Agua, el cliente ve el badge dinámico `🔥 Descuento Combo (Gás + Água): -R$ 5,00` y el total descontado.
- **Cross-Selling de Agua Corregido:** Se reemplazó la búsqueda del SKU obsoleto `agua_20L` por detección inteligente de SKUs de agua (`water_refill` / `water_full`). Si el cliente tiene gas en el carrito, se resalta el ahorro de R$ 5,00.
- **Regla BR-003 (Normalización de Teléfonos):** Todo ingreso de teléfono se procesa con `normalizeWhatsAppPhone` asegurando compatibilidad total con Evolution API / WhatsApp (`5541...`).
- **Regla BR-002 (Validación de Troco):** Opciones de vuelto calculadas dinámicamente sobre el total real con descuento y validadas con `validateCashChange`.

### 3. Procedimiento Almacenado Zero-Trust en PostgreSQL (`create_b2c_order`)
- **[`supabase/migrations/20260907120000_combo_discount_in_checkout.sql`](file:///home/arcav/projects/center-gas/center-gas-platform/supabase/migrations/20260907120000_combo_discount_in_checkout.sql):**
  - La función en base de datos audita de forma determinística las cantidades de `P13` y `water`.
  - Calcula `v_discount_applied := LEAST(v_gas_qty, v_water_qty) * 5.00`.
  - Registra `discount_applied` en la tabla `orders` y almacena `total_amount = subtotal - discount_applied`.
  - Se aplicó exitosamente a la base remota mediante `supabase db push`.

### 4. Robustez en el Panel del Dueño (`apps/web/src/components/NewOrderModal.tsx`)
- Se normaliza el teléfono con `normalizeWhatsAppPhone` y se valida el monto de troco con `validateCashChange` al cargar pedidos manuales telefónicos.

### 5. Idempotencia y Cero Residuos (`test_rpc.js`)
- El script de prueba de integración ahora verifica que el pedido con combo efectivamente descuente R$ 5,00 en Supabase, y en su cláusula `finally` elimina el pedido y cliente de prueba con privilegios de `service_role`.

---

## 📊 Resultados de Verificación

```bash
$ pnpm run test:unit
✓ 24/24 tests passed (328ms) en @center-gas/contracts

$ pnpm run test:rpc
🧪 Iniciando prueba de RPC create_b2c_order y Descuento de Combo...
✓ Productos detectados: Gas (Gas P13 (Recarga), R$ 110) y Agua (Botellón de Agua 20L (Solo Recarga), R$ 15)
📦 Enviando pedido con Combo (Gas + Agua)...
✓ Orden creada con ID: e3357486-94c8-484d-90bf-6aee9e76f9e2
📊 Validación Financiera: Subtotal R$ 125.00 | Descuento BD: R$ 5.00 | Total BD: R$ 120.00
✅ REGLA BR-001 VERIFICADA: El descuento de R$ 5,00 se aplicó correctamente en la base de datos!
🧹 Limpiando registros de prueba de Supabase...
✨ Base de datos restaurada a estado limpio (0 residuos).

$ pnpm build
• turbo 2.10.7
  Tasks: 2 successful, 2 total (apps/site + apps/web)
  Time: 32.423s
```
