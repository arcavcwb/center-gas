### 🚀 Descripción de la Épica 5 (n8n & WhatsApp)
Este Pull Request introduce la arquitectura de notificaciones asíncronas para el ecosistema Center Gas. Separa la lógica de envíos de WhatsApp del Core de la aplicación, utilizando webhooks y flujos visuales.

### 📋 Issues Resueltos en Plane
- **Closes ISSUE-401:** Setup n8n Instance and Build WhatsApp Inbound Auto-Reply Workflow
- **Closes ISSUE-402:** Build n8n Workflow for Automated Order Status Notifications
- **Closes ISSUE-403:** WhatsApp Provider Decision & Formal Setup

### 🛠️ Detalles de Implementación (Tech Specs)
1. **Flujos n8n exportados:**
   - Se agregaron los archivos `WF-01_WhatsApp_Inbound.json` y `WF-02_WhatsApp_Outbound.json` en `workflows/n8n/`.
   - Contienen la lógica de auto-respuesta entrante (Inbound) y notificación de cambio de estado de pedidos (Outbound).
2. **Supabase Webhooks (pg_net):**
   - Migración SQL `20260802000000_n8n_webhooks.sql` agregada.
   - Activa la extensión `pg_net` para peticiones HTTP asíncronas nativas desde Postgres.
   - Se creó el Trigger `order_status_webhook_trigger` para evitar cuellos de botella en la UI (el cliente Next.js/SolidJS no espera al proveedor de WhatsApp).

### 🔍 Notas para el @pr-reviewer-agent
- Por favor verifica la sintaxis del Trigger PL/pgSQL en la nueva migración.
- El PR cumple con los lineamientos de Gobernanza (Walkthrough generado y Plane Issues actualizados a Done).
