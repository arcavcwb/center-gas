# Walkthrough: ISSUE-809 - Servicio Propio de Enlaces Cortos (WhatsApp Auto-Link) & Tracking de Clics

## 🎯 Objetivo
Implementar y verificar con filosofía Zero-Trust y arquitectura Lean (Ponytail) la **Opción B (WhatsApp Auto-Link)** para el catálogo digital de Center Gás:
1. **Reducción Radical de URL:** Pasar de enlaces sobrecargados de **105 caracteres** (`https://center-gas-site.vercel.app/?token=...`) a enlaces compactos de **33 caracteres** (`center-gas-site.vercel.app/xxxxxx`), logrando una reducción del **68.5%**.
2. **Auto-Link Nativo en WhatsApp:** Prescindir de acortadores externos (tipo Bitly) que activan filtros anti-spam de Meta, aprovechando el reconocimiento nativo del TLD `.app` en clientes móviles Android e iOS.
3. **Tracking de Clics en Base de Datos:** Auditar en tiempo real la apertura del catálogo actualizando `catalog_sessions.used_at` al momento de resolverse el token.
4. **URL Stripping Silencioso:** Limpiar de inmediato la barra de direcciones del navegador móvil con `history.replaceState({}, '', '/')` para máxima privacidad y estética visual.
5. **Cero Cold Starts (TTI < 150ms):** Evitar lambdas de SSR pesado en Astro utilizando reglas de reescritura en el Edge CDN de Vercel (`vercel.json`).

---

## 🛠️ Cambios Implementados

### 1. Base de Datos / Supabase
- **Migración [`supabase/migrations/20260907230000_compact_catalog_tokens.sql`](file:///home/arcav/projects/center-gas/center-gas-platform/supabase/migrations/20260907230000_compact_catalog_tokens.sql):**
  - Se actualizó la función `generate_catalog_session(p_phone, p_rate_limit_minutes)`.
  - Generación de token alfanumérico Base62 de exactamente 6 caracteres (`[0-9a-zA-Z]`, 56.8 billones de combinaciones) a partir de `gen_random_bytes(6)`.
  - Bucle de control de colisión `LOOP ... EXIT WHEN NOT EXISTS (SELECT 1 FROM catalog_sessions WHERE token = v_token)` con límite de reintento.
  - Mantenimiento del rate limit atómico de 10 minutos por teléfono.

### 2. Frontend Móvil (`apps/site`)
- **Vercel Edge Rewrites ([`apps/site/vercel.json`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/vercel.json)):**
  - Regla de reescritura: `/:token([a-zA-Z0-9]{6}) -> /`. Permite a Vercel servir instantáneamente el HTML estático cacheado en Edge CDN en ~15ms.
- **Vite Dev Server Plugin ([`apps/site/astro.config.mjs`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/astro.config.mjs)):**
  - Middleware que emula localmente la reescritura de tokens de 6 caracteres para desarrollo offline.
- **Componente Catálogo ([`apps/site/src/components/Catalog.tsx`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/src/components/Catalog.tsx)):**
  - Extracción híbrida de token: lee tanto rutas directas (`pathname`: `/xxxxxx`) como parámetros de consulta (`searchParams`: `?token=...`) para retrocompatibilidad total.
  - En `handleTokenCheck`, ejecuta `window.history.replaceState({}, '', cleanUrl.toString())` eliminando el token de la barra de navegación.

### 3. Automatizaciones n8n
- **Flujo Inbound ([`workflows/n8n/WF-01_WhatsApp_Inbound.json`](file:///home/arcav/projects/center-gas/center-gas-platform/workflows/n8n/WF-01_WhatsApp_Inbound.json)):**
  - Actualización del nodo "Enviar Auto-Respuesta" para inyectar el formato Auto-Link sin `https://`:
    `🔗 center-gas-site.vercel.app/{{ $('Generate Catalog Token').first().json.token }}`
  - Workflow sincronizado y verificado en la instancia activa de n8n (`S28GbSKscgVXBzJy`).

### 4. Suite E2E de WhatsApp
- **Validación Automatizada ([`scripts/test-e2e-whatsapp-lifecycle.js`](file:///home/arcav/projects/center-gas/center-gas-platform/scripts/test-e2e-whatsapp-lifecycle.js)):**
  - Comprobación estricta de que el token generado mida exactamente 6 caracteres alfanuméricos.
  - Verificación del formato del link (33 caracteres).
  - Simulación de apertura del catálogo por el cliente y aserción de que `catalog_sessions.used_at` registre el timestamp del clic.

---

## 📊 Resultados de Verificación Empírica

```bash
pnpm run test:whatsapp
```

```text
================================================================
🚀 TEST E2E INTEGRAL: FLUJO COMPLETO DE WHATSAPP (MODALIDAD B)
   Inbound (Catálogo) + Outbound (Notificaciones) + Limpieza
================================================================

🔍 [Fase 0] Verificando salud de la infraestructura...
   ✓ Evolution API [centerGas]: Estado de conexión = open
   ✓ Evolution Webhook: URL = https://n8n.arcav.us/webhook/evolution-inbound, Habilitado = true
   ✓ n8n WF-01 (Inbound): Activo = true
   ✓ n8n WF-02 (Outbound): Activo = true

📲 [Fase 1] Probando Flujo Inbound (Auto-Reply con Catálogo Segura)...
   🧹 Preparando estado limpio: removiendo sesiones recientes de catalog_sessions...
   📨 Disparando webhook inbound en n8n (https://n8n.arcav.us/webhook/evolution-inbound)...
   ✓ Webhook Inbound respondió con HTTP 200: {"key":{"remoteJid":"554198450477@s.whatsapp.net","fromMe":true,"id":"3EB06C26300F41FAAD715A"}...
   ⏳ Esperando 10 segundos (Delay Humano Anti-Robot en n8n)...
   ✅ Token Compacto Generado en Supabase (6 chars Base62): UckehJ
      Expiración: 2026-09-09T01:59:04.767093+00:00
      Link Auto-Link WhatsApp (33 chars): center-gas-site.vercel.app/UckehJ
   🖱️  Simulando apertura del enlace por el cliente en el navegador móvil...
   ✅ Click Tracking Validado en Supabase: used_at = 2026-09-08T01:59:22.300788+00:00

🛒 [Fase 2] Creando Pedido B2C con Regla de Negocio Combo BR-001 (Gas + Agua)...
   ✓ Productos para combo: Gas P13 (Recarga) (R$ 110) + Botellón de Agua 20L (Solo Recarga) (R$ 15)
   ✓ Orden creada exitosamente con ID: 67c1df8d-0646-42c4-a80f-14988d13ac1c
   📊 Verificación Financiera: Subtotal R$ 125.00 - Descuento R$ 5.00 = Total R$ 120.00
   ✅ REGLA BR-001 VALIDADA: Descuento de Combo de R$ 5,00 persistido correctamente.

🔔 [Fase 3] Verificando Notificaciones Outbound disparadas por PostgreSQL / n8n...
   ⏳ Esperando procesamiento de notificación: "nuevo"...
   ✅ Notificación [nuevo] Confirmada: Registrada en notifications_log (ID: 92001131-adbb-4f47-848b-ca9085181e24)
   🛵 Actualizando pedido a "en_camino" con motoboy Carlos...
   ⏳ Esperando procesamiento de notificación: "en_camino"...
   ✅ Notificación [en_camino] Confirmada: Registrada en notifications_log (ID: 5c1c2120-284a-49c1-bbae-56749e56381a)
   📦 Actualizando pedido a "entregado"...
   ⏳ Esperando procesamiento de notificación: "entregado"...
   ✅ Notificación [entregado] Confirmada: Registrada en notifications_log (ID: dcf5300e-d0e5-435f-bd2d-439a18f0f146)

🎉 ¡CICLO COMPLETO DE NOTIFICACIONES OUTBOUND VERIFICADO CON ÉXITO!

🧹 [Fase 4] Ejecutando Limpieza Idempotente Zero-Trust...
   Removiendo datos asociados al pedido 67c1df8d-0646-42c4-a80f-14988d13ac1c...
   Removiendo registros de prueba de catalog_sessions y customers (554198450477)...
✨ [Zero-Trust] Base de datos restaurada al 100%. Cero residuos.
================================================================
```

### Contratos, Diseño y Compilación
- **Impeccable Design Check (`pnpm run check:design`):** 🟢 0 anti-patrones detectados.
- **Pruebas de Contratos Zod (`pnpm --filter @center-gas/contracts test`):** 🟢 38/38 tests pasando.
- **Compilación Monorepo Turborepo (`pnpm run build`):** 🟢 100% PASS (`site` y `web` compilados limpiamente).
