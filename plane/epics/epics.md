# Plane Epics Specification

> **Alineado con Plane API (2026-07-26)**

## Epics Overview

### Epic 1: `EPIC-01` - Autogestión de Pedidos del Cliente (Catálogo Front-End)
* **Business Goal:** Permitir a los clientes realizar pedidos recurrentes de gas y agua en menos de 10 segundos desde su teléfono sin fricciones.
* **Priority:** Urgent (P0)
* **Related Module:** `MOD-01` (Customer Experience)
* **Stack:** Astro + SolidJS (App `apps/site`)
* **Dependencies:** `EPIC-06` (Infraestructura y BD)
* **Acceptance Criteria:**
  * Uso de token de sesión seguro en URL (ISSUE-106).
  * Reconocimiento de cliente existente o wizard de registro (ISSUE-104).
  * Diferenciación de precios entre recarga y cilindro completo (ISSUE-304).
  * Validación de cobertura y descuento de combo automático (ISSUE-302).
  * Selección de método de pago (PIX/Efectivo) con cálculo de "troco" (ISSUE-303).

---

### Epic 2: `EPIC-02` - Panel de Control y Despacho en Tiempo Real (Dueño)
* **Business Goal:** Centralizar las ventas entrantes (web y teléfono) en un tablero Kanban para asignar pedidos a los motoboys.
* **Priority:** Urgent (P0)
* **Related Module:** `MOD-02` (Order Management)
* **Stack:** Next.js + React (App `apps/web`)
* **Dependencies:** `EPIC-06` (Infraestructura y BD)
* **Acceptance Criteria:**
  * Visualización Kanban en tiempo real (Nuevo, Confirmado, Asignado, En Camino, Entregado) vía Supabase Realtime (ISSUE-201).
  * Controles de asignación a motoboy activo y cancelaciones con motivo (ISSUE-202).
  * Formulario de creación manual para pedidos por teléfono/audio (ISSUE-203).

---

### Epic 3: `EPIC-03` - CRM e Historial de Fidelidad Automático
* **Business Goal:** Registrar las compras por cliente y aplicar beneficios de retención (ej. 8 -> 1) automáticamente.
* **Priority:** High (P1)
* **Related Module:** `MOD-03` (CRM & Loyalty)
* **Dependencies:** `EPIC-06`, `EPIC-01`
* **Acceptance Criteria:**
  * Incremento automático del contador vía Trigger en base de datos al estado `Entregado` (ISSUE-502).
  * Aplicación del beneficio en base a `system_config.loyalty_target`.

---

### Epic 4: `EPIC-04` - Interfaz Móvil para Repartidores (Motoboys)
* **Business Goal:** Transmitir direcciones, detalles de cobro y validación de envases a los motoboys en la calle.
* **Priority:** Urgent (P0)
* **Related Module:** `MOD-04` (Driver Operations)
* **Stack:** Astro + SolidJS (Ruta `/driver` en `apps/site`)
* **Dependencies:** `EPIC-02`, `EPIC-06`
* **Acceptance Criteria:**
  * UI móvil de alto contraste con botones grandes y link a GPS (ISSUE-501).
  * Control obligatorio de envase vacío (casco) al marcar como entregado (ISSUE-105).
  * Auth específica y RLS limitando vista solo a pedidos asignados.

---

### Epic 5: `EPIC-05` - Automatización de Mensajería (WhatsApp y n8n)
* **Business Goal:** Respuestas instantáneas y notificaciones proactivas al cliente para evitar fugas hacia la competencia.
* **Priority:** Urgent (P0)
* **Related Module:** `MOD-05` (Integrations)
* **Dependencies:** `EPIC-01`, `EPIC-06`
* **Acceptance Criteria:**
  * Definición de proveedor de WhatsApp (ISSUE-403).
  * WF-01: Auto-respuesta con link único del catálogo seguro en segundos (ISSUE-401).
  * WF-02: Alerta automática cuando el pedido pasa a "En Camino" (ISSUE-402).
  * Manejo de errores y alertas al dueño (ISSUE-404).

---

### Epic 6: `EPIC-06` - Infraestructura, BD y Autenticación
* **Business Goal:** Proveer backend seguro, esquema de base de datos sólido y setup inicial del monorepo.
* **Priority:** Urgent (P0)
* **Related Module:** `MOD-06` (Infrastructure)
* **Dependencies:** Ninguna (Base para todo el sistema)
* **Acceptance Criteria:**
  * Setup inicial del proyecto con tokens de diseño (ISSUE-101).
  * Spec completo de la máquina de estados y DDL (ISSUE-108).
  * Migraciones Supabase con RLS e índices (ISSUE-102).
  * Seed de datos base (precios, barrios de cobertura, config) (ISSUE-103).
  * Autenticación para dueños y motoboys (ISSUE-107).
