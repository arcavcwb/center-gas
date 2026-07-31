---
name: n8n-skills
description: Provee instrucciones para orquestar automatizaciones, manejar webhooks HTTP y configurar integraciones de WhatsApp usando n8n.
---
# n8n Automation Skills

## Propósito
Este skill guía al **Automation Agent** para desacoplar la lógica de notificaciones de la aplicación principal, utilizando webhooks y flujos visuales.

## Directrices de Orquestación (n8n)
1. **Desacoplamiento:** La aplicación web/Astro no debe comunicarse directamente con WhatsApp. Todo mensaje entrante o saliente pasa por n8n.
2. **Workflows Principales:**
   - **WF-01 (Inbound):** Escucha el Webhook de Evolution API/WHAM cuando un cliente escribe. Genera y responde automáticamente con un link seguro (`?token=XYZ`) hacia el catálogo web de Astro.
   - **WF-02 (Outbound):** Escucha los triggers de la base de datos (vía Supabase Webhooks) cuando un pedido cambia a estado "Asignado" o "En Camino", y envía una notificación de WhatsApp al cliente.
3. - **Manejo de Errores:** Implementar nodos de `Catch` para registrar fallos en el envío de mensajes sin bloquear la operación logística de gas.
