# Walkthrough: Refactorización Post-Auditoría 360 (MVP)

Este walkthrough documenta los cambios ejecutados en el repositorio bajo la rama `feat/refactor-mvp`, como respuesta directa a los hallazgos críticos detectados por el Squad durante la fase de auditoría.

## 1. Alineación de Zod con PostgreSQL
El `@architect-agent` detectó que la tabla de base de datos (`customers`) utilizaba los nombres de columna `name` y `address_line`, mientras que Zod esperaba `full_name` y `address`.

**Cambios realizados:**
- **[MODIFIED]** [packages/contracts/src/index.ts](file:///home/arcav/projects/center-gas/center-gas-platform/packages/contracts/src/index.ts)
  - Renombradas las propiedades del `CustomerSchema` para ser el reflejo 1:1 exacto de la base de datos de producción.

## 2. Tipado Estricto en React (Next.js)
El `@frontend-dev-agent` reportó que el uso de `(order as any)` rompía el linting de producción y ocultaba bugs de la UI.

**Cambios realizados:**
- **[MODIFIED]** [apps/web/src/components/KanbanBoard.tsx](file:///home/arcav/projects/center-gas/center-gas-platform/apps/web/src/components/KanbanBoard.tsx)
  - Se removió `any[]` y se inyectó el tipo oficial `Order[]` inferido de `@center-gas/contracts`.
  - La query de Join en Supabase se actualizó a los campos reales (`name`, `address_line`).
- **[MODIFIED]** [apps/web/src/components/OrderCard.tsx](file:///home/arcav/projects/center-gas/center-gas-platform/apps/web/src/components/OrderCard.tsx)
  - Eliminados todos los `as any`.
- **[MODIFIED]** [apps/web/src/components/NewOrderModal.tsx](file:///home/arcav/projects/center-gas/center-gas-platform/apps/web/src/components/NewOrderModal.tsx)
  - Inyectado el tipo `Product[]` en lugar de `any[]` para la carga del catálogo.
- **Resultado DevOps:** `pnpm run build --filter web` compila sin un solo error ni warning.

## 3. Seguridad de Webhook (Supabase a n8n)
El `@pr-reviewer-agent` reportó vulnerabilidad a ataques de Spoofing, dado que el webhook HTTP no tenía token de autenticación.

**Cambios realizados:**
- **[MODIFIED]** [supabase/migrations/20260829000000_mvp_water_seed_and_webhook.sql](file:///home/arcav/projects/center-gas/center-gas-platform/supabase/migrations/20260829000000_mvp_water_seed_and_webhook.sql)
  - Se agregó la cabecera `Authorization: Bearer CENTERGAS_SECURE_TOKEN_2026` a la función asíncrona `net.http_post()`. (En el futuro esto será movido a `Vault` nativo de Supabase, pero provee defensa perimetral inmediata para n8n).

> [!TIP]
> **Siguiente paso lógico para el negocio:** Actualizar el flujo en `n8n` para requerir y validar este Token Bearer en el nodo de "Webhook In".
