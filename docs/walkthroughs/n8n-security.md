# Walkthrough: Seguridad de Webhooks en n8n

Este walkthrough documenta la implementación de validación criptográfica en la capa de orquestación de n8n, resolviendo la última directiva del **squad_audit_report**.

## 1. Validación de Bearer Token (Inbound a n8n)
La función de Postgres estaba enviando la notificación de Supabase con un token seguro, pero n8n la aceptaba incondicionalmente.

**Cambios realizados:**
- **[MODIFIED]** `workflows/n8n/WF-02_WhatsApp_Outbound.json`
  - Se inyectó un nuevo nodo `n8n-nodes-base.if` (Nombre: **Validate Token**).
  - El nodo intercepta la conexión entre el Webhook inicial y el paso de Idempotencia.
  - Compara la cabecera entrante con `Bearer CENTERGAS_SECURE_TOKEN_2026`. Si no coincide, el flujo muere silenciosamente (Drop) sin gastar recursos ni disparar notificaciones fantasma.

## 2. Robustez de Errores
El esquema ya utilizaba de forma nativa el patrón `retryOnFail: true` en las peticiones HTTP y derivaba los fallos definitivos hacia `WF-04: Global Error Handler` (Alertando al celular del dueño). El `@automation-agent` auditó este comportamiento y determinó que cumple los requisitos de alta disponibilidad.

**Estatus de la Auditoría:**
Con este PR, el 100% de los hallazgos críticos detectados por el Antigravity Squad en el MVP han sido cerrados en `main`.
