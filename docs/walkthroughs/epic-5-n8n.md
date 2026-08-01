# Walkthrough: Épica 5 (n8n & WhatsApp)

## Resumen Ejecutivo
Se diseñó la arquitectura de integración asíncrona entre **Supabase**, **n8n** y **WhatsApp** (Evolution API) aislando completamente el servidor principal de los tiempos de respuesta y bloqueos de WhatsApp, cumpliendo con los **ISSUE-401** y **ISSUE-402**.

## Archivos Clave Modificados/Creados
- **`workflows/n8n/WF-01_WhatsApp_Inbound.json`**: Flujo visual exportado listo para importar a n8n. Recibe Webhooks de WhatsApp y dispara una auto-respuesta con el enlace personalizado hacia el catálogo Astro.
- **`workflows/n8n/WF-02_WhatsApp_Outbound.json`**: Flujo visual exportado que escucha las notificaciones de estado asíncronas de la base de datos y envía los mensajes "En Camino" o "Entregado" al cliente final.
- **`supabase/migrations/20260802000000_n8n_webhooks.sql`**: Migración PostgreSQL que activa la extensión `pg_net` y crea la función/trigger `notify_order_status_to_n8n` sobre la tabla `orders`.

## Decisiones Técnicas
- **Comunicación Asíncrona (pg_net):** En lugar de crear un backend intermedio en Node o Next.js para enviar webhooks desde la app web, se decidió usar directamente la base de datos PostgreSQL (`pg_net.http_post`) para emitir webhooks al cambiar el `status`. Esto garantiza que ni el panel administrativo ni la app del motoboy se queden colgados esperando una respuesta HTTP.
- **Formato Standard n8n:** Los `.json` generados son formatos nativos de n8n v1+ y pueden ser importados desde la UI.

## Ejecución de Pruebas
1. Los archivos JSON tienen sintaxis válida y referencian las variables de entorno necesarias (`$env.EVOLUTION_API_URL`).
2. El SQL script verifica que el `TG_OP` sea `INSERT` o `UPDATE` y que el estado haya cambiado para evitar spam en WhatsApp.

## Siguiente Paso Manual (Deploy)
1. Importar `WF-01` y `WF-02` en la instancia de n8n.
2. Desplegar la migración de Supabase en producción.
3. Actualizar la variable `'http://localhost:5678/webhook/supabase-outbound-orders'` en la migración SQL por la IP pública del servidor n8n.
