# Walkthrough Técnico: ISSUE-404

Este documento resume la implementación técnica del **ISSUE-404: n8n Error Handling, Owner Alerts & Order Confirmation Message**.

## 1. Arquitectura de Idempotencia y Notificaciones
Para garantizar que nunca se envíe una notificación de WhatsApp duplicada a los clientes, hemos implementado una tabla de registro de notificaciones (`notifications_log`). 

Antes de enviar cualquier mensaje a través de *Evolution API*, n8n primero hace un `HTTP POST` a Supabase intentando insertar un registro en esta tabla. 
Debido a la restricción `UNIQUE(order_id, notification_type)`, si el mensaje ya fue enviado, la inserción fallará con código HTTP 409 (Conflict). En n8n, este conflicto detiene silenciosamente la ejecución (nodo tipo *If*), evitando reenvíos si el *Webhook* se dispara por accidente varias veces.

## 2. Flujo Global de Manejo de Errores (WF-04)
Aprovechando la funcionalidad de **Error Trigger** nativa de n8n, hemos creado el flujo global `WF-04_Global_Error_Handler.json`.
Todos los demás flujos (WF-01 y WF-02/03) tienen este flujo configurado como su "Error Workflow".
Si un nodo en cualquier automatización principal falla persistentemente tras consumir todos sus reintentos, el Workflow de Error se dispara automáticamente, extrayendo el contexto exacto del error (`{{ $json.execution.error.message }}`) y enviándolo de inmediato por WhatsApp al dueño del negocio.

## 3. Webhooks a Producción (VPS)
En lugar de disparar las alertas a `localhost` (lo cual fallaría porque Supabase PostgreSQL y n8n corren en infraestructuras separadas), la migración `20260803015907_notifications_log_and_webhooks.sql` actualiza el trigger `notify_order_status_to_n8n` para apuntar directamente a `https://n8n.arcav.us/webhook/supabase-outbound-orders`.

## Resultados de Validación
* **Migraciones Supabase:** `20260803015907_notifications_log_and_webhooks.sql` aplicada con éxito usando `supabase db push`.
* **Despliegue en n8n:** Los flujos (WF-01, WF-02/03 y WF-04) fueron importados y activados en la instancia remota usando la API REST (`deploy_n8n_workflows.py`).
* **Hash:** `c0d8914`
