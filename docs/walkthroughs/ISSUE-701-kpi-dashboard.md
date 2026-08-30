# Walkthrough: Dashboard de KPIs (Dueño) - ISSUE-701

## 1. Problema de Negocio
El Panel Kanban (B2B) servía perfectamente para la operación en vivo, pero el dueño del negocio carecía de visibilidad analítica e histórica. No era posible saber el rendimiento real de cada repartidor, ni identificar a los clientes más fieles que estaban a punto de alcanzar el premio de lealtad (Gas Gratis), ni visualizar rápidamente la base de clientes (CRM).

## 2. Solución Implementada
Se ha implementado un **Dashboard de Inteligencia de Negocio** y CRM ligero, delegando todo el procesamiento pesado a PostgreSQL (Supabase RPCs) para garantizar que el panel cargue de manera instantánea, sin importar cuántos miles de clientes se registren.

### Cambios Clave:
1. **Migración de Base de Datos (`20260830000000_owner_dashboard_rpcs.sql`):**
   - Se crearon 3 Remote Procedure Calls (RPC) de solo lectura (`SECURITY DEFINER`):
     - `get_drivers_performance`: Agrupa las órdenes entregadas por motoboy.
     - `get_loyalty_metrics`: Cuenta cuántos clientes están a 1 o 2 compras del gas gratis y cuántos premios están listos para ser canjeados.
     - `get_customers_with_stats`: Devuelve la lista unificada del CRM (puntos, entregas, LTV [Lifetime Value] y última fecha de compra).

2. **Frontend Panel Dueño (`apps/web/src/app/(dashboard)/metrics/page.tsx`):**
   - Se añadió un sistema de navegación global en `layout.tsx` para alternar entre el **Kanban Operativo** y el **Dashboard KPIs**.
   - Se construyó la pantalla de Métricas, que incluye las `StatCards` para lealtad, el `DriversLeaderboard` (Tabla de Posiciones de Repartidores), y una tabla interactiva de `CustomersTable.tsx` con buscador en tiempo real por teléfono y nombre.

## 3. Criterios de Aceptación Cumplidos
- [x] El dueño puede ver a todos los clientes que compraron y su saldo gastado.
- [x] El dueño puede visualizar un ranking de repartidores por entregas completadas.
- [x] El dueño puede ver alertas de métricas sobre la lealtad (Gas gratis pendiente).

## 4. Instrucciones para Salida a Producción
- Como se agregaron **Nuevas Migraciones (RPCs)**, es OBLIGATORIO que el usuario ejecute `supabase db push` o copie el SQL en el Dashboard de Supabase.
