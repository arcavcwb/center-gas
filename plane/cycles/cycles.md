# Plane Development Cycles (Sprints)

## Cycle Specifications

### Cycle 1: `CYCLE-01` - Sprint 1: Infraestructura & Base de Datos
* **Duration:** 2026-08-01 a 2026-08-14 (2 semanas)
* **Objectives:** Configurar proyecto Astro + SolidJS, desplegar Supabase con esquema DDL, implementar link seguro y flujo de registro de cliente nuevo.
* **Included Features:** `FEAT-601`, `FEAT-602`, `FEAT-103`, `FEAT-104`
* **Included Issues:** `ISSUE-101`, `ISSUE-102`, `ISSUE-103`, `ISSUE-104`, `ISSUE-106`
* **Dependencies:** Ninguna.
* **Deliverables:**
  * Proyecto Astro + SolidJS compilando con tokens de diseño.
  * Esquema SQL DDL ejecutado con 10 tablas relacionales en Supabase.
  * Políticas de seguridad RLS activadas en todas las tablas.
  * Semillas de catálogo y configuraciones cargadas.
  * Link seguro de catálogo con token de sesión (reemplaza `?tel=`).
  * Flujo de registro de cliente nuevo (primera compra).
* **Definition of Done (DoD):** Supabase autenticando peticiones, frontend Astro sirviendo el flujo básico de registro bajo enlaces seguros.

---

### Cycle 2: `CYCLE-02` - Sprint 2: Panel del Dueño & Despacho
* **Duration:** 2026-08-15 a 2026-08-28 (2 semanas)
* **Objectives:** Construir el panel de control Kanban en Next.js + React con Supabase Realtime.
* **Included Features:** `FEAT-201`, `FEAT-202`
* **Included Issues:** `ISSUE-201`, `ISSUE-202`
* **Dependencies:** `CYCLE-01`
* **Deliverables:**
  * Componentes React para las 4 columnas del Kanban (Nuevo, Asignado, Entregado, Cancelado).
  * Conexión Supabase Realtime API activa.
  * Selector de asignación de motoboys.
  * Modal de cancelación con registro de motivo.
* **Definition of Done (DoD):** Crear un pedido de prueba y verificar que aparece instantáneamente en la columna "Nuevos" sin refrescar la página. Asignar y cancelar pedidos correctamente.

---

### Cycle 3: `CYCLE-03` - Sprint 3: Catálogo Cliente & Automatizaciones
* **Duration:** 2026-08-29 a 2026-09-11 (2 semanas)
* **Objectives:** Construir catálogo web del cliente en Astro + SolidJS y conectar flujos de WhatsApp vía n8n.
* **Included Features:** `FEAT-101`, `FEAT-102`, `FEAT-501`, `FEAT-502`
* **Included Issues:** `ISSUE-301`, `ISSUE-302`, `ISSUE-401`, `ISSUE-402`
* **Dependencies:** `CYCLE-01`, `CYCLE-02`
* **Deliverables:**
  * Vista web móvil responsiva en Astro + SolidJS para catálogo de cliente.
  * Selector de productos con descuento automático de combo (`BR-009`).
  * Validación de cobertura de barrio (`BR-005`).
  * Instancia n8n configurada con Workflow WF-01 (auto-respuesta WhatsApp con `?token=`).
  * Workflow WF-02 (notificación "en camino" al cliente).
* **Definition of Done (DoD):** Un cliente manda WhatsApp, recibe auto-respuesta con link seguro, hace el pedido con descuentos aplicados, y recibe notificación al ser despachado.

---

### Cycle 4: `CYCLE-04` - Sprint 4: Vista Motoboy, Fidelización & QA
* **Duration:** 2026-09-12 a 2026-09-25 (2 semanas)
* **Objectives:** Desarrollar vista móvil de motoboys en Astro + SolidJS, implementar motor de fidelidad, y ejecutar QA completo.
* **Included Features:** `FEAT-401`, `FEAT-402`, `FEAT-301`
* **Included Issues:** `ISSUE-501`, `ISSUE-502`, `ISSUE-105`
* **Dependencies:** `CYCLE-02`, `CYCLE-03`
* **Deliverables:**
  * Interfaz móvil para repartidores con botón táctil "Entregado" y enlace GPS.
  * Pantalla de validación de envase vacío (BR-001).
  * Lógica de fidelización: incremento 8->1 y descuento 100% en pedido #9 de P13.
  * Suite de tests QA (Playwright).
  * Prueba piloto y lanzamiento en producción.
* **Definition of Done (DoD):** Operación completa end-to-end desde pedido en WhatsApp hasta validación de entrega por motoboy, sumando puntos de fidelidad correctamente. QA aprobado sin bugs bloqueantes.
