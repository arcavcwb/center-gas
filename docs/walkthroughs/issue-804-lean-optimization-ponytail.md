# Walkthrough - ISSUE-804: Codebase Lean Optimization & Bloat Cleanup (Ponytail)

## 📌 Contexto y Objetivo
A través de las auditorías cognitivas de **Ponytail** (`ponytail-audit` y `ponytail-review`), se identificaron dependencias superfluas, paquetes desacoplados sin uso, artefactos de depuración temporales indexados indebidamente en Git, y oportunidades de simplificación utilizando la librería estándar (stdlib) de JavaScript y Node.js.

El objetivo de esta intervención fue aplicar la filosofía *Lazy Senior Dev* (YAGNI, stdlib primero, plataforma nativa y menor cantidad de líneas funcionales), manteniendo intacto el estándar mandatorio **Impeccable** (0 emojis en UI y accesibilidad).

---

## 🛠️ Cambios Realizados

### 1. Eliminación de Dependencias Redundantes & Bloat
- **`pg` y `@types/pg`**: Removidos de `package.json` raíz (cero consumidores en el monorepo; la persistencia y RPCs operan vía `@supabase/supabase-js`).
- **`dotenv`**: Removido de `apps/web/package.json` (Next.js 15 gestiona variables `.env` de forma nativa) y actualizado `test_rpc.js` para usar la carga nativa de Node 20+ (`--env-file=.env`).
- **`@center-gas/ui-tokens`**: Eliminado el paquete huérfano en `packages/ui-tokens` (0 importaciones activas).
- **`apps/site/package-lock.json`**: Eliminado el lockfile residual de npm dentro de un monorepo pnpm.
- **`-16 paquetes`** consolidados en `pnpm-lock.yaml`.

### 2. Higiene de Repositorio y Git
- Desindexados y eliminados del historial de Git:
  - 18 archivos binarios y metadatos de `.turbo/cache/*.tar.zst`.
  - 8 scripts utilitarios de migración puntual (`patch_plane.py`, `patch_epic5.py`, `fix_n8n.py`, `update_n8n2..6.py`).
  - Reportes de pruebas temporales (`apps/e2e/playwright-report/` y `apps/e2e/test-results/`).
  - Archivos de log local (`site.log`, `web.log`).
- Actualizado `.gitignore` con patrones explícitos (`*.log`, `**/playwright-report/`, `**/test-results/`).

### 3. Simplificación con Stdlib & Platform Native
- **`packages/contracts/src/business-rules.ts`**:
  - `formatBRL`: Reemplazado string parsing manual con `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
  - `getCuritibaDateTime`: Reducido de 35 líneas de parseo con `formatToParts` a 15 líneas limpias usando `date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })`.
- **`apps/site/src/components/LanguageToggle.tsx`**:
  - Reemplazados los emojis unicode (`🇧🇷`, `🇪🇸`) por badges tipográficos limpios y accesibles cumpliendo la regla mandatoria Impeccable (0 emojis en UI).
  - Unificada la estructura JSX duplicada iterando sobre una matriz constante tipada `LANGUAGES`.

---

## 🧪 Verificación y Resultados (Zero-Trust)

1. **Pruebas Unitarias de Contratos:**
   ```bash
   pnpm --filter @center-gas/contracts test
   # Test Files: 3 passed (3)
   # Tests: 38 passed (38) (895ms)
   ```

2. **Compilación Estática Turborepo:**
   ```bash
   pnpm run build
   # site:build ✓ Complete! (2 pages built)
   # web:build  ✓ Compiled successfully (7/7 static routes)
   # Tasks: 2 successful, 2 total
   ```

3. **Auditoría Impeccable UI/UX:**
   ```bash
   pnpm run check:design
   # 0 anti-patterns detected.
   ```
