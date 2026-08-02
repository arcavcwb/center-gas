# Walkthrough: App del Motoboy (ISSUE-501)

## Resumen Ejecutivo
Se implementó la vista optimizada para dispositivos móviles orientada a los conductores (motoboys), cumpliendo con el **ISSUE-501**.
El conductor ahora puede acceder con sus credenciales, ver en tiempo real si tiene un pedido asignado, usar un deep link a Google Maps para navegación, y completar el pedido marcando si recogió el envase vacío.

## Archivos Clave Modificados/Creados
- `apps/site/src/pages/driver/index.astro`: Punto de entrada estático en Astro para la ruta `/driver`.
- `apps/site/src/components/DriverApp.tsx`: Isla interactiva en SolidJS. Maneja la sesión (`supabase.auth`), hace polling reactivo del pedido activo, maneja errores de red intermitentes y contiene la lógica de UI de cobro (penalty fee y vuelto de efectivo).
- `apps/web/scripts/create_driver.js`: Script Node temporal (workaround) para inyectar un perfil de driver y asignarle pedidos manuales para QA.

## Decisiones Técnicas
- **Astro + SolidJS:** Se respetó la arquitectura estipulada para `apps/site`. La app es ultraligera, cargando solo SolidJS para la reactividad.
- **Flujo de Envases (Cascos):** Se incluyó un modal estricto para forzar al motoboy a declarar si recibió o no el envase vacío. Si no lo recibe, se suman R$ 200 de penalización dinámicamente al total final.
- **Vuelto Dinámico:** Si el método de pago es "cash" (Efectivo), el sistema extrae `cash_change_for` de Supabase y advierte al motoboy cuánto efectivo extra debe llevar para dar vuelto.

## Ejecución de Pruebas
1. Compilación estática correcta (`npm run build`).
2. Script `create_driver.js` logró evadir RLS inyectando con rol Service Key.
3. Se probó la actualización manual de estado (`entregado`) con el flag de `cylinder_returned` exitoso hacia Supabase.
