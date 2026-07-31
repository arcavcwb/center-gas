# Contexto del Proyecto: Center Gás Curitiba (AI Summary)

> **Alineado con Plane API - 26 Issues (2026-07-26)**

Este documento sirve como resumen del estado actual y la arquitectura del proyecto para contextualizar a un nuevo modelo de inteligencia artificial o desarrollador que se una al proyecto.

## 1. Estado Actual (Fase Planificación Finalizada)
- El Product Discovery, PRD, Reglas de Negocio, UX/UI, DB Design y Flujos de Agentes han sido **auditados y 100% alineados** con la API de Plane (26 Issues).
- La arquitectura técnica se ha pivotado a un modelo Híbrido (Monorepo Turborepo).

## 2. Arquitectura Técnica Definida (Monorepo)
- **Base de Datos & Auth:** Supabase (PostgreSQL 15).
- **`apps/site` (Catálogo + Drivers):** Astro framework con SolidJS. Ultra rápido y sin JS pesado inicial (LGPD Token-based URL).
- **`apps/web` (Kanban Dueño):** Next.js con React. Panel Realtime denso de mutaciones simultáneas.
- **`packages/contracts`:** Única fuente de validación Zod compartida.
- **Backend/Integraciones:** n8n + Meta/Evolution API para orquestar los WhatsApp inbound/outbound.

## 3. Reglas Críticas del Dominio (The Center Gás "Gotchas")
1. **Cascos (Vasilhames):** Distinguir siempre "Recarga" (entrega casco) de "Completo" (compra gas+casco por 1ra vez). (ISSUE-304, ISSUE-105).
2. **Troco (Cambio):** Si el pago es efectivo, el sistema debe obligar a preguntar "Troco para R$ X", de lo contrario el motoboy no sabe con cuánto cambio salir (ISSUE-303).
3. **Ingreso Telefónico:** El Dueño necesita un formulario para meter pedidos a mano que le llegan por audio/teléfono directamente en el Kanban (ISSUE-203).
4. **Fidelidad Automática:** Trigger 8->1 (ISSUE-502).

## 4. Diseño de Base de Datos (PostgreSQL DDL v2.0)
Cuenta con **10 tablas** transaccionales estrictas con RLS:
1. `profiles`: (Auth) Dueños y Repartidores.
2. `neighborhoods`: Barrios de cobertura (Seed).
3. `customers`: Clientes finales, historial de puntos.
4. `catalog_sessions`: Tokens opacos para el link de catálago.
5. `products`: SKUs, flag de si "incluye cilindro".
6. `orders`: Transaccional (`payment_method`, `cash_change_for` [troco], `cylinder_returned`).
7. `order_items`: Detalle carrito.
8. `order_status_history`: **Auditoría inmutable** de cada cambio de estado, cancelaciones y reasignaciones (ISSUE-108).
9. `system_config`: Vars operativas (precios de cascos, descuento combo).

## 5. Siguientes Pasos
El proyecto está 100% listo a nivel documentación para iniciar el **Sprint 1 (ISSUE-101 e ISSUE-108)**: 
1. `npx create-turbo@latest` para el monorepo.
2. Migraciones DDL y RLS a la DB de Supabase.
