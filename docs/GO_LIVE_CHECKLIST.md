# GO-LIVE CHECKLIST: Center Gas Platform (v1.0.0)

> [!CAUTION]
> **ESTE DOCUMENTO DEBE SER REVISADO POR EL PROJECT OWNER ANTES DE APUNTAR LOS DOMINIOS REALES.**

Este checklist final garantiza que los sistemas B2B, B2C y la infraestructura asíncrona están 100% listos para recibir usuarios reales.

## 1. Supabase (Backend & Base de Datos)
- [ ] **Migraciones:** Todas las migraciones ejecutadas en el proyecto de producción.
- [ ] **Webhooks Activos:** La migración `20260802000000_n8n_webhooks.sql` debe estar aplicada y activada (`pg_net` extension enabled en el Dashboard de Supabase).
- [ ] **RLS Policies:** Validar que ninguna tabla está abierta al público (`anon` key). El acceso anónimo sólo puede usar el RPC `create_guest_order`.
- [ ] **Auth Settings:** Desactivar "Email Confirmations" si no se va a obligar a los motoboys a confirmar por correo.
- [ ] **API Keys:** Extraer las llaves `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` del proyecto productivo.

## 2. Frontend (Vercel / Netlify / Cloudflare Pages)
### apps/web (Dashboard Kanban & Motoboy)
- [ ] **Build:** `pnpm build --filter web` pasa sin errores.
- [ ] **Variables de Entorno:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] **Dominio SSL:** `app.centergas.com` (o el que se decida) apuntando a la app.

### apps/site (Catálogo de Cliente Final)
- [ ] **Build:** `pnpm build --filter site` pasa sin errores.
- [ ] **Variables de Entorno:** 
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
- [ ] **Dominio SSL:** `pedidos.centergas.com` configurado con HSTS.

## 3. Automatización n8n & WhatsApp
- [ ] **Flujos Importados:** Verificar en `n8n.arcav.us` que `WF-01` y `WF-02` están activos.
- [ ] **Credenciales de Evolution API:** 
  - En n8n, verificar que las variables/nodos HTTP hacia Evolution API tienen la URL y el API Key correcta de producción.
- [ ] **Sincronización Supabase -> n8n:** Hacer un pedido de prueba y verificar que el trigger en PostgreSQL realmente disparó el webhook y llegó a n8n.

## 4. Pruebas End-to-End Automatizadas (Staging / Local)
- [ ] **Prohibición Estricta:** NUNCA realizar pedidos falsos o de prueba en la base de datos de producción (ensucia analíticas, métricas de retención y puede disparar costos de Evolution API).
- [ ] Ejecutar localmente la suite de Playwright (`pnpm exec playwright test` en `apps/e2e`) apuntando a la base de datos local de Supabase.
- [ ] Validar que los 3 flujos pasaron exitosamente (Cliente, Dueño, Motoboy) antes de desplegar el código a Vercel/Netlify.

---
**Firma de Go-Live:** 
- **QA Pass:** ✔️ Aprobado por Playwright E2E.
- **Architect Pass:** ✔️ Aprobado por Antigravity.
- **Owner Pass:** [ ] Pendiente firma humana.
