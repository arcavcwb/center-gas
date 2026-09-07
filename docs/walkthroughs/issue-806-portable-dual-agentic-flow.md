# Walkthrough - ISSUE-806: Empaquetado Portable y Flujo Agéntico Dual (Enterprise / Operativo)

## 📌 Contexto y Objetivo
El objetivo de este issue fue resolver dos necesidades críticas del equipo de desarrollo y arquitectura:
1. **Desacoplamiento de Plane y Scrum (Modo Operativo):** Crear una versión liviana del flujo agéntico ("Modo Operativo") 100% gobernada por Git (`task.md`, ramas `feat/`, PRs y walkthroughs), sin dependencias obligatorias de Plane.so ni sobrecarga de ceremonias de Scrum.
2. **Portabilidad en 1 Comando:** Empaquetar el flujo y proveer un instalador universal (`scripts/init-agentic-flow.sh`) capaz de inicializar o actualizar las reglas de gobernanza, roles de agentes y skills maestras (`impeccable`, `caveman`, `ponytail`) en cualquier proyecto nuevo o existente en segundos.
3. **Gestión Desacoplada de `.env` y MCP:** Desacoplar credenciales para que no haya secretos quemados en el código, generando dinámicamente `.agents/mcp_config.json` a partir de `.env` y ofreciendo una herramienta de diagnóstico de salud (`--check-env`).

---

## 🛠️ Cambios Realizados

### 1. Plantillas Portables (`templates/agentic-flow/`)
- **`core-skills/`**: Empaquetadas las skills fundamentales del Antigravity Squad:
  - `impeccable`: Auditoría de calidad de interfaz, cero emojis unicode, WCAG AA y ergonomía táctil.
  - `caveman`: Protocolo de compresión y eficiencia de tokens.
  - `ponytail`: Arquitectura Lean y escalera YAGNI.
- **`mode-operative/`**:
  - `rules/superules.md`: Gobernanza estricta centrada en Git (`task.md`, PRs, Zero-Trust CI/CD), sin dependencias de Plane.
  - `AGENTS.md`: Squad técnico compacto de 4 roles (Arquitecto, Frontend, Backend/Database, QA).
  - `task-template.md`: Checklist operativo local.
  - `.env.example`: Variables limpias sin requisitos de Plane.
  - `mcp_config.template.json`: Configuración de MCP locales (Playwright).
- **`mode-enterprise/`**:
  - `rules/superules.md`: Gobernanza completa con Plane.so como Única Fuente de Verdad.
  - `AGENTS.md`: Squad corporativo completo de 10 agentes especializados.
  - `task-template.md`: Checklist con cierre y actualización obligatoria en Plane.
  - `.env.example`: Plantilla con variables completas de Plane y servicios externos.
  - `mcp_config.template.json`: MCP de Plane parametrizado.

### 2. Scaffolder Universal Autónomo (`scripts/init-agentic-flow.sh`)
- Menú interactivo con selector visual de modo (`Operativo` vs `Enterprise`).
- Soporte para ejecución desatendida / CI: `--mode operative|enterprise` y `--target <directorio>`.
- Generador dinámico de `.agents/mcp_config.json` a partir de las variables de entorno.
- Herramienta Doctor integrada (`--check-env`) que valida Git, gh CLI, variables `.env` y skills presentes.
- Blindaje automático de `.gitignore`.

### 3. Documentación Técnica y Guías
- **`docs/PORTABILITY_GUIDE.md`**: Guía paso a paso para desplegar el squad agéntico en 1 comando en stacks como Next.js, Python, Astro o Go.
- **`docs/17-dual-agentic-flow-modes.md`**: Documento de arquitectura detallando las diferencias, casos de uso y ADN común entre Modo Enterprise y Modo Operativo.
- **`sprint_actual.md`**: Actualizado con el registro de `ISSUE-806`.

### 4. Ajustes de Configuración
- **`.impeccable/config.json`**: Configurado para ignorar `templates/**` en el detector de anti-patrones para evitar falsos positivos en el código interno de la skill empaquetada.

---

## 🧪 Verificación Zero-Trust

- **Prueba Sandbox Modo Operativo:**
  ```bash
  bash scripts/init-agentic-flow.sh --mode operative --target /tmp/test-operative-app
  # Repositorio Git inicializado, reglas desplegadas, skills instaladas y .env creado.
  ```
- **Prueba Sandbox Modo Enterprise:**
  ```bash
  bash scripts/init-agentic-flow.sh --mode enterprise --target /tmp/test-enterprise-app
  # Estructura enterprise completa desplegada.
  ```
- **Diagnóstico Doctor de Salud:**
  ```bash
  bash scripts/init-agentic-flow.sh --check-env --target /tmp/test-operative-app
  # Git ✓ | GitHub CLI ✓ | Archivo .env ✓ | Skills ✓ -> 100% operativo.
  ```
- **Auditoría Impeccable:**
  ```bash
  pnpm run check:design
  # 0 anti-patterns detected.
  ```
- **Pruebas de Contratos:**
  ```bash
  pnpm --filter @center-gas/contracts test
  # 38/38 tests passing (100%).
  ```
- **Compilación Estática:**
  ```bash
  pnpm run build
  # 2/2 packages built successfully (Full Turbo).
  ```
