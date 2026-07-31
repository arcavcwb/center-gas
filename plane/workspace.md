# Plane Workspace Configuration

## Workspace Overview
* **Project Name:** Center Gás Curitiba - Transformación Digital
* **Project Key / Identifier:** `CGC`
* **Description:** Plataforma completa de gestión de pedidos, despacho en tiempo real, CRM de fidelidad y automatización de WhatsApp para Center Gás Curitiba.
* **Project Icon:** 📦 🔥
* **Default Lead / Owner:** Lead Product Manager

## Project Goals
1. Digitalizar el 100% de la toma de pedidos vía WhatsApp y catálogo web para eliminar la atención manual repetitiva.
2. Centralizar el despacho de los 3 motoboys en un panel de control Kanban en tiempo real para el propietario.
3. Automatizar el programa de fidelidad (8->1) e historial de compras para maximizar la retención de clientes.

## Workflow States (Custom States)
| State Name | State Group | Color | Description |
|---|---|---|---|
| **Backlog** | Backlog | `#94A3B8` | Tareas identificadas no asignadas al ciclo activo |
| **Todo** | Unstarted | `#3B82F6` | Tareas listas para ser tomadas en el ciclo activo |
| **In Progress** | Started | `#F59E0B` | Tareas actualmente en desarrollo |
| **In Review** | Started | `#8B5CF6` | Tareas en revisión de código o pruebas QA |
| **Done** | Completed | `#10B981` | Tareas completadas y verificadas contra Acceptance Criteria |
| **Cancelled** | Cancelled | `#EF4444` | Tareas descartadas o duplicadas |

## Priorities
* **Urgent (P0):** Bloqueadores del MVP, caídas del servicio o fallos críticos en la cobranza/entrega.
* **High (P1):** Funcionalidades núcleo del flujo de trabajo (Order Flow, Dispatch, WhatsApp Webhooks).
* **Medium (P2):** Ajustes de UI/UX, contador de fidelidad, optimizaciones de carga.
* **Low (P3):** Mejoras cosmeticas o documentación secundaria.

## Project Members & Roles
* **Product Owner / Lead PM:** Gestión de backlog, historias de usuario y validación de AC.
* **Technical Architect / Tech Lead:** Arquitectura, esquema SQL de Supabase e integraciones n8n.
* **Frontend Developer:** Desarrollo de islas SolidJS y vistas Astro (Cliente, Dueño, Motoboy).
* **Backend / Integration Engineer:** Configuración de n8n, webhooks de WHAM y políticas RLS en Supabase.
