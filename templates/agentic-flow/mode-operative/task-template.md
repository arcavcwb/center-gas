# Task Checklist - [TASK-ID]: [Nombre de la Tarea]

- [ ] **Fase 1: Preparación y Branch**
  - [ ] Verificar `main` limpio y actualizado.
  - [ ] Crear rama `feat/[TASK-SLUG]`.

- [ ] **Fase 2: Implementación Lean (Ponytail & Impeccable)**
  - [ ] Implementar la solución más simple y corta (YAGNI, stdlib first).
  - [ ] Si involucra UI/UX: 0 emojis unicode, contraste WCAG AA, targets >= 48px.

- [ ] **Fase 3: Verificación Zero-Trust**
  - [ ] Ejecutar pruebas unitarias: `pnpm test` (o equivalente).
  - [ ] Ejecutar compilación estática: `pnpm run build`.
  - [ ] Si involucra UI: Ejecutar `pnpm run check:design` (0 anti-patrones).

- [ ] **Gobernanza Operativa Git Flow (CRÍTICO):**
  - [ ] NUNCA comitear directamente a `main`.
  - [ ] Trabajar en rama feature (`git checkout -b feat/[TASK-SLUG]`).
  - [ ] Ejecutar `git add .` y `git commit -m "feat/fix: ..."` (Conventional Commits).
  - [ ] Ejecutar `git push -u origin feat/[TASK-SLUG]`.
  - [ ] Crear Pull Request: `gh pr create`.
  - [ ] Actualizar descripción del PR vía GitHub API (`gh api -X PATCH ...`).
  - [ ] Generar reporte técnico en `docs/walkthroughs/[TASK-SLUG].md`.
  - [ ] Merge a `main` vía Squash (`gh pr merge --squash --delete-branch`).
