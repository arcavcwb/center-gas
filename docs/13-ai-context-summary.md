# Contexto del Proyecto: Center Gás Curitiba (AI Summary)

> **Alineado con Plane API — 28 Issues / Épicas 1 a 5 + Sprint de Rediseño Impeccable Concluidos (Septiembre 2026)**

Este documento sirve como resumen ejecutivo y técnico del estado del proyecto para contextualizar a cualquier nuevo agente de inteligencia artificial o ingeniero que interactúe con el repositorio.

---

## 1. Estado Actual (Producción en Vercel & Sprint Impeccable Finalizado)
- **Despliegue Productivo Dual en Vercel:**
  - 🛒 **Catálogo Móvil B2C:** [https://center-gas-site.vercel.app](https://center-gas-site.vercel.app)
  - 🛵 **App do Entregador:** [https://center-gas-site.vercel.app/driver](https://center-gas-site.vercel.app/driver)
  - 💻 **Panel Operativo B2B & Kanban:** [https://center-gas-web.vercel.app](https://center-gas-web.vercel.app)
- **Épicas 1 a 5 Completadas al 100%:** Arquitectura base, base de datos PostgreSQL con RLS, catálogo cliente, flujos de WhatsApp/n8n, panel de despacho y app móvil de motoboys.
- **Sprint de Rediseño Impeccable:** Overhaul de diseño sin emojis, con contraste WCAG AA, targets táctiles $\ge 48\text{px}$, podio en métricas, banner simétrico bilingüe y 0 anti-patrones en el detector.

---

## 2. Arquitectura Técnica (Monorepo Turborepo + pnpm)
- **Base de Datos & BaaS:** Supabase (PostgreSQL 15) con Row Level Security (RLS) estricto y funciones RPC transaccionales (`create_order_with_items`, `update_order_status`, etc.).
- **`apps/site` (Catálogo + Drivers):** Astro 5 con SolidJS. Peso JS cercano a cero, carga instantánea en conexiones 3G/4G móviles. La ruta `/driver` cuenta con suscripción Realtime a pedidos asignados y validación de vasilhames.
- **`apps/web` (Admin & Kanban):** Next.js 15 (App Router con Turbopack), React y TailwindCSS. Conexión WebSocket persistente con `Supabase Realtime` y KPIs en vivo del turno.
- **`packages/contracts`:** Única fuente de verdad. Esquemas Zod y tipos TypeScript inferidos (`orderSchema`, `createOrderSchema`, `customerSchema`, `i18n`, `business-hours`). 38/38 unit tests con Vitest.
- **Backend/Mensajería:** n8n + Evolution API v2 para orquestación de WhatsApp inbound/outbound con mitigación de baneo.

---

## 3. Reglas Críticas del Dominio (The Center Gás "Gotchas")
1. **Regra de Ouro (CRÍTICO):** ESTRICTAMENTE PROHIBIDO mencionar "entrega gratis" o "entrega grátis" en cualquier parte de la UI o metadatos.
2. **Cascos / Vasilhames (BR-002):** Diferenciar siempre "Recarga" (devolución del botijão vacío) de "Venda de Casco" (+ R$ 200,00 de tasa si no se devuelve el vacío). Tanto el cliente como el repartidor confirman esta condición.
3. **Troco Exacto (ISSUE-303):** En pagos en efectivo, el sistema exige ingresar con cuánto pagará el cliente para calcular y mostrar el troco exacto al repartidor.
4. **Combos Automáticos (ISSUE-302):** Descuento automático de R$ 5,00 al combinar 1x Gas P13 con 1x Agua 20L en el carrito.
5. **Horario Comercial & Agendamiento (ISSUE-703):** Ventana de entrega de 08:00 a 20:00 (`America/Sao_Paulo`). Los pedidos fuera de horario o en domingo se confirman automáticamente para salir el siguiente día hábil a partir de las 08:30.
6. **Bilingüe Nativo (`pt-BR` / `es`):** Soporte idiomático transparente con alternancia de idioma sin recarga de página.
7. **Fidelidad Automática (ISSUE-502):** Cada compra incrementa el contador de puntos del cliente hacia la bonificación 8->1.

---

## 4. Estructura de Base de Datos (PostgreSQL DDL)
10 tablas transaccionales con RLS activo:
1. `profiles`: Usuarios de sistema (Dueño, Repartidores).
2. `neighborhoods`: Cobertura oficial (Pinheirinho, Capão Raso, CIC, etc.).
3. `customers`: Clientes finales, teléfono E.164, historial y puntos.
4. `catalog_sessions`: Tokens opacos para enlaces de acceso rápido.
5. `products`: SKUs activos (Gas P13, Agua 20L, accesorios).
6. `orders`: Transaccional (`payment_method`, `cash_change_for`, `cylinder_returned`, `scheduled_for`).
7. `order_items`: Desglose del carrito.
8. `order_status_history`: Auditoría inmutable de estados (`creado`, `asignado`, `en_camino`, `entregado`, `cancelado`).
9. `system_config`: Parámetros operativos (precios, tasa vasilhame, combo discount).
10. `scheduled_orders`: Registro específico de pedidos agendados para turnos futuros.

---

## 5. Trazabilidad y Gobernanza
- **Filosofía:** *"Plane for the Business, Git for the Code"*.
- **Plane:** Todas las tareas están asociadas a Issues de Plane con reporte técnico HTML al cierre.
- **Git Flow:** Todo cambio entra mediante Pull Request, probado con unit tests y compilación estática antes de squash merge a `main`.
- **Gobernanza Visual (Impeccable Mandatorio):** Ningún código de UI se fusiona sin pasar `pnpm run check:design` (0 anti-patrones, WCAG AA, 0 emojis, touch targets $\ge 48\text{px}$).
- **Walkthroughs:** Documentación paso a paso de cada entrega en `docs/walkthroughs/`.
