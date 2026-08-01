# Walkthrough: ISSUE-101 — Fundación Híbrida del Monorepo

**Fecha de Cierre:** 2026-07-31  
**Commit:** `7b5cd6f`  
**Rama:** `main` (directo — God Mode autorizado por el humano)  

---

## Resumen

Se inicializó el Monorepo híbrido que soportará toda la plataforma Center Gas. El objetivo era crear una estructura que permita a dos aplicaciones (Panel B2B y Catálogo B2C) compartir contratos de datos y tokens de diseño sin duplicar código.

## Archivos Creados

| Archivo | Propósito |
|---|---|
| `package.json` | Workspace root con scripts de Turborepo |
| `pnpm-workspace.yaml` | Definición de workspaces (`apps/*`, `packages/*`) |
| `turbo.json` | Pipelines de `build`, `lint`, `test`, `dev` |
| `apps/web/` | Next.js 15 (App Router, TypeScript Strict, Tailwind v4) |
| `apps/site/` | Astro 5 (Template Basics, TypeScript Strict) |
| `packages/contracts/src/index.ts` | Esquema base Zod (`CustomerSchema`) |
| `packages/ui-tokens/` | Tokens de diseño CSS (paleta corporativa) |

## Decisiones Técnicas

1. **pnpm sobre npm/yarn:** Symlinks duros para evitar duplicación de `node_modules` entre apps.
2. **Turborepo sobre Nx:** Menor overhead de configuración para un equipo que empieza.
3. **Tailwind v4 en `apps/web`:** Compatible nativamente con el App Router de Next.js 15.
4. **Astro Template "Basics":** Mínimo peso, preparado para inyectar `@astrojs/solid-js` cuando arranque ISSUE-301.

## Verificación

- `pnpm install` completado sin errores ni advertencias circulares.
- Symlinks cruzados entre `packages/contracts` y ambas apps funcionando correctamente.
