# Walkthrough: ISSUE-808 - Test E2E Integral del Ciclo Completo de WhatsApp

## 🎯 Objetivo
Ejecutar y validar de forma automatizada y con filosofía Zero-Trust el **circuito completo de WhatsApp de Center Gás** en producción:
1. **Flujo Inbound:** Recepción de mensaje de cliente en Evolution API (instancia `centerGas`), webhook en n8n (`WF-01`), RPC atómico `generate_catalog_session` en Supabase, delay humano anti-robot (4-9s) y entrega de auto-respuesta en WhatsApp con link autenticado al catálogo.
2. **Flujo B2C:** Creación de pedido con validación de la Regla de Negocio BR-001 (Descuento de R$ 5,00 en combo Gas P13 + Agua Mineral).
3. **Flujo Outbound:** Notificaciones automáticas disparadas por PostgreSQL / pg_net hacia n8n (`WF-02/03`) y enviadas por Evolution API para estados `nuevo`, `en_camino` (con motoboy Carlos) y `entregado`, auditadas con idempotencia en `notifications_log`.
4. **Limpieza Idempotente:** Eliminación completa de datos de prueba (0 residuos en base de datos).

---

## 🛠️ Cambios y Correcciones Implementadas

### 1. Corrección de Esquema y PostgREST en Supabase
- **Columna `created_at` en `catalog_sessions`:** Se identificó que la tabla original carecía de `created_at`, lo que causaba error en la consulta de rate limit (`SELECT created_at FROM catalog_sessions`). Se aplicó la migración `20260907220000_fix_catalog_sessions_and_overload.sql` agregando `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`.
- **Sobrecarga de Funciones (PGRST203):** Se eliminaron las definiciones sobrecargadas anteriores de `generate_catalog_session` que generaban ambigüedad `300 Multiple Choices` en PostgREST.
- **Retorno JSONB Seguro:** Se refactorizó `generate_catalog_session` para retornar un objeto JSON `{"token": "...", "rate_limited": false}`. Esto garantiza compatibilidad nativa con el parser de objetos de n8n HTTP Request, eliminando el fallo `Response body is not valid JSON`.

### 2. Sincronización de Flujo n8n (`WF-01: WhatsApp Inbound`)
- Se actualizaron las expresiones en el workflow `S28GbSKscgVXBzJy` en producción:
  - Nodo **"Token generado? (Rate Limit Check)"**: evalúa `{{ $json.token }}` (NotEmpty).
  - Nodo **"Enviar Auto-Respuesta"**: inyecta de forma precisa el token en el enlace: `https://center-gas-site.vercel.app/?token={{ $('Generate Catalog Token').item.json.token }}`.

### 3. Suite Automatizada E2E de WhatsApp (`scripts/test-e2e-whatsapp-lifecycle.js`)
- Se implementó un script integral ejecutable mediante `pnpm run test:whatsapp`:
  - **Fase 0:** Diagnóstico de salud de Evolution API (`centerGas` en estado `open`), verificación de webhook registrado y workflows activos en n8n.
  - **Fase 1:** Trigger de mensaje entrante, espera de delay humano anti-robot y confirmación de generación de sesión en Supabase.
  - **Fase 2:** Ejecución del RPC `create_b2c_order` y verificación contable del descuento de combo.
  - **Fase 3:** Verificación de notificaciones reactivas disparadas por triggers de Postgres a n8n para cada estado (`nuevo`, `en_camino`, `entregado`), comprobando la tabla de idempotencia `notifications_log`.
  - **Fase 4:** Limpieza automática y atómica de todas las órdenes, sesiones y clientes de prueba.

---

## 📊 Resultados de Verificación

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
   ✓ Webhook Inbound respondió con HTTP 200: {"key":{"remoteJid":"554198450477@s.whatsapp.net","fromMe":true,"id":"3EB075120CDF154836AA74"}...
   ⏳ Esperando 10 segundos (Delay Humano Anti-Robot en n8n)...
   ✅ Token de Catálogo Generado en Supabase: 76c68f7e20b80088dbcb97650244ac2164ff3ec65738c684f555329b3bc86286
      Expiración: 2026-09-09T00:43:42.731111+00:00
      Link entregado al cliente: https://center-gas-site.vercel.app/?token=76c68f7e...

🛒 [Fase 2] Creando Pedido B2C con Regla de Negocio Combo BR-001 (Gas + Agua)...
   ✓ Productos para combo: Gas P13 (Recarga) (R$ 110) + Botellón de Agua 20L (Solo Recarga) (R$ 15)
   ✓ Orden creada exitosamente con ID: 16802383-dd59-4090-82ca-529b062b5dc9
   📊 Verificación Financiera: Subtotal R$ 125.00 - Descuento R$ 5.00 = Total R$ 120.00
   ✅ REGLA BR-001 VALIDADA: Descuento de Combo de R$ 5,00 persistido correctamente.

🔔 [Fase 3] Verificando Notificaciones Outbound disparadas por PostgreSQL / n8n...
   ⏳ Esperando procesamiento de notificación: "nuevo"...
   ✅ Notificación [nuevo] Confirmada: Registrada en notifications_log (ID: b636e6a2-1d8a-4d73-85c7-2ae2dad73fbf)
   🛵 Actualizando pedido a "en_camino" con motoboy Carlos...
   ⏳ Esperando procesamiento de notificación: "en_camino"...
   ✅ Notificación [en_camino] Confirmada: Registrada en notifications_log (ID: 7dff8b81-7ee7-44e0-a6cc-811a927d8fd5)
   📦 Actualizando pedido a "entregado"...
   ⏳ Esperando procesamiento de notificación: "entregado"...
   ✅ Notificación [entregado] Confirmada: Registrada en notifications_log (ID: bca0a7a7-d4f5-4710-8126-1b5aa5e29ac0)

🎉 ¡CICLO COMPLETO DE NOTIFICACIONES OUTBOUND VERIFICADO CON ÉXITO!

🧹 [Fase 4] Ejecutando Limpieza Idempotente Zero-Trust...
   Removiendo datos asociados al pedido 16802383-dd59-4090-82ca-529b062b5dc9...
   Removiendo registros de prueba de catalog_sessions y customers (554198450477)...
✨ [Zero-Trust] Base de datos restaurada al 100%. Cero residuos.
================================================================
```

### Contratos y Diseño
- `pnpm run check:design`: 0 anti-patrones detectados.
- `pnpm --filter @center-gas/contracts test`: 38/38 tests passing.
