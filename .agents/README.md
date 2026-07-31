# Squad Agéntico sobre Antigravity CLI (agy) — Guía de instalación

## Cómo instalar

1. Copiá `AGENTS.md`, `.agents/` completo, y este `README.md` a la raíz de tu
   monorepo (junto a `architecture.md`, `PRD.md`, `packages/contracts`, etc. que
   ya tenés definidos en la especificación v3.0).
2. Corré `agy` en esa carpeta. Debería descubrir `AGENTS.md` automáticamente.
3. Corré `agy inspect` para confirmar qué cargó realmente: configuración,
   agentes, skills, MCP servers. Esto es más confiable que asumir que todo
   quedó bien conectado.
4. Corré `/agents` dentro de una sesión para ver los 8 agentes listados.

## Tres cosas para verificar antes de confiar en esto en producción

**1. Compatibilidad de skills externos.** Los skills que definimos para cada
agente (Impeccable, `AgentMantis/test-skills`, `supabase/agent-skills`,
`n8n-skills`, `webapp-testing`) fueron investigados como paquetes de skills en
general, no confirmados uno por uno como nativamente compatibles con el formato
de skill de Antigravity CLI (`.agents/skills/*.md` con frontmatter). Puede que
alguno necesite adaptarse o instalarse como plugin (`agy plugin import`) en vez
de funcionar tal cual. Verificalo con `agy inspect` después de instalar cada
uno.

**2. Esquema exacto de `mcp_config.json`.** Usamos la estructura `mcpServers`
que es la convención más común entre clientes MCP (y la que confirmamos
específicamente para el MCP oficial de Plane), pero no verificamos si
Antigravity CLI espera exactamente esa clave raíz o una distinta. Tratá el
archivo como plantilla, no como verdad confirmada, hasta que `agy inspect`
muestre los servers correctamente cargados.

**3. `inheritMcp` es una interpretación razonable, no 100% confirmada en
granularidad.** Marcamos `inheritMcp: true` solo en los agentes que
efectivamente necesitan herramientas MCP en vivo (Scrum Master, Frontend, QA,
DevOps, Automation) y lo omitimos en los que solo necesitan skills/conocimiento
(PO, Designer, Backend). No tenemos confirmado si Antigravity permite acotar
qué MCP servers específicos hereda cada subagente, o si es todo-o-nada. Si
heredar todo es un problema de aislamiento para vos (por ejemplo, no querés que
el PO Agent tenga acceso accidental a Plane), convendría revisar la
documentación de `inheritMcp` antes de asumir que el aislamiento por agente que
diseñamos en la especificación se sostiene tal cual a nivel de herramientas.

## Comando `devops-helper` en `mcp_config.json`

Quedó como placeholder — no verificamos el comando de arranque exacto del
DevOps Helper MCP (`rideRTD/RTD-DevOps`). Completalo antes de usar el agente
DevOps.
