# Walkthrough: ISSUE-102 — Motor de Base de Datos y Seguridad RLS

**Fecha de Cierre:** 2026-08-01  
**Commit:** `c0ee521`  
**Rama:** `feat/issue-102` → merged to `main`  

---

## Resumen

Se inicializó el motor de persistencia (Supabase/PostgreSQL) y se aplicaron políticas de seguridad Zero-Trust a nivel de fila (RLS). Esto garantiza que cada rol (dueño, repartidor, cliente anónimo) solo acceda a los datos que le corresponden.

## Archivos Creados

| Archivo | Propósito |
|---|---|
| `supabase/config.toml` | Configuración local de Supabase CLI |
| `supabase/.gitignore` | Exclusiones del entorno local |
| `supabase/migrations/20260731031711_core_schema.sql` | DDL Core: 9 tablas, 3 ENUMs, extensión UUID |
| `supabase/migrations/20260801122510_rls_policies.sql` | Políticas RLS, funciones helper y Realtime |

## Tablas Desplegadas

| Tabla | Descripción |
|---|---|
| `profiles` | Identidad extendida (owner/driver) vinculada a `auth.users` |
| `neighborhoods` | Barrios con cobertura y tarifa de envío |
| `customers` | Clientes con teléfono único y puntos de fidelidad |
| `catalog_sessions` | Tokens efímeros para acceso desde WhatsApp (LGPD) |
| `products` | Catálogo con distinción de casco (`includes_cylinder`) |
| `orders` | Pedidos con soporte para Troco y control de envases |
| `order_items` | Detalle de productos por pedido |
| `order_status_history` | Historial inmutable de cambios de estado |
| `system_config` | Configuración dinámica (JSONB) |

## Políticas RLS Aplicadas

| Rol | Permisos |
|---|---|
| **Owner** | `ALL` en todas las tablas operativas |
| **Driver** | `SELECT` + `UPDATE` solo en `orders` donde `driver_id = auth.uid()` |
| **Anónimo** | Denegado. Solo acceso vía función `resolve_catalog_session()` (SECURITY DEFINER) |

## Configuración Realtime

Las tablas `orders` y `order_status_history` fueron añadidas a la publicación `supabase_realtime` para que el Kanban en Next.js reaccione instantáneamente a cambios.

## Decisiones Técnicas

1. **RLS en una migración separada:** Facilita desactivar/modificar políticas sin tocar el DDL.
2. **Funciones helper `auth.is_owner()` / `auth.is_driver()`:** Centralizan la lógica de roles para que las políticas RLS sean legibles.
3. **`catalog_sessions` bloqueada al público:** Solo accesible vía RPC con `SECURITY DEFINER` para cumplir LGPD.

## Verificación

- Migraciones compiladas estáticamente sin errores de sintaxis SQL.
- Merge a `main` completado con fast-forward (sin conflictos).
