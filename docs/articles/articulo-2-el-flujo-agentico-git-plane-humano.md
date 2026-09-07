# Artículo 2: El Flujo Agéntico en la Práctica
## Gobernanza "Git × Plane × Humano" y la Doctrina Zero-Trust

> **Serie:** Construyendo en Público — De 0 a Producción con un Squad Agéntico (Parte 2 de 3)  
> **Autor:** Antigravity Squad & Lead de Proyecto  
> **Tags:** #AIAgents #AgenticFlow #SoftwareEngineering #DevOps #GitFlow #ZeroTrust

---

### La Gran Ilusión del "Vibe Coding"

El auge de los modelos de lenguaje (LLMs) ha popularizado una fantasía peligrosa: la idea de que puedes sentarte frente a una ventana de chat, tirar prompts improvisados durante 4 horas y salir con una aplicación de producción lista para operar un negocio real.

Cualquiera que haya intentado esto en un sistema medianamente complejo conoce el final inevitable:
1. **Alucinación de contratos:** La IA inventa tipos en el frontend que el backend jamás soporta.
2. **Código espagueti:** Archivos de 1.500 líneas con dependencias circulares y parches sobre parches.
3. **Amnesia de contexto:** A la décima interacción, el modelo "olvida" las reglas de negocio decididas al principio.
4. **Commits caóticos:** Cambios masivos directamente a la rama principal (`main`) sin pruebas ni trazabilidad.

Para construir **Center Gás**, descartamos el "vibe coding" desde el primer día. En su lugar, diseñamos e implementamos una metodología rigurosa documentada en nuestro manual técnico: **El Flujo Agéntico Git × Plane × Humano** (`docs/15-agentic-flow-manual.md`).

---

### El Triángulo de Gobernanza

El principio fundacional de nuestro modelo es que los agentes de inteligencia artificial son **obreros técnicos extraordinariamente rápidos, pero jamás deben tomar decisiones estratégicas de negocio por su cuenta**.

Para gobernar el flujo, establecimos un triángulo de separación de poderes:

```
                              👤 HUMANO
                           (Autoridad Final)
                           /               \
            Aprueba Gates /                 \ Define Criterios
                         /                   \
                        ▼                     ▼
             📋 PLANE ◄────────────────────────► 🔀 GIT
         (Fuente de Verdad)                 (Sistema Judicial)
         Qué hacer y por qué                Cómo se implementó
         Backlog y Sprints                  Commits, PRs y Diffs
         Bitácora de Auditoría              Validación Mecánica CI
```

- **Plane (El Cerebro Organizacional):** *Si no está en Plane, no existe.* Ningún agente tiene autorización para escribir una sola línea de código si no existe un ticket atómico abierto con criterios de aceptación claros. Al terminar cada tarea, el agente está obligado a redactar un reporte técnico detallado en HTML dentro del ticket, enlazando el commit squash y el Pull Request.
- **Git / GitHub (El Sistema Judicial):** Todo cambio vive en aislamiento dentro de una rama de corta vida (`feat/ISSUE-XXX`). La rama `main` está estrictamente protegida. Ningún agente puede comitear directamente a `main`; el código debe someterse a un Pull Request formal.
- **El Humano (El Soberano de los Gates):** El humano no pierde el tiempo escribiendo código boilerplate ni formateando CSS. Su rol es actuar como juez en los **Gates de Aprobación**: valida el diseño arquitectónico, define los márgenes de negocio y aprueba las salidas a producción.

---

### La Matriz de Agentes Especializados

En lugar de usar un único agente generalista para todo, dividimos las responsabilidades en **10 roles especializados**:

| Agente | Dominio y Responsabilidad | Restricción Técnica Estricta |
|---|---|---|
| `@architect-agent` | Diseño de arquitectura, contratos Zod y diagramas BDD | **Prohibido tocar código de producto.** Solo diseña y espera aprobación humana. |
| `@po-agent` | Historias de usuario y criterios de aceptación Gherkin | Traduce negocio a especificaciones funcionales en Plane. |
| `@scrum-master-agent` | Gestión del ciclo, cálculo de velocidad y estados en Plane | Mueve tickets en la máquina de estados. |
| `@designer-agent` | Sistema de diseño, tokens CSS y paletas accesibles | Opera exclusivamente bajo el estándar **Impeccable**. |
| `@frontend-dev-agent` | `apps/site` (Astro/Solid) y `apps/web` (Next.js 15) | **Consume contratos Zod; prohibido inventar tipos propios.** |
| `@backend-dev-agent` | Supabase, migraciones SQL, funciones RPC y RLS | Define los esquemas Zod en `packages/contracts` antes de codificar. |
| `@pr-reviewer-agent` | Auditoría estática de Pull Requests y `git diff` | Actúa como juez implacable de caja negra. Si el diff viola el PRD, bloquea el merge. |
| `@qa-agent` | Pruebas E2E (Playwright) y pruebas unitarias (Vitest) | Escritura restringida a `tests/`. No modifica código de producto. |
| `@devops-agent` | Monorepo Turborepo, configuraciones de Vercel y CI/CD | Gestión de builds y variables de entorno. |
| `@automation-agent` | Orquestación de webhooks y flujos de n8n con WhatsApp | Automatización asíncrona de eventos. |

---

### La Regla Estricta Anti-Olvido: El "IDE Memory Anchor"

Uno de los descubrimientos más valiosos durante los 5 sprints fue cómo resolver la **amnesia de contexto** de los LLMs. Cuando una sesión de desarrollo se extiende o el contexto se trunca, el modelo tiende a relajarse: programa la solución y da la tarea por concluida sin abrir el PR o sin documentar en Plane.

Para erradicar esto, codificamos en nuestras `superules.md` una salvaguarda estructural: el **IDE Memory Anchor**.

Cada vez que el agente entra en modo de planificación y genera el archivo `task.md`, **está obligado por contrato a incluir como última fase de su checklist lo siguiente**:

```markdown
- [ ] Gobernanza y Git Flow (CRÍTICO):
  - [ ] NUNCA comitear directamente a main.
  - [ ] Verificar estar en una rama feature (git checkout -b feat/ISSUE-XXX).
  - [ ] Si involucra UI/UX o Frontend: Ejecutar pnpm run check:design (0 anti-patrones).
  - [ ] Ejecutar git add . y git commit -m "...".
  - [ ] Ejecutar git push -u origin feat/ISSUE-XXX.
  - [ ] Actualizar la descripción del PR vía API (gh api -X PATCH ...).
  - [ ] Generar walkthrough técnico en docs/walkthroughs/.
  - [ ] Actualizar Plane (Estado Done + Comentario técnico con Hash y PR).
```

**La regla de oro del sistema:** *Está estrictamente prohibido marcar una tarea como completada si estos checkboxes no están verificados en la realidad del repositorio.* Esto transformó la gobernanza de una recomendación teórica a un hábito mecánico inquebrantable.

---

### Zero-Trust: La Máquina no Confía en la Máquina

La filosofía de **Cero Confianza** significa que ningún componente confía en la palabra del otro:

1. **Zero-Trust de Contratos:** El Frontend no puede enviar un payload con el total monetario precalculado (`{"total": 0.00}`). Si lo hiciera, la función RPC de Supabase simplemente ignora el campo y suma los precios directamente de la tabla `products` en la base de datos para evitar fraudes en el checkout.
2. **Zero-Trust de Calidad:** Antes de hacer merge de cualquier Pull Request, se ejecutan de forma obligatoria tres barreras mecánicas:
   - `pnpm turbo run build`: Compilación estática estricta en TypeScript sin warnings ni tipos `any`.
   - `pnpm run test:unit`: 38 pruebas unitarias con **Vitest** validando cada regla de negocio (descuentos, cálculo de vasilhames, troco exacto).
   - `pnpm run check:design`: Detección AST de anti-patrones visuales con el motor **Impeccable**.

---

### El Resultado Operativo

Gracias a este flujo agéntico:
- Se cerraron **28 Issues en Plane** con 100% de trazabilidad.
- Se completaron **6 Módulos funcionales**.
- Se realizaron **49 Pull Requests** limpios, documentados y squash-merged a `main`.
- **Cero roturas en la rama principal.**

En el **Artículo 3**, abordaremos la frontera final: cómo llevamos la experiencia visual del software al estándar **Impeccable**, erradicando el "AI Slop", prohibiendo los emojis infantiles y optimizando el diseño para la luz solar directa en la calle.
