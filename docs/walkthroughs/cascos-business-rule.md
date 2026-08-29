# Walkthrough: Regla de Negocio - Cascos de Agua

Este walkthrough documenta la implementación de la distinción entre **Recarga de Agua** y **Venta de Agua con Envase Nuevo** (`feat/cascos-business-rule`).

## 1. Alineación de Esquemas (Zod)
El `ProductSchema` en Zod no representaba fielmente los productos de agua. El catálogo asumía que solo existía la "Recarga".

**Cambios realizados:**
- **[MODIFIED]** [packages/contracts/src/index.ts](file:///home/arcav/projects/center-gas/center-gas-platform/packages/contracts/src/index.ts)
  - Se eliminó el enum fijo `type` y se sustituyó por `sku` para tener escalabilidad dinámica.
  - Se agregó `includes_cylinder: z.boolean().optional()` y `is_active: z.boolean().optional()`.

## 2. Inventario en Base de Datos
Se inyectó el nuevo SKU en el inventario de Supabase.

**Cambios realizados:**
- **[NEW]** [supabase/migrations/20260829100000_water_casco_feature.sql](file:///home/arcav/projects/center-gas/center-gas-platform/supabase/migrations/20260829100000_water_casco_feature.sql)
  - Modificado el SKU `water` original a `water_refill` (Precio: R$ 15.00).
  - Insertado el SKU `water_full` (Precio: R$ 35.00) con la propiedad `includes_cylinder = true`.

## 3. Interfaz de Usuario B2C (Catálogo Astro/SolidJS)
Se ajustó el renderizado del catálogo para comunicar la diferencia al cliente final.

**Cambios realizados:**
- **[MODIFIED]** [apps/site/src/components/Catalog.tsx](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/src/components/Catalog.tsx)
  - Se añadió la variable `includes_cylinder` al mapeo del estado.
  - Se introdujo un bloque `<Show>` de SolidJS que renderiza condicionalmente el Badge **"✨ INCLUYE ENVASE NUEVO"** en color azul vibrante para los productos que aplican, mejorando la conversión y evitando reclamos del motoboy en la entrega.

## Verificación (QA / DevOps)
- ✅ El monorepo compila `apps/site` y `apps/web` sin errores de Typescript.
- ✅ La arquitectura permite que, sin haber tocado el Dashboard B2B (`apps/web`), los operadores puedan seleccionar ambos productos en el modal manual porque extraen la lista directamente de la tabla unificada.
