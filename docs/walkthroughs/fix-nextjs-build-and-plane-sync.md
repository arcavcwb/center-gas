# Walkthrough: Corrección de Compilación Next.js 15 & Sincronización Integral Plane

## 1. Problema de Negocio y Técnico
1. **Ruptura del Pipeline Zero-Trust:**
   El monorepo fallaba al compilar `apps/web` debido a restricciones estrictas de Next.js 15 App Router (`layout.tsx:31` con etiquetas `<a>` en lugar de `<Link />` y advertencia de dependencias de `useEffect` en `metrics/page.tsx`).
2. **Desincronización en Plane:**
   11 tickets de desarrollo que ya estaban implementados y testeados en Git permanecían en `Backlog` en Plane debido a un parámetro erróneo (`state_id` en lugar de `state`) en los scripts de migración previos.
3. **Ausencia de Espejo del Sprint:**
   No existía `sprint_actual.md` en la raíz del repositorio para dar visibilidad inmediata del estado de Sprint 4 al squad agéntico.

## 2. Solución Implementada
1. **Corrección de `apps/web`:**
   - En `layout.tsx`: Se importó `Link` desde `next/link` y se reemplazaron las etiquetas `<a>` por `<Link href="...">`.
   - En `metrics/page.tsx`: Se memorizó `fetchMetrics` mediante `useCallback(..., [period])` y se enlazó como dependencia en `useEffect`.
2. **Gobernanza de Cache:**
   - Se añadió `.turbo/` a `.gitignore` y se desindexaron los logs locales `apps/site/.turbo/turbo-build.log` y `apps/web/.turbo/turbo-build.log`.
3. **Sincronización Masiva en Plane API:**
   - Se corrigió el payload a `{"state": DONE_STATE}`.
   - Se movieron a `Done` 11 tickets (ISSUE-105, 106, 108, 302, 303, 304, 401, 402, 403, 404, 601) con vinculación a Cycle 4 y comentario HTML de auditoría.
4. **Generación de `sprint_actual.md`:**
   - Se creó el archivo con la tabla cruzada Plane ↔ Git, métricas de éxito y backlog priorizado de Post-MVP (ISSUE-702, 703, 704).

## 3. Verificación Empírica
- `pnpm --filter web build`: Exitoso en 7.2s.
- `pnpm build` (`turbo build` monorepo): Exitoso en ~29s (2/2 paquetes en verde).
- Auditoría Plane API: 23 tickets en `Done` (completed) y 3 tickets en `Backlog` listos para el siguiente sprint.
