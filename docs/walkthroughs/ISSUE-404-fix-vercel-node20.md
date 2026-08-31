# Walkthrough: Fix Vercel Build (Node 20)

## Qué y Por Qué
Vercel fallaba constantemente en la fase de `pnpm install` al intentar descargar dependencias, arrojando errores de red falsos (`ERR_PNPM_META_FETCH_FAIL`). 
El problema raíz era una incompatibilidad estricta entre la versión de pnpm definida (`9.5.0`) y el motor de Node.js `22.x` que el repositorio exigía. Dado que Corepack en Vercel tiene inestabilidad con Node 22, la decisión más sólida fue relajar la restricción de Node a la versión `20.x`, la cual es 100% estable para pnpm y compatible con Astro/Next.js.

## Cambios Realizados
1. **[apps/site/package.json](file:///home/arcav/projects/center-gas/center-gas-platform/apps/site/package.json)**
   - Modificada la propiedad `engines.node` de `>=22.12.0` a `>=20.0.0`.
2. **[package.json](file:///home/arcav/projects/center-gas/center-gas-platform/package.json)**
   - Restaurada la versión original de `packageManager` a `pnpm@9.5.0` para estabilizar el lockfile con la versión de Node 20.

## Comprobaciones Finales
- Compilación de `pnpm install` en entorno local exitosa.
- Compilación de `pnpm run build` en `apps/site` exitosa.
- Rama `feat/fix-vercel-node20` enviada a revisión.
