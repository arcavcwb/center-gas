# Walkthrough: Configuración Dual de Despliegue en Vercel & Seed de Catálogo

## 1. Problema Abordado
1. **Despliegue Asimétrico en Producción:**
   El catálogo B2C (`apps/site`) estaba desplegado en Vercel, pero el panel administrativo del dueño (`apps/web`) carecía de configuración y proyecto en Vercel, forzando al dueño a operar exclusivamente en `localhost`.
2. **Catálogo Vacío en Producción:**
   En la base de datos de Supabase en producción solo existía el botellón de agua, impidiendo a los clientes pedir Gas P13 o cascos completos desde la URL pública de Vercel.

## 2. Solución Implementada
1. **Configuraciones Vercel por Aplicación:**
   - Se crearon [`apps/web/vercel.json`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/web/vercel.json) (`framework: nextjs`) y [`apps/site/vercel.json`](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/vercel.json) (`framework: astro`).
2. **Guía de Despliegue en Vercel:**
   - Se documentó [`docs/VERCEL_DEPLOYMENT_GUIDE.md`](file:///home/arcav/projects/center-gas/center-gas-platform/docs/VERCEL_DEPLOYMENT_GUIDE.md) con el procedimiento para importar `center-gas-web` en 1 minuto en Vercel y enlazar las variables de entorno de Supabase.
3. **Carga y Activación de Productos en Supabase:**
   - Se insertaron los productos oficiales:
     - `P13-REFILL`: Gas P13 (Recarga) - R$ 110,00
     - `P13-FULL`: Gas P13 (Con Casco/Vasilhame) - R$ 280,00
     - `water_refill`: Botellón de Agua 20L (Solo Recarga) - R$ 15,00
     - `water_full`: Botellón de Agua 20L (Con Envase Nuevo) - R$ 35,00
   - Se desactivó el SKU legado `water`.

## 3. Verificación Empírica
- **Compilación Monorepo:** 100% PASS (`turbo build` completado en 34s).
- **Base de Datos:** 4 productos activos verificados vía API PostgREST.
- **Vercel Live Site:** `https://center-gas-site.vercel.app` responde `HTTP/2 200` con los productos actualizados.
