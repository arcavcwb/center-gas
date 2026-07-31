# Plane Features Breakdown

> **Alineado con Plane API (2026-07-26) y el Backlog de 26 Issues**

## Features List

### Epic 1: Autogestión del Cliente (`EPIC-01`)
* **`FEAT-101` - Seguridad y Sesión del Catálogo**
  * **Description:** Implementación de tokens opacos en URL (ISSUE-106).
  * **Module:** `MOD-01`
* **`FEAT-102` - Registro de Nuevos Clientes**
  * **Description:** Wizard de 2 pasos para primera compra con validación de barrio (ISSUE-104).
  * **Module:** `MOD-01`
* **`FEAT-103` - Vista de Catálogo y Productos**
  * **Description:** Página SSR (ISSUE-301) distinguiendo recarga de gas vs cilindro completo (ISSUE-304).
  * **Module:** `MOD-01`
* **`FEAT-104` - Lógica de Precios y Checkout**
  * **Description:** Descuento automático por combo (ISSUE-302) y captura de método de pago (PIX/Efectivo) con cálculo de vuelto "troco" (ISSUE-303).
  * **Module:** `MOD-01`

### Epic 2: Panel de Despacho del Dueño (`EPIC-02`)
* **`FEAT-201` - Tablero Kanban Realtime (Next.js)**
  * **Description:** Vista en tiempo real impulsada por Supabase (ISSUE-201).
  * **Module:** `MOD-02`
* **`FEAT-202` - Asignador de Motoboys y Cancelaciones**
  * **Description:** Modal de asignación a drivers activos y registro de motivos de cancelación (ISSUE-202).
  * **Module:** `MOD-02`
* **`FEAT-203` - Ingreso Manual de Pedidos**
  * **Description:** Formulario para carga directa de pedidos telefónicos y audios desde el Kanban (ISSUE-203).
  * **Module:** `MOD-02`

### Epic 3: CRM y Fidelización (`EPIC-03`)
* **`FEAT-301` - Motor de Lealtad en Base de Datos**
  * **Description:** Trigger en Supabase para sumar puntos con cada entrega y liberar beneficio según target (ISSUE-502).
  * **Module:** `MOD-03`

### Epic 4: Interfaz de Repartidores (`EPIC-04`)
* **`FEAT-401` - Vista Móvil Táctil para Motoboys**
  * **Description:** UI móvil (Astro+SolidJS) con auth y RLS para ver solo pedidos propios (ISSUE-501).
  * **Module:** `MOD-04`
* **`FEAT-402` - Control Obligatorio de Envase (Casco)**
  * **Description:** Flujo modal al marcar como "Entregado" para confirmar recepción de casco vacío o registrar cobro adicional (ISSUE-105).
  * **Module:** `MOD-04`

### Epic 5: Integraciones n8n/WhatsApp (`EPIC-05`)
* **`FEAT-501` - Selección y Setup de Proveedor WhatsApp**
  * **Description:** Definición estratégica y setup del proveedor de mensajería (ISSUE-403).
  * **Module:** `MOD-05`
* **`FEAT-502` - Bot Auto-Respuesta (WF-01)**
  * **Description:** Generación de token y envío rápido del catálogo ante mensajes entrantes (ISSUE-401).
  * **Module:** `MOD-05`
* **`FEAT-503` - Notificaciones Proactivas (WF-02)**
  * **Description:** Alerta automática "En Camino" gatillada por base de datos (ISSUE-402) y flujos de error handling (ISSUE-404).
  * **Module:** `MOD-05`

### Epic 6: Infraestructura y BD (`EPIC-06`)
* **`FEAT-601` - Especificación de Modelo de Datos**
  * **Description:** Documento detallado de DDL y máquina de estados (ISSUE-108).
  * **Module:** `MOD-06`
* **`FEAT-602` - Auth, Tablas y Políticas RLS**
  * **Description:** Migraciones iniciales en Supabase e identidad de usuarios (ISSUE-102, ISSUE-107).
  * **Module:** `MOD-06`
* **`FEAT-603` - Datos Base (Seed)**
  * **Description:** Script idempotente con barrios y precios (ISSUE-103).
  * **Module:** `MOD-06`
* **`FEAT-604` - Configuración Base Frontend**
  * **Description:** Estructura inicial del monorepo y tokens de diseño visual (ISSUE-101).
  * **Module:** `MOD-06`
