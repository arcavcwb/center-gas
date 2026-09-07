# Task Checklist - [ISSUE-XXX]: [Nombre del Issue en Plane]

- [ ] **Fase 1: Preparación y Branch**
  - [ ] Asignar Issue al Sprint Activo en Plane.
  - [ ] Mover Issue a `In Progress`.
  - [ ] Crear rama `feat/ISSUE-XXX`.

- [ ] **Fase 2: Implementación Lean (Ponytail & Impeccable)**
  - [ ] Implementar la solución mínima funcional (YAGNI, stdlib first).
  - [ ] Si involucra UI/UX: 0 emojis unicode, contraste WCAG AA, targets >= 48px.

- [ ] **Fase 3: Verificación Zero-Trust**
  - [ ] Pruebas unitarias: `pnpm test`.
  - [ ] Compilación estática limpia: `pnpm run build`.
  - [ ] Si involucra UI: `pnpm run check:design` (0 anti-patrones).

- [ ] **Gobernanza y Git Flow (CRÍTICO):**
  - [ ] NUNCA comitear directamente a `main`.
  - [ ] Trabajar en rama feature (`git checkout -b feat/ISSUE-XXX`).
  - [ ] Ejecutar `git add .` y `git commit -m "feat/fix: ... (ISSUE-XXX)"`.
  - [ ] Ejecutar `git push -u origin feat/ISSUE-XXX`.
  - [ ] Crear Pull Request: `gh pr create`.
  - [ ] Actualizar descripción del PR vía GitHub API (`gh api -X PATCH ...`).
  - [ ] Generar reporte técnico en `docs/walkthroughs/ISSUE-XXX.md`.
  - [ ] Actualizar Plane: Estado `Done` + Comentario HTML exhaustivo con Commit Hash y Link al PR.
