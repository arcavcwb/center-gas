# 06 - Documento de Requisitos del Producto (PRD)

> **Alineado con Plane API - 26 Issues (2026-07-26)**

## Propósito
Especificar en detalle los requisitos funcionales, historias de usuario y criterios de aceptación, estructurados rígidamente en las **6 Épicas (Epics)** que componen el desarrollo real según Plane.

---

## Épica 1: Autogestión de Pedidos del Cliente (Catálogo Front-End)
* **Stack:** Astro + SolidJS (`apps/site` - Islas interactivas aisladas vía Shadow DOM para robustez en móviles/iPhone)
* **Features Clave:**
  * **FR1.0 (ISSUE-301):** Construcción del catálogo web de autoservicio con reconocimiento de teléfono.
  * **FR1.1 (ISSUE-106):** Sesiones seguras en el catálogo basadas en Tokens JWT opacos (links de 24hs) para proteger datos (LGPD). Incluye UI de Fallback (Enlace Expirado) con botón de 1-clic a WhatsApp para solicitar token nuevo.
  * **FR1.2 (ISSUE-104):** Flujo de primer cliente con validación estricta de barrios desde BD y autocompletado inteligente de dirección usando API pública `ViaCEP`.
  * **FR1.3 (ISSUE-304):** Diferenciación visual y de precios en el catálogo entre "Recarga" (entrega casco) y "Cilindro Completo" (compra casco).
  * **FR1.4 (ISSUE-302):** Motor de cálculo de precios server-side (Combo discount automático) y Micro Cross-Selling (e.g., "Agregar 1 Agua 20L") en el checkout con un solo clic.
  * **FR1.5 (ISSUE-303):** Captura de método de pago. Si es "Efectivo", solicitar explícitamente "Troco para R$ ___".

## Épica 2: Panel de Control y Despacho en Tiempo Real (Dueño)
* **Stack:** Next.js + React (`apps/web`)
* **Features Clave:**
  * **FR2.1 (ISSUE-201):** Tablero Kanban SPA. Conexión Realtime vía Supabase Websockets. Columnas mapeadas 1:1 con la máquina de estados.
  * **FR2.2 (ISSUE-202):** Modal de asignación a motoboys activos y modal de cancelación que obliga a registrar el motivo en `order_status_history`.
  * **FR2.3 (ISSUE-203):** Formulario "Nuevo Pedido Manual" dentro del Kanban para digitalizar rápidamente las llamadas telefónicas entrantes.

## Épica 3: CRM e Historial de Fidelidad Automático
* **Stack:** Supabase Triggers + PostgreSQL
* **Features Clave:**
  * **FR3.1 (ISSUE-502):** Trigger transaccional atómico: Cuando un pedido pasa a `entregado`, sumar 1 al contador del cliente en BD. Al llegar a target (8), marcar flag de lealtad en perfil.

## Épica 4: Interfaz Móvil para Repartidores (Motoboys)
* **Stack:** Astro + SolidJS (`apps/site/driver`)
* **Features Clave:**
  * **FR4.1 (ISSUE-107, ISSUE-501):** Autenticación de driver vía Supabase Auth. Políticas RLS limitan la vista exclusivamente a los pedidos asignados a su ID.
  * **FR4.2 (ISSUE-501):** UI Táctil gigante (Mobile First). Contiene botón de GPS para Google Maps/Waze y muestra el campo clave: "Llevar Troco de: R$ __".
  * **FR4.3 (ISSUE-105):** Modal obligatorio de validación de envase. Al presionar "Entregado", debe confirmar si recogió el envase vacío esperado.

## Épica 5: Automatización de Mensajería (WhatsApp y n8n)
* **Stack:** n8n (Self-Hosted) + Gateway (Meta Cloud/Evolution)
* **Features Clave:**
  * **FR5.0 (ISSUE-403):** Decisión y configuración formal del proveedor de WhatsApp (Meta vs Evolution) para mitigación de riesgo de baneo.
  * **FR5.1 (ISSUE-401):** Workflow 01 (Inbound): Recepción en milisegundos, creación de Token en BD y envío automático del link seguro del catálogo.
  * **FR5.2 (ISSUE-402):** Workflow 02 (Outbound): Disparador por Webhook de Base de datos cuando el pedido pasa a "En Camino", avisando nombre del motoboy.
  * **FR5.3 (ISSUE-404):** Rutinas de reintentos y alertas al dueño (Fallback) si los webhooks de WhatsApp fallan o si hay caídas en el proveedor.

## Épica 6: Infraestructura, Base de Datos y Seguridad
* **Stack:** Supabase (BaaS) + pnpm workspaces + Vercel
* **Features Clave:**
  * **FR6.1 (ISSUE-101):** Configuración del monorepo base con `apps/web` (Next.js), `apps/site` (Astro) y `packages/contracts` (Zod).
  * **FR6.2 (ISSUE-108, ISSUE-102):** Spec DDL transaccional y Políticas RLS estrictas (Role Based).
  * **FR6.3 (ISSUE-103):** Seeding de datos (Products, Neighborhoods, System Configs).
  * **FR6.4 (ISSUE-601):** Plan de QA End-to-End y Checklist de salida a producción.
  * **FR6.5 (ISSUE-602):** Implementación de Telemetría Ligera (Lean Monitoring): Sentry para Errores UI/JS, Uptime Kuma (Salud del servidor) y OpenPanel (Analítica LGPD).

---

## Fuera de Alcance (Post-MVP)
Los siguientes Issues registrados en Plane están explícitamente fuera del alcance de este Sprint y no deben ser desarrollados por ningún agente:
* **ISSUE-701:** Owner KPIs Dashboard.
* **ISSUE-702:** Proactive Repurchase Reminder (inactive 45+ days).
* **ISSUE-703:** Business Hours & Scheduled Orders.
* **ISSUE-704:** Delivery Fee per Neighborhood.

---

## Historial de Revisiones
| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-07-23 | Lead PM | Borrador (4 módulos) |
| 2.0 | 2026-07-26 | Antigravity | Refactor: Mapeo exacto 1:1 a las 6 Épicas de Plane, stack monorepo, manejo n8n y Troco. |
| 2.1 | 2026-07-26 | Antigravity | Add: Integración ViaCEP, Micro Cross-Selling, UI Fallback JWT y Stack de Telemetría. |
