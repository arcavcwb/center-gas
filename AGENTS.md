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

El detalle completo de disparadores por fase está en `architecture.md`.

## Configuración de herramientas

MCP servers del proyecto: `.agents/mcp_config.json`
