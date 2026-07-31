---
name: webapp-testing
description: Instrucciones y mejores prácticas para QA, incluyendo tests E2E con Playwright y validación de componentes de frontend.
---
# WebApp Testing Skills

## Propósito
Este skill dirige al **QA Agent** para establecer una suite de pruebas robusta y evitar regresiones en los flujos críticos (compras y despachos).

## Directrices de Testing
1. **Page Object Model (POM):** Todos los tests de Playwright deben abstraer los selectores y acciones en clases POM, facilitando el mantenimiento si la UI cambia.
2. **Flujos Críticos a Testear:**
   - **Flujo de Cliente:** Seleccionar producto -> Aplicar Descuento de Combo -> Ingresar Teléfono -> Confirmar Pedido.
   - **Flujo de Propietario:** Ver Kanban -> Mover Tarjeta a Asignado.
   - **Flujo de Repartidor:** Validar botón gigante de "Entregado" y modal de validación de envase vacío.
3. **Independencia de Entorno:** Los tests no deben depender de datos fijos en la base de datos de producción; deben realizar "teardowns" o mochear respuestas de Supabase donde aplique.
