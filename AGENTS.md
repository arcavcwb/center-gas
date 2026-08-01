# AGENTS.md — Índice Maestro del Squad

Este archivo es el único contexto que Antigravity CLI (`agy`) carga automáticamente
al arrancar en este directorio. Todo lo demás se lee bajo demanda — ningún agente
carga más de lo que su tarea actual necesita.

## Regla de cero asunción

Tu conocimiento del proyecto viene exclusivamente de los archivos que leas en la
sesión actual. Si un tipo, contrato o parámetro no está explícitamente definido en
`packages/contracts` o en la documentación leída, decilo — no lo asumas ni lo
inventes. Queda prohibido asumir contratos de API o estructuras de datos no
verificadas.

## Agentes del squad

Cada uno vive en `.agents/agents/<nombre>/agent.md` y se invoca con
`--agent <nombre>` al lanzar `agy`, o con `/agent <nombre> <tarea>` dentro de una
sesión activa:

| Agente | Dominio |
|---|---|
| `architect-agent` | Arquitectura técnica, Patrones, Contratos Zod/JSON y BDD |
| `pr-reviewer-agent` | Auditoría de Git Diffs y Bloqueo de Pull Requests |
| `po-agent` | `PRD.md` e historias de usuario |
| `scrum-master-agent` | Plane + `sprint_actual.md` |
| `designer-agent` | Tokens visuales (Impeccable) |
| `frontend-dev-agent` | `apps/web` (Next.js), `apps/site` (Astro/Solid) |
| `backend-dev-agent` | `packages/contracts`, `supabase/` |
| `qa-agent` | `tests/`, `bug_report.md` |
| `devops-agent` | Docker, CI/CD, Staging |
| `automation-agent` | `workflows/` (n8n) |

Ninguno tiene `mainAgent: true` — todos son `subagent: true`, invocables bajo
demanda. El squad no decide autónomamente qué fase ejecutar a continuación; el
protocolo de handoff (abajo) sigue siendo gatillado explícitamente.

## Reglas y contratos

- **Arquitectura y stack:** `architecture.md` — gobernanza humana, ningún agente
  lo modifica.
- **Contrato de tipos:** `packages/contracts` — el Backend Dev Agent escribe, el
  Frontend Dev Agent solo lee.
- **Estado del sprint:** `sprint_actual.md`
- **Requerimientos vigentes:** `PRD.md`
- **Reportes de QA:** `bug_report.md`

## Protocolo de handoff (resumen)

```
Fase 0 (humano) → scrum-master-agent → architect-agent → [Aprobación Humana] →
  [frontend-dev-agent, backend-dev-agent en ramas feature] →
  pr-reviewer-agent (Auditoría de PR) → qa-agent (Tests) → Merge a main → devops-agent
```

### Protocolo Ágil de Ejecución (Sprints)
- Antes de iniciar la codificación de un Issue, el Squad **debe asignarlo al Sprint Activo (Cycle)** en Plane, usando la herramienta MCP (`add_cycle_issues`).
- Jamás se deben cerrar tickets en el vacío (huérfanos de un Sprint), pues esto distorsiona las gráficas de velocidad (Burndown) del negocio.
- **Asignación Obligatoria:** Si se trabaja en un ticket, el Agente debe auto-asignarlo o al menos garantizar su vinculación al ciclo vigente.

El detalle completo de disparadores por fase está en `architecture.md`.

## Configuración de herramientas

MCP servers del proyecto: `.agents/mcp_config.json`

---

## 🛡️ Master Workspace Rules (Center Gas)

Estas reglas complementan la regla de cero asunción y deben ser respetadas inquebrantablemente por todos los agentes del Squad en cualquier sesión futura.

### CORE PHILOSOPHY: "Plane for the Business, Git for the Code"
- **Flujo de Plane Obligatorio:** No puedes implementar características no documentadas. Todas las tareas deben rastrearse hacia un ISSUE en Plane.

### GOBERNANZA DE PLANE Y TRAZABILIDAD
- Plane es la **Única Fuente de Verdad**.
- **Reportes Técnicos:** Cada vez que finalices la ejecución de un Issue o un bloque de trabajo importante, estás OBLIGADO a actualizar el Issue en Plane (vía MCP) añadiendo un comentario en formato HTML exhaustivo con los detalles técnicos.
- **Máquina de Estados:** Al terminar una tarea, siempre debes mover el estado del Issue en Plane al siguiente paso correspondiente.
- **Publicación Dual de Walkthroughs:** Al cerrar un Issue, debes generar un Walkthrough (resumen de entrega) y publicarlo en DOS lugares:
  1. **Plane (comentario HTML):** Versión ejecutiva orientada a negocio — el "Qué y Por Qué" (valor entregado, decisiones, resultados). Sin rutas de archivos ni jerga técnica.
  2. **Git (`docs/walkthroughs/`):** Versión técnica completa — el "Cómo" (archivos modificados, migraciones, contratos, comandos). Para contexto de agentes futuros.

### ARQUITECTURA Y STACK TECNOLÓGICO HÍBRIDO
El repositorio es un **Monorepo gestionado con pnpm**. Cualquier scaffolding o instalación debe usar `pnpm`.
- **`apps/web` (Panel B2B):** EXCLUSIVAMENTE con **Next.js 15 (App Router)**, React, y Tailwind CSS.
- **`apps/site` (Catálogo Móvil B2C):** EXCLUSIVAMENTE con **Astro 5** y **SolidJS** para islas interactivas.
- **`packages/contracts`:** Única fuente de verdad de modelado. Todo tipado y validación debe originarse en esquemas `Zod` exportados desde aquí.
- **Backend (BaaS):** Supabase (PostgreSQL). Prohibido crear servidores Node/Express tradicionales.

### PROTOCOLO ZERO-TRUST CI/CD
- Todo código generado debe compilar estáticamente (`npm run build`).
- Las decisiones arquitectónicas requieren un `implementation_plan.md` con aprobación explícita del humano (`request_feedback: true`) antes de ejecutar, a menos que se active el "God Mode".
