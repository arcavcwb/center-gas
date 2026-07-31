---
name: astro-solid
description: Provee patrones de arquitectura y reglas de código para desarrollar el frontend usando Astro y SolidJS.
---
# Astro + SolidJS Frontend Skills

## Propósito
Este skill define las reglas de arquitectura frontend para el **Frontend Dev Agent**, asegurando un rendimiento ultra rápido y componentes modulares, tal como se especifica en la arquitectura técnica.

## Directrices de Desarrollo
1. **Astro como Core Estático:** Todo el enrutamiento (ej. `/catalogo`, `/panel`) debe ser manejado por Astro. El HTML debe generarse en el servidor o de forma estática para minimizar el tiempo de carga en móviles (cero JavaScript por defecto).
2. **Islas de SolidJS:** Usa SolidJS (`client:load` o `client:visible`) **solo** para componentes que requieran estado interactivo complejo:
   - El Carrito de compras / Selector de Gas/Agua.
   - El Tablero Kanban en tiempo real.
   - La vista interactiva del repartidor con Supabase Realtime.
3. **Prohibición de React/Vue:** Bajo ninguna circunstancia instalar dependencias de React, Preact o Vue. Todo componente reactivo DEBE escribirse en SolidJS (usando `createSignal`, `createEffect`).
4. **Tailwind CSS Puro:** Utiliza utilidades de Tailwind en lugar de CSS personalizado. Usa la configuración generada por el *Designer Agent* (`tailwind.config.js`).
5. **Tipado Estricto:** Nunca declares tipos (`type` o `interface`) directamente en los componentes frontend si representan datos de negocio. Importalos exclusivamente de `packages/contracts`.
