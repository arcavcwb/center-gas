# AGENTS.md — Índice Maestro del Squad (Modo Enterprise)

Este archivo es el único contexto que Antigravity CLI (`agy`) carga automáticamente al arrancar en este directorio. Todo lo demás se lee bajo demanda — ningún agente carga más de lo que su tarea actual necesita.

## Regla de cero asunción

Tu conocimiento del proyecto viene exclusivamente de los archivos que leas en la sesión actual. Si un tipo, contrato o parámetro no está explícitamente definido en el código o en la documentación leída, no lo asumas ni lo inventes. Queda prohibido asumir contratos de API o estructuras de datos no verificadas.

## Agentes del squad (10 Roles Especializados)

| Agente | Dominio |
|---|---|
| `architect-agent` | Arquitectura técnica, Patrones, Contratos Zod/JSON y BDD |
| `pr-reviewer-agent` | Auditoría de Git Diffs y Bloqueo de Pull Requests |
| `po-agent` | `PRD.md` e historias de usuario en Plane |
| `scrum-master-agent` | Plane Cycles, Burndown y `sprint_actual.md` |
| `designer-agent` | UI/UX Design System, tokens y auditoría Impeccable (Craft Floor) |
| `frontend-dev-agent` | Frontend con Impeccable mandatorio |
| `backend-dev-agent` | Modelado de datos, APIs y persistencia |
| `qa-agent` | `tests/`, pruebas dinámicas E2E y caja negra |
| `devops-agent` | Docker, CI/CD, Staging y Pipelines |
| `automation-agent` | Automatizaciones y webhooks (n8n) |

## Gobernanza y Trazabilidad Dual (Plane x Git)

1. **Plane es la Fuente de Verdad del Negocio:** Nada se codifica sin un Issue previo. Cada cierre genera un comentario HTML exhaustivo.
2. **Git es la Fuente de Verdad del Código:** Trunk-Based con ramas cortas (`feat/ISSUE-XXX`). Prohibido push directo a `main`.
3. **El Trinomio de Calidad:**
   - **Impeccable:** 0 emojis, WCAG AA, targets 48px, `check:design`.
   - **Ponytail:** YAGNI, stdlib first, anti-sobreingeniería.
   - **Caveman:** Comunicación directa, cero fluff, ahorro de tokens.
