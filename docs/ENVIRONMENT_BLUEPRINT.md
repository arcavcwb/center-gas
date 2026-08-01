# Environment Blueprint & IDE Template

Este documento registra la configuración estructural, de gobernanza y reglas de inteligencia artificial (IDE) implementadas en este repositorio. Su objetivo es servir como **plantilla estándar** (Blueprint) para futuros proyectos que requieran el mismo nivel de orquestación, seguridad (Zero-Trust) y aislamiento.

## 1. Reglas Maestras de Aislamiento y Gobernanza (Archivos Ancla)
Para evitar la contaminación de contexto entre proyectos (ej. KIs genéricos de AG Kit o comandos slash de otros repositorios), se deben incluir las mismas reglas estrictas en **tres archivos ancla**. 

- `AGENTS.md` (Punto de entrada de agentes)
- `.clinerules` (Reglas globales del IDE Antigravity / Cline)
- `.cursorrules` (Reglas si se emplea Cursor IDE)

**Regla de Oro a inyectar en todos ellos:**
```markdown
### CORE PHILOSOPHY: "Plane for the Business, Git for the Code"
Eres el Antigravity Squad operando bajo una filosofía estricta de Zero-Trust (Cero Confianza).

### AISLAMIENTO ESTRICTO DE CONTEXTO (WORKSPACE ISOLATION)
- **Frontera de Proyecto:** Bajo NINGUNA circunstancia debes aplicar Knowledge Items (KIs), workflows, slash commands o reglas que hagan referencia a rutas fuera de este directorio.
- Si el IDE inyecta KIs globales, ESTÁS OBLIGADO A IGNORARLOS si no pertenecen explícitamente a este repositorio. No se permite la contaminación cruzada de proyectos.
```

## 2. Gobernanza Ágil y Trazabilidad (Plane)
El entorno obliga a que ninguna línea de código se modifique sin un **Plane Issue** asignado.
- **MCP de Plane:** Se utiliza la herramienta MCP (`add_cycle_issues`, `update_issue`, `add_issue_comment`) para actualizar el negocio.
- **Machine of States:** Los estados deben transicionar estrictamente: `Todo` -> `Design Review` (al proponer `implementation_plan.md`) -> `In Progress` (aprobado y con `task.md`) -> `Done` (al integrar a Git).
- **Walkthroughs Duales:** Obligación de crear un archivo Markdown final del sprint (ej. `docs/walkthroughs/issue-xxx.md`) e inyectar su equivalente en comentario HTML en Plane.

## 3. Arquitectura del Monorepo (Turborepo)
El template debe replicar la estructura híbrida B2B/B2C con pnpm:
- `apps/web/`: Panel Administrativo B2B (Next.js 15, App Router, SSR, Tailwind).
- `apps/site/`: Front B2C y Apps Ligeras (Astro 5 + SolidJS). Zero-JS inicial y reactividad vía islas para máxima velocidad.
- `packages/contracts/`: Zod schemas y types. (Única fuente de verdad).
- `supabase/`: Migraciones SQL puras, Edge Functions (si aplican) y reglas de Row Level Security (RLS). No hay servidores backend intermedios.

## 4. Skills de Agentes
El entorno carga `skills` bajo demanda ubicados en `.agents/skills/`. Los agentes deben leer sus respectivos `SKILL.md` con `view_file` para adquirir el conocimiento tecnológico específico (ej. `.agents/skills/n8n/SKILL.md` o `.agents/skills/astro-solid/SKILL.md`).

---
> **Nota de Clonación:** Al iniciar un nuevo proyecto desde esta plantilla, asegurarse de copiar la carpeta `.agents`, `.clinerules`, y `.cursorrules` tal cual, y ajustar únicamente los IDs de los proyectos de Plane en `.agents/mcp_config.json`.
