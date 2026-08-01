# Walkthrough Técnico: Integración B2B Frontend (ISSUE-103, ISSUE-107, ISSUE-203)

## Arquitectura de Datos y RLS (ISSUE-103)
- Se consolidó `core_schema.sql` con las tablas: `profiles`, `neighborhoods`, `customers`, `catalog_sessions`, `products`, `orders`, `order_items`, `vehicles`, `stock_movements`.
- Se implementó Row Level Security (RLS) (`20260801122510_rls_policies.sql`) garantizando que:
  - Solo el rol `owner` puede leer y mutar `orders`, `customers`, y `profiles`.
  - El rol `driver` tiene acceso segmentado en el futuro.
  - Para los Custom Claims (roles), se reemplazó la dependencia directa de `auth.users` hacia funciones wrapper en `public.is_owner()` y `public.is_driver()`.

## Autenticación de Acceso (ISSUE-107)
- Se desarrolló la página `apps/web/src/app/login/page.tsx` para permitir el inicio de sesión.
- Se refactorizó la página principal (`apps/web/src/app/page.tsx`) para verificar la sesión en el cliente (`supabase.auth.getSession()`). Si el usuario no está logueado, es expulsado inmediatamente a `/login`.
- Se creó el script `apps/web/scripts/create_owner.js` que utiliza el *Service Role Key* para inyectar al primer usuario administrador `admin@centergas.com` saltándose el flujo público de Signup.

## Conexión Reactiva B2B y Pedidos Manuales (ISSUE-203)
- **Supabase Realtime:** Se modificó `KanbanBoard.tsx` para suscribirse al canal `realtime_orders`. El frontend ahora consume `orders` con un `JOIN` dinámico hacia `customers` y `order_items`.
- **NewOrderModal.tsx:** Se conectó a la DB real.
  - Descarga productos activos para llenar los selectores.
  - Ejecuta un Upsert en `customers` mediante teléfono para no duplicar clientes existentes.
  - Inserta la nueva orden en `orders` y `order_items`. Al tener Realtime activo, la interfaz de Kanban se actualiza automáticamente al terminar el insert sin mutar estados locales.

## Comandos Ejecutados
```bash
# Push de DB
npx supabase db push --db-url "postgresql://..."

# Creación del Owner
cd apps/web && node --env-file=../../.env scripts/create_owner.js
```
