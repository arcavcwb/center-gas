# Walkthrough Técnico: ISSUE-301 Catálogo B2C

## 🎯 Objetivo Logrado
Se ha implementado el catálogo web (B2C) en `apps/site` usando Astro y SolidJS. Esta página está diseñada para ser extremadamente rápida y funcionar como el punto de entrada principal para la compra de gas.

## 📁 Archivos Modificados / Creados
- **`apps/site/src/pages/index.astro`**: Layout base en Astro (cero JS) con integración SEO básica y carga del componente interactivo de Solid.
- **`apps/site/src/components/Catalog.tsx`**: Isla de SolidJS que maneja:
  - Carrito de compras local (memoria).
  - Lógica de "Troco para X" en pagos en efectivo.
  - Mock de payload final (listo para conectarse a Supabase una vez configurado).
- **`packages/contracts/src/index.ts`**: Se agregó `ProductSchema` y `CartItemSchema` para el tipado.
- **`supabase/migrations/20260801132700_products_table.sql`**: Script DDL para la creación de la tabla de productos y el data seed inicial (Gás, Agua).
- **`apps/site/tailwind.config.mjs` & `astro.config.mjs`**: Archivos de configuración para el framework.

## 🛠️ Decisiones Técnicas
- **Autenticación diferida (Security Definer):** Como los usuarios B2C son anónimos, la política RLS bloquea `INSERT` a las tablas. Para evitar la carga de un servidor Node (SSR) en Astro, se implementó un *RPC en Supabase* (`create_b2c_order`) con `SECURITY DEFINER`.
- **Lógica Transaccional:** El RPC recibe el payload desde el frontend, inserta el `customer`, calcula los precios de forma segura validando contra la BD (evitando spoofing de precios del cliente) e inserta la orden y sus items.
- **Frontend Astro + Solid:** El componente `Catalog.tsx` fue actualizado para usar `@supabase/supabase-js`, renderizando productos directamente desde la BD y consumiendo el RPC para el checkout en tiempo real.

## ✅ Criterios de Aceptación (QA)
- [x] Carga ultrarrápida (Islands architecture).
- [x] Soporte para PIX y Efectivo con Troco.
- [x] UI responsiva (mobile-first) con colores de la marca.
- [x] Creación real de órdenes seguras (bypaseando RLS mediante RPC).
