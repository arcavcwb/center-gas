# Walkthrough: Force Node 20.x on Vercel Root

## Qué y Por Qué
Tras intentar bajar la versión de Node.js a `20.x` en el `package.json` de `apps/site` (PR #29), el despliegue de Vercel volvió a fallar. El problema es que Vercel, en proyectos monorepo (Turborepo), ignora la configuración de `engines` a nivel de subpaquete y únicamente lee el `package.json` de la raíz absoluta del repositorio para provisionar la imagen de Docker/Serverless.

Al no encontrar la instrucción en la raíz, Vercel continuó usando Node 22, causando el mismo error `ERR_PNPM_META_FETCH_FAIL` (incompatibilidad de pnpm 9.5.0 con el protocolo fetch de Node 22). Para solucionar esto definitivamente sin requerir configuración manual en la interfaz de Vercel, se forzó la versión de Node en la raíz.

## Cambios Realizados
1. **[package.json](file:///home/arcav/projects/center-gas/center-gas-platform/package.json)**
   - Añadida la propiedad `"engines": { "node": "20.x" }` a nivel de raíz del repositorio.

## Comprobaciones Finales
- Compilación validada localmente.
- El PR ha sido auditado y entregado para revisión.
