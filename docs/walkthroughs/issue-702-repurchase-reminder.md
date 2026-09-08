# Walkthrough: Recordatorio Proactivo de Recompra (45+ días) y Opt-Out LGPD (ISSUE-702)

## 📌 Resumen Ejecutivo
Se implementó de punta a punta la automatización de retención y ciclo de vida de clientes inactivos para Center Gás (**ISSUE-702** / Sequence ID 72):
1. **Detección Automatizada de Inactividad**: Identificación de clientes sin recompras en $\ge 45$ días desde su última entrega completada (`status = 'entregado'`).
2. **Cadencia Respetuosa Anti-Spam**: Ventana mínima de cooldown de 30 días (`INTERVAL '30 days'`) entre recordatorios sucesivos y exclusión absoluta de clientes con pedidos en curso (`nuevo`, `confirmado`, `asignado`, `en_camino`).
3. **Cumplimiento Estricto LGPD (Opt-Out)**: Manejo nativo de palabras clave (`SAIR`, `CANCELAR`, `PARAR`, `STOP`) en WhatsApp Inbound para desactivar instantáneamente comunicaciones promocionales (`allow_marketing = false`), con tolerancia al 9° dígito brasileño vía `get_phone_variants(phone)`.
4. **Flujo de Difusión n8n (`WF-05`)**: Cron diario (10:00 AM), procesamiento por lotes con retrasos aleatorios de 5 a 10 segundos para mitigar bloqueos de WhatsApp en Evolution API, generación de enlaces dinámicos con token de sesión de catálogo (`/c/:token`) y persistencia del envío (`record_repurchase_reminder_sent`).

---

## 🛠️ Archivos Modificados y Creados

| Archivo | Acción | Descripción |
|---|---|---|
| `supabase/migrations/20260908030000_repurchase_reminder.sql` | Creado | Migración DDL y DML: columnas `allow_marketing`, `last_repurchase_reminder_at`, `repurchase_reminders_count`, índice compuesto `idx_customers_repurchase_marketing` y RPCs seguras (`get_inactive_customers_for_repurchase_reminder`, `record_repurchase_reminder_sent`, `customer_opt_out_marketing`). |
| `workflows/n8n/WF-05_Repurchase_Reminder_Cron.json` | Creado | Workflow cron diario en n8n: consulta RPC, generación de enlace de catálogo personalizado, delay anti-ban, despacho por Evolution API y auditoría en BD. |
| `workflows/n8n/WF-01_WhatsApp_Inbound.json` | Modificado | Enrutamiento condicional para detectar comandos de opt-out ("SAIR", "CANCELAR"), invocar RPC `customer_opt_out_marketing` y responder confirmando la baja. |
| `docs/walkthroughs/issue-702-repurchase-reminder.md` | Creado | Documentación y reporte técnico de trazabilidad para el cierre de ISSUE-702. |

---

## 🔒 Contratos y Seguridad en Base de Datos

### RPCs Implementadas con `SECURITY DEFINER`:
1. `public.get_inactive_customers_for_repurchase_reminder(p_days_inactive INT, p_limit INT)`:
   - Filtra clientes con `allow_marketing = true`.
   - Aplica cooldown: `last_repurchase_reminder_at IS NULL OR last_repurchase_reminder_at <= NOW() - INTERVAL '30 days'`.
   - Excluye clientes con pedidos activos (`NOT EXISTS (orders WHERE status IN ('nuevo', 'confirmado', ...))`).
   - Permisos restringidos a `service_role` y `authenticated` (`REVOKE FROM public, anon`).
2. `public.record_repurchase_reminder_sent(p_customer_id UUID)`:
   - Incrementa `repurchase_reminders_count` y actualiza `last_repurchase_reminder_at = NOW()`.
3. `public.customer_opt_out_marketing(p_phone VARCHAR)`:
   - Desactiva `allow_marketing = false` para el cliente asociado al teléfono o a cualquiera de sus variantes (con o sin 9° dígito de Curitiba/PR).

---

## 🧪 Verificación y Auditoría Zero-Trust

1. **Ejecución y Test en Vivo de RPCs:**
   - Verificado con driver `pg` contra Supabase PostgreSQL:
     - `get_inactive_customers_for_repurchase_reminder(45, 10)` ejecutado exitosamente con 0 fallos.
     - `customer_opt_out_marketing` probado con éxito con variantes telefónicas.
2. **Tests de Contratos (`@center-gas/contracts`):**
   ```bash
   pnpm --filter @center-gas/contracts test
   # Vitest: 3 test files passed, 43 tests passed (100%)
   ```
3. **Auditoría Impeccable Design (`pnpm run check:design`):**
   ```bash
   pnpm run check:design
   # 0 anti-patrones detectados.
   ```
4. **Compilación Estática de Producción (`pnpm run build`):**
   - Turborepo: 2 packages (`site` Astro 5 y `web` Next.js 15) compilados con éxito sin advertencias ni errores.
