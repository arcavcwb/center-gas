# AGENTS.md — Índice Maestro del Squad (Modo Operativo)

Este archivo es el único contexto que Antigravity CLI (`agy`) carga automáticamente al arrancar en este directorio. Todo lo demás se lee bajo demanda — ningún agente carga más de lo que su tarea actual necesita.

## Regla de cero asunción

Tu conocimiento del proyecto viene exclusivamente de los archivos que leas en la sesión actual. Si un tipo, contrato o parámetro no está explícitamente definido en el código o en la documentación leída, no lo asumas ni lo inventes.

## Squad Operativo Compacto

En el Modo Operativo (Lean / Solo-Dev / Fast-Track), el equipo prescinde de roles de gestión de sprints (PO, Scrum Master) y opera con un núcleo técnico de alta velocidad:

| Rol | Función Principal |
|---|---|
| `architect-agent` | Diseño técnico, contratos de datos, BDD y planes de implementación |
| `dev-agent` | Desarrollo en ramas feature (`feat/...`) obedeciendo contratos |
| `pr-reviewer-agent` | Auditoría estática de Pull Requests y control anti-slop |
| `qa-agent` | Verificación empírica, tests automatizados y pruebas de regresión |

## Reglas de Gobernanza Operativa

### Git as the Single Source of Truth
- **Sin gestores externos:** La planificación y el backlog se manejan en `task.md` y Pull Requests de GitHub.
- **Trunk-Based / Feature Branches:** Nunca se commitea a `main`. Cada tarea se aísla en `feat/TASK-...` o `feat/nombre-descriptivo`.
- **Doble Cierre:** Cada tarea finalizada genera su PR y un reporte técnico en `docs/walkthroughs/`.

### El Trinomio de Calidad de Código
1. **Impeccable Craft Floor:** 0 emojis unicode en interfaces, contraste WCAG 2.1 AA, touch targets $\ge 48\text{px}$ y verificación mecánica con `check:design`.
2. **Ponytail Architecture:** YAGNI radical, standard library first, plataforma nativa y la solución más corta y directa.
3. **Caveman Communication:** Respuestas técnicas directas, cero relleno y ahorro de tokens.
