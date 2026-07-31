# Plane Project Milestones

## Milestones Overview

### Milestone 1: M1 - Infraestructura & Base de Datos
* **Target Date:** Sprint 1 (2026-08-01 a 2026-08-14)
* **Status:** Planned
* **Description:** Setup inicial del proyecto (Astro + SolidJS + Next.js), base de datos PostgreSQL en Supabase con DDL, RLS, tokens seguros y flujo de registro de cliente nuevo.
* **Deliverables:**
  * Proyecto Astro + SolidJS compilando con tokens de diseño (`#F6842F`, `#046BD2`)
  * Proyecto Next.js inicializado para el dashboard
  * Esquema SQL ejecutado (10 tablas: Clientes, Direcciones, Productos, Repartidores, Pedidos, Ítems, Historial, Configuraciones, Comisiones, Tokens)
  * Políticas RLS activadas en todas las tablas
  * Semillas de productos y configuraciones cargadas
  * Sistema de tokens seguros para links de catálogo (ISSUE-106)
* **Related Documentation:** `docs/08-technical-architecture.md`, `docs/09-database-design.md`

### Milestone 2: M2 - Panel del Dueño (Kanban Realtime)
* **Target Date:** Sprint 2 (2026-08-15 a 2026-08-28)
* **Status:** Planned
* **Description:** Panel de despacho en tiempo real operativo para el propietario, construido en Next.js + React.
* **Deliverables:**
  * Tablero Kanban en Next.js + React con Supabase Realtime
  * Asignador visual de pedidos a repartidores
  * Modal de cancelación con motivo
* **Related Documentation:** `docs/06-prd.md` (Módulo 2), `docs/07-ui-ux.md`

### Milestone 3: M3 - Catálogo Cliente & Automatizaciones WhatsApp
* **Target Date:** Sprint 3 (2026-08-29 a 2026-09-11)
* **Status:** Planned
* **Description:** Catálogo web en Astro + SolidJS y workflows n8n de WhatsApp operativos.
* **Deliverables:**
  * Catálogo web móvil con reconocimiento telefónico vía token seguro
  * Descuento automático de combo y validación de cobertura
  * n8n + Evolution API configurados
  * Workflows WF-01 (auto-respuesta) y WF-02 (notificación "en camino") activos
* **Related Documentation:** `docs/06-prd.md` (Módulo 1), `docs/10-integrations.md`

### Milestone 4: M4 - Vista Motoboy, Fidelización & Go-Live
* **Target Date:** Sprint 4 (2026-09-12 a 2026-09-25)
* **Status:** Planned
* **Description:** Interfaz de repartidores en Astro + SolidJS, motor de fidelidad, QA completo y lanzamiento en producción.
* **Deliverables:**
  * Vista web móvil para los 3 motoboys con botón "Entregado" y enlace GPS
  * Validación de envase vacío (BR-001)
  * Motor de fidelidad 8->1 con trigger automático
  * Suite de tests Playwright aprobada
  * Go-Live en producción con monitoreo
* **Related Documentation:** `docs/06-prd.md` (Módulo 4), `docs/11-roadmap.md`, `docs/12-deployment.md`
