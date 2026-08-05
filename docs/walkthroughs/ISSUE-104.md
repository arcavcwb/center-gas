# Walkthrough - ISSUE-104: Flujo de Registro B2C

## Resumen Ejecutivo
Se implementó un flujo de registro por pasos en el frontend B2C para reducir la fricción en la captura de clientes potenciales, permitiendo la identificación temprana vía WhatsApp.

## Decisiones Técnicas y Arquitectónicas
- **Frontend (SolidJS):** Se rediseñó el componente `Catalog.tsx` para operar como una máquina de estados (Wizard) con tres pasos:
  1. `phone`: Captura del número de WhatsApp.
  2. `register`: Captura de Nombre, Barrio y Dirección (solo para clientes nuevos).
  3. `catalog`: Visualización del catálogo y Checkout con 1 clic.
- **Backend (Supabase RPCs):** 
  - `check_customer_exists`: Evalúa si un teléfono ya está registrado utilizando `FOUND` para manejar de manera segura campos nulos en PostgreSQL y retorna los datos para auto-completado.
  - `register_b2c_customer`: Registra de forma segura un nuevo cliente.
  - Ambos corren con `SECURITY DEFINER` para permitir operaciones B2C (anon) sin comprometer RLS en la tabla de clientes.

## Cambios Realizados
- `apps/site/src/components/Catalog.tsx`: Implementación del Wizard y gestión de estado con SolidJS signals.
- `supabase/migrations/20260805015134_customer_registration_rpcs.sql`: Creación inicial de los RPC.
- `supabase/migrations/20260805040711_fix_check_customer_exists.sql`: Fix crítico (manejo de NULLs vía `FOUND`) en la función `check_customer_exists`.
- `apps/e2e/tests/customer.spec.ts` y `CatalogPage.ts`: Refactor completo de los tests de Playwright para adaptarse al nuevo flujo en 2 escenarios (cliente nuevo vs existente).

## Resultados de Validación
- Playwright E2E (`customer.spec.ts`): **4 passed (20.0s)** (Chromium & Mobile Chrome).
- Interfaz verificada: Reacciona dinámicamente y maneja el estado de `isSubmitting` y errores de red.
