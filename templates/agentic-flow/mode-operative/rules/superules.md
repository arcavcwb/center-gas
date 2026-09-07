---
trigger: always_on
---

🏛️ FILOSOFÍA CENTRAL: "Git as the Single Source of Truth (Modo Operativo)"
Operas bajo una filosofía estricta de Zero-Trust (Cero Confianza), Máxima Portabilidad y Desarrollo Ágil Directo:
- **Prohibición de Asunciones:** Tu conocimiento del proyecto viene EXCLUSIVAMENTE de los archivos que leas en la sesión actual. Jamás asumas contratos de API, estructuras de base de datos o requerimientos que no estén verificados en el código.
- **Git como Fuente de Verdad:** No dependes de gestores externos de tickets (como Plane o Jira). La especificación y trazabilidad residen en `task.md`, los Pull Requests de GitHub y los walkthroughs en `docs/walkthroughs/`.
- **Trunk-Based / Feature Branches:** Queda terminantemente prohibido hacer commits o pushes directos a la rama principal (`main` o `master`). Todo cambio viaja por rama feature (`feat/...`).

🚨 REGLA ESTRICTA ANTI-OLVIDO (IDE MEMORY ANCHOR - MODO OPERATIVO) 🚨
Para evitar perder el hilo del protocolo por pérdida de contexto, SIEMPRE que entres en "Planning Mode" o inicies una tarea no trivial y crees el archivo `task.md`, ESTÁS OBLIGADO a incluir como última fase de tu checklist lo siguiente:
- `[ ]` **Gobernanza Operativa Git Flow (CRÍTICO):**
  - `[ ]` NUNCA comitear directamente a `main`.
  - `[ ]` Trabajar en rama feature (`git checkout -b feat/TASK-XXX` o `feat/nombre-descriptivo`).
  - `[ ]` Si la tarea involucra UI/UX o Frontend: Ejecutar verificación Impeccable (`pnpm run check:design` o `.agents/skills/impeccable/scripts/impeccable detect`) y certificar 0 anti-patrones.
  - `[ ]` Ejecutar pruebas unitarias y compilación estática (`build`).
  - `[ ]` Ejecutar `git add .` y `git commit -m "..."` (Conventional Commits).
  - `[ ]` Ejecutar `git push -u origin feat/...`.
  - `[ ]` Crear Pull Request con `gh pr create`.
  - `[ ]` Actualizar descripción del PR vía GitHub API (`gh api -X PATCH /repos/OWNER/REPO/pulls/PR_NUM -F body="..."`).
  - `[ ]` Generar el reporte técnico en `docs/walkthroughs/TASK-XXX.md`.
  - `[ ]` Merge a `main` vía Squash y limpieza de rama (`gh pr merge --squash --delete-branch`).
¡ESTÁ PROHIBIDO DAR LA TAREA POR TERMINADA SI ESTOS CHECKBOXES NO ESTÁN MARCADOS EN TU `task.md`!

🎨 PROTOCOLO MANDATORIO UI/UX (IMPECCABLE CRAFT FLOOR)
Impeccable es el motor y skill FIJO, OBLIGATORIO E INNEGOCIABLE para todo trabajo de diseño, rediseño, componentes y estilos en el frontend:
- **Cero AI-Slop Visual:** Prohibido usar estilos genéricos, gradientes violetas predeterminados o jerarquías planas.
- **0 Emojis Unicode en UI:** Terminantemente prohibido el uso de emojis unicode (`🛵`, `📦`, `📍`, etc.) en interfaces de producción. Todo icono debe ser SVG vectorial, limpio y geométrico.
- **Touch Targets Táctiles:** Botones e inputs interactivos en mobile deben medir mínimo 48×48px.
- **Contraste WCAG 2.1 AA:** Legibilidad estricta bajo luz solar directa (`bg-slate-50`, bordes visibles, ratio ≥ 4.5:1).
- **Verificación Mecánica:** Certificar 0 violaciones de anti-patrones antes de abrir el PR.

⚡ PROTOCOLO DE COMUNICACIÓN CONCISA Y TOKENS LEAN (CAVEMAN)
- **Cero Fluff ni Relleno:** Eliminar cortesías innecesarias, introducciones vacías, rodeos y florituras de texto en respuestas técnicas e interacciones.
- **Formato Directo y de Alto Impacto:** Hechos, código y comandos exactos. Responder con máxima densidad técnica y mínimo consumo de tokens (`[cosa] [acción] [motivo]. [siguiente paso]`).
- **Claridad Técnica Innegociable:** La compresión nunca sacrifica precisión técnica, nombres de contratos, comandos CLI ni mensajes de error exactos.

✂️ FILOSOFÍA DE ARQUITECTURA LEAN Y CERO SOBRE-INGENIERÍA (PONYTAIL)
- **Escalera YAGNI Estricta:** Antes de escribir una sola línea de código:
  1. ¿Tiene que existir esto? Si es especulativo -> SKIP (YAGNI).
  2. ¿Ya existe en el repositorio? -> REUTILIZAR.
  3. ¿La biblioteca estándar (stdlib) lo resuelve? -> USAR STDLIB (ej: `Intl.NumberFormat`, `Intl.DateTimeFormat`, Node `--env-file`).
  4. ¿La plataforma nativa lo cubre? -> USAR PLATAFORMA (HTML nativo, CSS, constraints en base de datos).
  5. ¿Una dependencia ya instalada lo soluciona? -> USARLA (prohibido agregar librerías para tareas triviales).
  6. ¿Puede ser una sola línea? -> UNA LÍNEA.
  7. Solo entonces: el mínimo código funcional necesario.
- **Auditoría Anticomplejidad:** Prohibidas las abstracciones con una sola implementación, factories para un solo producto o scaffolding para el futuro.

🛡️ PROTOCOLO ZERO-TRUST CI/CD
- Todo código generado debe compilar estáticamente (`build`).
- Las decisiones arquitectónicas importantes requieren un Plan de Implementación (`implementation_plan.md`) con aprobación explícita del usuario (`request_feedback: true`) antes de codificar, a menos que se active el "God Mode".
