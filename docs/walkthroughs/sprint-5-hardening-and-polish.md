# Walkthrough: Sprint 5 — Platform Hardening, Financial Consistency & UI/UX Polish

> **Sprint:** Sprint 5  
> **Module:** MOD-07: Platform Hardening & UI/UX Polish  
> **Issues Covered:** ISSUE-814, ISSUE-815, ISSUE-816, ISSUE-817, ISSUE-818, ISSUE-819, ISSUE-820  
> **Date:** 2026-09-08  
> **Branch:** `feat/sprint-5-hardening`  

---

## 1. Executive Summary

El **Sprint 5** ejecutó la resolución integral y atómica de todos los hallazgos críticos detectados en la auditoría técnica profunda del sistema Center Gás:
1. **Seguridad y Privacidad (PII/LGPD):** Eliminación de exposición pública en RPCs analíticas y restricción estricta de actualización de pedidos a gestor (`owner`) o conductor asignado (`driver`).
2. **Consistencia Financiera:** Persistencia explícita de `delivery_fee` en la tabla `orders` y recálculo automático del total en `create_b2c_order`.
3. **Regla de Negocio en Reparto:** Penalidad dinámica de vasilhame en `DriverApp` calculada en función del producto real (R$ 170 para botijão P13, R$ 20 para galão de água 20L).
4. **Control de Acceso y Sesión (RBAC):** Middleware de Next.js con `@supabase/ssr` para protección perimetral del panel web (solo rol `owner`) y botón de Logout en cabecera.
5. **Accesibilidad Móvil (WCAG 2.1 AA):** Desbloqueo del zoom de usuario (`user-scalable=yes`, remoción de `maximum-scale=1`) y dinamización del horario comercial en Curitiba.
6. **Excelencia Visual Impeccable & i18n:** 0 emojis unicode en interfaces, textos localizados al portugués brasileño (PT-BR) y erradicación de identificadores simulados en el tablero Kanban.

---

## 2. Issues Implementados & Cambios Técnicos

### [ISSUE-814] Blindaje de Seguridad en RPCs de Dashboard (PII/LGPD)
- **Archivo:** `supabase/migrations/20260908020000_security_hardening_rpcs.sql`
- **Cambios:**
  - Revocados permisos a `anon` y `PUBLIC` sobre `get_customers_with_stats`, `get_drivers_performance` y `get_loyalty_metrics`.
  - Verificación obligatoria de rol `public.is_owner()` al inicio de cada RPC antes de devolver métricas o datos personales.
  - Inclusión de `SET search_path = public, pg_temp;` para blindaje contra vulnerabilidades de path-injection.

### [ISSUE-815] Restricción de Autorización en `update_order_status`
- **Archivo:** `supabase/migrations/20260908020000_security_hardening_rpcs.sql`
- **Cambios:**
  - Exige autenticación (`auth.uid() IS NOT NULL`).
  - Restringe la mutación de estado a:
    1. Usuario con rol `owner`.
    2. Usuario con rol `driver` asignado a ese pedido específico (`v_order.driver_id = auth.uid()`).
  - Lanza excepción `P0001` si un usuario no autorizado intenta alterar el pedido.

### [ISSUE-816] Persistencia de Taxa de Entrega en `create_b2c_order` y Contratos
- **Archivos:** `supabase/migrations/20260908021000_delivery_fee_persistence.sql`, `packages/contracts/src/index.ts`
- **Cambios:**
  - Añadida columna `delivery_fee NUMERIC(10,2) DEFAULT 0.00` a la tabla `orders`.
  - Modificado `create_b2c_order` para buscar la tasa de entrega del barrio seleccionado y sumarla a `v_total_amount`.
  - Manejo de prevención de colisiones en `display_id` en caso de reintentos concurrentes.
  - Contrato Zod `OrderSchema` actualizado con `delivery_fee: z.number().nullable().optional()`.

### [ISSUE-817] Penalidad Dinámica de Casco en Driver App
- **Archivo:** `apps/site/src/components/DriverApp.tsx`
- **Cambios:**
  - Eliminada constante estática `PENALTY_FEE = 200.00`.
  - Creada función reactiva `penaltyFee()` que calcula R$ 170 por cilindro P13 y R$ 20 por galón de agua 20L si el cliente no entrega el envase vacío.
  - Modal de confirmación de entrega y desglose recalculado en tiempo real con `formatBRL(penaltyFee())`.

### [ISSUE-818] Middleware de Autenticación & RBAC en `apps/web`
- **Archivos:** `apps/web/src/middleware.ts`, `apps/web/src/lib/supabase.ts`, `apps/web/src/app/login/page.tsx`, `apps/web/src/components/Header.tsx`
- **Cambios:**
  - Instalado `@supabase/ssr` y configurado `createBrowserClient` en el frontend y `createServerClient` en el middleware de Next.js.
  - Protección de rutas `/` y `/metrics`. Redirección inmediata a `/login` si no hay sesión activa.
  - Verificación perimetral de rol `owner` en la tabla `profiles`. Si un conductor u otro rol intenta ingresar al panel web, se redirige con advertencia clara.
  - Integrado botón de **Sair (Logout)** en `Header.tsx` que ejecuta `supabase.auth.signOut()`.

### [ISSUE-819] Zoom Móvil WCAG 2.1 & Sincronización Header
- **Archivos:** `apps/site/src/layouts/Layout.astro`, `apps/site/src/pages/driver/index.astro`, `apps/site/src/pages/index.astro`
- **Cambios:**
  - Eliminado `maximum-scale=1` y `user-scalable=0` en los meta viewports para garantizar el cumplimiento del criterio WCAG 2.1 AA 1.4.4 (Resize Text).
  - Cálculo dinámico en `index.astro` basado en la zona horaria de Curitiba (`America/Sao_Paulo`) para mostrar si la distribuidora está abierta para entrega rápida o en horario de agendamiento programado.
  - Botón de refresco en la Driver App ajustado a touch target mínimo de 48×48px.

### [ISSUE-820] Erradicación de Emojis Unicode, i18n & Limpieza
- **Archivos:** `apps/web/src/components/OrderCard.tsx`, `apps/web/src/components/CancellationModal.tsx`, `apps/web/src/components/NewOrderModal.tsx`, `apps/web/src/components/KanbanBoard.tsx`, `apps/web/src/app/page.tsx`
- **Cambios:**
  - Reemplazo de emojis unicode (`🎁`, `⭐️`, `🛵`, `⚠️`) por iconos SVG vectoriales de Lucide (`Gift`, `Star`, `Truck`, `AlertCircle`).
  - Traducidos todos los modales (Cancelación, Nuevo Pedido Manual) del español a portugués de Brasil (PT-BR).
  - En `CancellationModal`, se muestra el identificador amigable `displayId` en lugar del UUID completo.
  - Eliminado arreglo `DEFAULT_DRIVERS` con datos inventados; `KanbanBoard` ahora consume exclusivamente la lista real de conductores activos desde Supabase.

---

## 3. Verificación y Calidad (Zero-Trust)

| Comando | Resultado | Notas |
|---|---|---|
| `pnpm --filter @center-gas/contracts test` | **43/43 PASS** | Contratos validados sin regresiones |
| `pnpm run check:design` | **0 Anti-patrones** | Cumplimiento estricto de Impeccable (0 emojis, contraste, touch targets) |
| `pnpm run build` | **Compilación Exitosa** | Turbo + Next.js 15 (Turbopack) + Astro 5 exitosos |

---

## 4. Próximos Pasos

1. Crear Pull Request en GitHub hacia `main`.
2. Actualizar las tareas en Plane (`ISSUE-814` a `ISSUE-820`) con el reporte técnico y mover el estado a `Done`.
