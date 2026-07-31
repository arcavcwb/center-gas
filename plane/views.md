# Plane Saved Views Configuration

## Pre-configured Views

### 1. MVP Core Backlog View
* **Filters:** `Type = Issue`, `State != Done`, `Module IN (Customer Front-End, Owner Panel, Delivery View, CRM)`
* **Layout:** Board (Grouped by State)
* **Purpose:** Vista diaria para el equipo de desarrollo centrada en los requerimientos del MVP.

### 2. Active Cycle View (Current Sprint)
* **Filters:** `Cycle = Active Cycle`
* **Layout:** Kanban (Grouped by State: Todo -> In Progress -> In Review -> Done)
* **Purpose:** Seguimiento diario del progreso del Sprint actual (Standup View).

### 3. High Priority & Blockers View
* **Filters:** `Priority IN (Urgent, High)`
* **Layout:** List (Sorted by Priority)
* **Purpose:** Identificación inmediata de tareas críticas y bloqueadores del sistema.

### 4. Module Breakdown View
* **Filters:** All Issues
* **Layout:** Grouped by Module
* **Purpose:** Visión holística del grado de avance por cada módulo del producto.

### 5. Roadmap Timeline View
* **Filters:** `Type = Epic`
* **Layout:** Gantt / Timeline Chart
* **Purpose:** Vista gerencial para monitorear entregables semanales del proyecto.

### 6. Defect & Bug Tracking View
* **Filters:** `Label = bug`
* **Layout:** List (Grouped by Priority)
* **Purpose:** Control de calidad e incidencias detectadas durante pruebas piloto y producción.

### 7. Architecture & Integration View
* **Filters:** `Label IN (database, backend, automation, whatsapp, security)`
* **Layout:** Board (Grouped by Module)
* **Purpose:** Vista para el Arquitecto Técnico e Ingeniero de Integraciones.
