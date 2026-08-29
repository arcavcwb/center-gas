# Contexto del Proyecto: Center Gás Curitiba (AI Summary)

> **Alineado con Plane API - 26 Issues (2026-07-26)**

Este documento sirve como resumen del estado actual y la arquitectura del proyecto para contextualizar a un nuevo modelo de inteligencia artificial o desarrollador que se una al proyecto.

## 1. Estado Actual (MVP Funcional - Épicas 1 a 5 Finalizadas)
- Se ha completado el desarrollo del MVP y su integración. Las **Épicas 1 a 5 están construidas, probadas y funcionales**.
- El catálogo de clientes (SolidJS), panel de despacho (Next.js), App del repartidor (Mobile First) y automatización de WhatsApp (n8n + Supabase) están completamente operativos.
- El proyecto entra en la fase final (Épica 6), centrada en pruebas e2e y monitoreo.

## 2. Arquitectura Técnica Definida (Monorepo)
- **Base de Datos & Auth:** Supabase (PostgreSQL 15). Roles (Dueño, Driver) reforzados con RLS estricto.
- **`apps/site` (Catálogo + Drivers):** Astro framework con SolidJS. Ultras livianos para móviles. UI del conductor con validación de cilindros y geolocalización.
- **`apps/web` (Kanban Dueño):** Next.js con React. Panel Realtime que centraliza el estado de toda la operación y asignación dinámica.
- **`packages/contracts`:** Única fuente de validación Zod compartida para payloads y llamadas a DB.
- **Backend/Integraciones:** n8n + Evolution API para orquestar los WhatsApp inbound (generación de link seguro) y outbound (notificación de entrega dinámica).

## 3. Reglas Críticas del Dominio (The Center Gás "Gotchas")
1. **Cascos (Vasilhames):** Distinguir siempre "Recarga" (entrega casco) de "Completo" (compra gas+casco por 1ra vez). (ISSUE-304, ISSUE-105).
2. **Troco (Cambio):** Si el pago es efectivo, el sistema debe obligar a preguntar "Troco para R$ X", de lo contrario el motoboy no sabe con cuánto cambio salir (ISSUE-303).
3. **Ingreso Telefónico:** El Dueño necesita un formulario para meter pedidos a mano que le llegan por audio/teléfono directamente en el Kanban (ISSUE-203).
4. **Fidelidad Automática:** Trigger 8->1 (ISSUE-502).

## 4. Diseño de Base de Datos (PostgreSQL DDL v2.1)
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

## 5. Siguientes Pasos (Épica 6)
El proyecto entra en **Pausa Estratégica / Iteración Manual** a petición del usuario. Cuando se retome, se abordará la **Épica 6**: 
1. `webapp-testing`: Configuración de Playwright para QA End-to-End.
2. `telemetría`: Integración de Sentry.io y OpenPanel.dev.
