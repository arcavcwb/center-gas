# Walkthrough - [ISSUE-810] Resiliencia WhatsApp Inbound: Reenvío de Enlace Activo

## Resumen del Problema y Causa Raíz
Cuando un cliente enviaba un mensaje por WhatsApp, el sistema generaba un token de catálogo de 6 caracteres con vigencia de 24 horas. Sin embargo, la función RPC `generate_catalog_session` en PostgreSQL imponía un bloqueo estricto de 10 minutos por número telefónico (`p_rate_limit_minutes`), retornando `token: null, rate_limited: true`.
En `WF-01` de n8n, el nodo `Token generado?` evaluaba la condición como falsa y abortaba la ejecución silenciosamente. Esto provocaba que si el cliente volvía a escribir dentro de los 10 minutos (por ejemplo, porque no vio el enlace o quería consultarlo de nuevo), el bot permanecía en silencio absoluto, causando la sensación de que el servicio estaba caído.

---

## Solución Implementada (Arquitectura Resiliente & Idempotente)

### 1. Base de Datos / Supabase
- **Migración [`supabase/migrations/20260908000000_resilient_catalog_sessions.sql`](file:///home/arcav/projects/center-gas/center-gas-platform/supabase/migrations/20260908000000_resilient_catalog_sessions.sql):**
  - Se modificó la función PL/pgSQL `generate_catalog_session(p_phone, p_rate_limit_minutes)`.
  - Si el teléfono posee una sesión previa generada dentro de la ventana de rate limit (`created_at >= NOW() - interval`) y dicha sesión sigue vigente (`expires_at > NOW()`), la base de datos **retorna atómicamente el mismo token activo** (`reused: true, rate_limited: false`).
  - La reutilización es efectiva tanto si el cliente aún no abrió el enlace como si ya lo abrió en el navegador móvil (`used_at` de Click Tracking).
  - Cero inserciones duplicadas en la base de datos (garantía anti-bloat y anti-flooding).

### 2. Orquestación n8n
- El workflow `WF-01` en producción (`https://n8n.arcav.us`) recibe el token activo con `rate_limited: false`, permitiendo que el bot responda de inmediato con el mensaje de auto-respuesta y el link corto correspondiente (`center-gas-site.vercel.app/xxxxxx`).

### 3. Suite E2E de WhatsApp
- **Validación Automatizada ([`scripts/test-e2e-whatsapp-lifecycle.js`](file:///home/arcav/projects/center-gas/center-gas-platform/scripts/test-e2e-whatsapp-lifecycle.js)):**
  - Se agregó el paso 1.5 que invoca `generate_catalog_session` dos veces seguidas para el mismo número dentro de la ventana de rate limit y verifica que el segundo retorno posea el mismo token y la bandera `reused === true`.

---

## Verificación y Pruebas Zero-Trust

| Prueba | Comando | Resultado |
|---|---|---|
| Impeccable Design Audit | `pnpm run check:design` | 0 anti-patrones |
| Contracts & Zod Schemas | `pnpm --filter @center-gas/contracts test` | 38/38 tests pasando |
| Turborepo Build | `pnpm run build` | Next.js 15 & Astro 5 PASS (100%) |
| WhatsApp E2E Suite | `pnpm run test:whatsapp` | Ciclo completo PASS (Inbound + Outbound + Resiliencia) |
