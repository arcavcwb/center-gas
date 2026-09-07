# Walkthrough: Integración Mandatoria de Impeccable en el Flujo Agéntico (ISSUE-802)

## 📌 Contexto y Objetivos
Para evitar la degradación estética ("AI slop", contraste deficiente, ausencia de estándares táctiles móviles o emojis unicode inapropiados), se formalizó e integró **Impeccable** como una **habilidad y regla innegociable fija** en todo el flujo de desarrollo del escuadrón agéntico de Center Gas.

---

## 🛠️ Cambios Realizados

1. **Gobernanza Always-On ([`.agents/rules/superules.md`](file:///home/arcav/projects/center-gas/center-gas-platform/.agents/rules/superules.md)):**
   - Agregada la sección `🎨 PROTOCOLO MANDATORIO UI/UX (IMPECCABLE CRAFT FLOOR)`.
   - Reglas innegociables:
     - Respetar [`PRODUCT.md`](file:///home/arcav/projects/center-gas/center-gas-platform/PRODUCT.md) y [`DESIGN.md`](file:///home/arcav/projects/center-gas/center-gas-platform/DESIGN.md).
     - Prohibición absoluta de emojis unicode en interfaces de usuario de producción (reemplazo estricto por iconos SVG vectoriales).
     - Touch targets mínimos de 48×48px en dispositivos móviles.
     - Contraste estricto WCAG 2.1 AA (≥ 4.5:1 texto, ≥ 3:1 interactivos).
   - Inclusión obligatoria en el **IDE Memory Anchor** de `task.md`: ninguna tarea de UI/UX puede cerrarse sin haber ejecutado `impeccable detect` y obtenido 0 anti-patrones.

2. **Formalización de Roles ([`AGENTS.md`](file:///home/arcav/projects/center-gas/center-gas-platform/AGENTS.md)):**
   - Asignación formal de la capacidad y deber de ejecutar Impeccable para el `@designer-agent` y `@frontend-dev-agent`.
   - Incorporación de la subsección `ESTÁNDAR MANDATORIO DE DISEÑO UI/UX (IMPECCABLE CRAFT FLOOR)`.

3. **Candado Mecánico en Monorepo ([`package.json`](file:///home/arcav/projects/center-gas/center-gas-platform/package.json)):**
   - Agregado el script raíz `"check:design": ".agents/skills/impeccable/scripts/impeccable detect"`.
   - Permite a desarrolladores, agentes y pipelines CI ejecutar la validación con un único comando reproducible.

4. **Sincronización Documental del Ciclo de Vida ([`docs/14`](file:///home/arcav/projects/center-gas/center-gas-platform/docs/14-agent-development-flow.md) y [`docs/15`](file:///home/arcav/projects/center-gas/center-gas-platform/docs/15-agentic-flow-manual.md)):**
   - Actualizada la Matriz de Interacciones y el Diagrama del Pipeline CI/CD en el Manual del Flujo Agéntico para incluir `impeccable detect` como paso previo obligatorio a la aprobación del Pull Request.
   - Agregada la fila correspondiente en la tabla de anti-patrones prohibidos.
   - Sincronizado [`docs/13-ai-context-summary.md`](file:///home/arcav/projects/center-gas/center-gas-platform/docs/13-ai-context-summary.md).

---

## 🧪 Verificación de Calidad
- **Script Mecánico:** `pnpm run check:design` ejecutado con éxito (código 0, 0 anti-patrones detectados).
- **Compilación Monorepo:** `pnpm turbo run build` completado sin errores.
- **Pruebas Unitarias:** 38/38 pasando en `@center-gas/contracts`.
