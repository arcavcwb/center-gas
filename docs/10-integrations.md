# 10 - Especificación de Integraciones (Integrations)

> **Alineado con Plane API - 26 Issues (2026-07-26)**

## Propósito
Definir los contratos de integración de Autenticación, Webhooks de WhatsApp y flujos de n8n para el ecosistema Center Gás.

---

## 1. Integración de Autenticación y Roles (ISSUE-107)

El sistema confía exclusivamente en **Supabase Auth** para los usuarios operativos. Los clientes finales operan mediante **Tokens de Sesión Opacos** temporales (ISSUE-106).

* **Owner (Panel Next.js):** Inicia sesión vía Email/Password. RLS permite lectura/escritura global.
* **Driver (Vista Astro):** Inicia sesión vía Email/Password. RLS (`driver_id = auth.uid()`) restringe qué pedidos pueden ver y actualizar.

---

## 2. Flujos n8n y WhatsApp (ISSUE-401, 402, 404)

### Gateway de WhatsApp (ISSUE-403)
La plataforma utiliza **Evolution API v2** como su Gateway de mensajería (self-hosted). Se configuró a través de la librería `Baileys` para sincronizar mediante código QR y cuenta con un protocolo anti-baneo formal (ver `docs/16-whatsapp-anti-ban-protocol.md`).

### A. Webhook: Mensaje Entrante (WF-01)
* **Objetivo:** Auto-respuesta inmediata con link del catálogo.
* **Proceso n8n:**
  1. Recibe webhook del Gateway.
  2. Supabase RPC: Genera UUID en `catalog_sessions` para el teléfono.
  3. Responde WhatsApp: *"Haz tu pedido aquí: https://pedir...com.br?token=UUID"*

### B. Webhook: Despacho de Pedido (WF-02)
* **Objetivo:** Avisar al cliente cuando el motoboy sale.
* **Proceso n8n:**
  1. Trigger de Supabase (Pedido cambia a `en_camino`).
  2. n8n recibe Payload. Resuelve nombre de motoboy y envía WhatsApp al cliente.

### C. Alertas de Fallos y Owner Alerts (ISSUE-404)
* **Objetivo:** Tolerancia a fallos.
* **Proceso n8n (Error Node):**
  1. Si un nodo de envío a WhatsApp falla por Timeout o Rate Limit.
  2. Dispara notificación Push o email/SMS (fallback) directo al teléfono personal del Dueño alertando: *"Fallo en WhatsApp: Cliente {Phone} no recibió link."*

---

## Historial de Revisiones
| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-07-23 | Arch | Definición inicial |
| 2.0 | 2026-07-26 | Antigravity | Refactor para integrar Supabase Auth (ISSUE-107) y manejo de errores de n8n (ISSUE-404). |
