# 📦 Guía de Portabilidad del Flujo Agéntico (Antigravity Squad)

Esta guía detalla cómo exportar, instalar y operar el **Flujo Agéntico Autónomo** en **cualquier proyecto de software nuevo o existente**, con **1 solo comando**, sin acoplar credenciales y con soporte nativo para dos modos de operación: **Modo Operativo (Git-Only)** y **Modo Enterprise (Plane + Scrum)**.

---

## ⚡ Inicio Rápido (1 Comando)

### Opción A: Desde un repositorio existente en tu máquina local
Si ya clonaste `center-gas-platform` en tu máquina o tienes acceso a su directorio:

```bash
# Modo Interactivo con asistente visual
bash /ruta/hacia/center-gas-platform/scripts/init-agentic-flow.sh --target /ruta/a/mi-nuevo-proyecto

# Modo Operativo Directo (Git-Only, sin Plane ni Scrum)
bash /ruta/hacia/center-gas-platform/scripts/init-agentic-flow.sh --mode operative --target .

# Modo Enterprise Directo (Plane + Scrum completo)
bash /ruta/hacia/center-gas-platform/scripts/init-agentic-flow.sh --mode enterprise --target .
```

---

## 🧭 ¿Qué Modo Deberías Elegir?

| Criterio | 🛠️ Modo Operativo (Git-Only) | 🏛️ Modo Enterprise (Plane + Scrum) |
| :--- | :--- | :--- |
| **Audiencia** | Startups, prototipos, MVPs, desarrolladores solo, repos open source. | Equipos corporativos, agencias, proyectos B2B con múltiples stakeholders. |
| **Gobernanza Externa** | **0 dependencias externas** (Sin Plane, sin Jira, sin Notion). | **Plane.so** como Única Fuente de Verdad (Single Source of Truth). |
| **Gestión de Tareas** | `task.md` local + Pull Requests + `walkthrough.md`. | Issues en Plane + Sprints + Ciclos de Scrum + PRs en GitHub. |
| **Agentes Activos** | 4 agentes clave: Arquitecto, Frontend, Backend/Database, QA/Reviewer. | 10 agentes especializados (PO, Scrum Master, UI Designer, Security, etc.). |
| **Credenciales Requeridas** | 0 tokens externos requeridos para operar el flujo base. | `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, `PLANE_PROJECT_ID`. |
| **ADN de Calidad** | ✅ Impeccable UI/UX, Ponytail Lean, Caveman Tokens, Zero-Trust CI. | ✅ Impeccable UI/UX, Ponytail Lean, Caveman Tokens, Zero-Trust CI. |

---

## 🔌 Configuración Desacoplada de `.env` y MCP

Para garantizar portabilidad real, las configuraciones de herramientas MCP (`Model Context Protocol`) y variables secretas nunca se queman en el código:

### 1. Variables de Entorno (`.env`)
El instalador genera automáticamente un archivo `.env` inicial basado en `.env.example`:
- **Modo Operativo:** Solo incluye variables del stack propio de tu app (Base de datos, Supabase, APIs de terceros). No solicita tokens de Plane.
- **Modo Enterprise:** Incluye sección documentada para Plane (`PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, `PLANE_PROJECT_ID`).

### 2. Generación Dinámica de MCP (`.agents/mcp_config.json`)
El script `init-agentic-flow.sh` lee las variables de entorno de tu proyecto y genera el archivo `.agents/mcp_config.json` sustituyendo los placeholders:
- En **Modo Operativo**, solo inyecta servidores MCP locales (como `@playwright/mcp` para testing E2E autónomo).
- En **Modo Enterprise**, inyecta además el servidor `@plane/mcp` con la autenticación resuelta desde el `.env`.

### 3. Diagnóstico Automático de Salud (`--check-env`)
Puedes auditar en cualquier momento que tu entorno y tus variables estén correctamente configuradas ejecutando el modo Doctor:

```bash
bash scripts/init-agentic-flow.sh --check-env
```

Salida esperada:
```text
🔍 Ejecutando Diagnóstico de Entorno (Doctor)...

  ✓ Git inicializado (rama activa: main)
  ✓ GitHub CLI (gh) autenticado como: @usuario
  ✓ Archivo .env presente
    • Variables detectadas
  ✓ Skills maestras presentes: Impeccable, Caveman, Ponytail

✨ Todo en orden. Tu entorno agéntico está 100% operativo.
```

---

## 🏗️ Ejemplos de Implementación por Stack

El flujo agéntico es agnóstico del lenguaje y framework:

### Ejemplo 1: Nuevo Proyecto Next.js / React
```bash
# 1. Crear app Next.js
npx create-next-app@latest mi-saas --typescript --tailwind --app --src-dir
cd mi-saas

# 2. Desplegar flujo agéntico operativo
bash /ruta/hacia/scripts/init-agentic-flow.sh --mode operative --target .

# 3. Validar entorno
bash scripts/init-agentic-flow.sh --check-env

# 4. Iniciar sesión con Antigravity / Claude Code / Cursor
# ¡Listo! El agente seguirá las superules locales y las skills maestras.
```

### Ejemplo 2: Backend Python (FastAPI / Django)
```bash
# 1. Crear proyecto Python
mkdir api-core && cd api-core
git init

# 2. Desplegar flujo operativo
bash /ruta/hacia/scripts/init-agentic-flow.sh --mode operative --target .

# 3. Ajustar superules.md si requieres pytest en vez de pnpm:
# Editar sección Zero-Trust CI/CD en .agents/rules/superules.md
```

---

## 🧬 Estructura Desplegada en tu Proyecto

Al ejecutar el inicializador, tu proyecto recibe la siguiente estructura limpia:

```text
tu-proyecto/
├── .agents/
│   ├── rules/
│   │   └── superules.md        # Freno cognitivo y reglas de rigor
│   ├── skills/
│   │   ├── impeccable/         # Motor de diseño y anti-patrones UI/UX
│   │   ├── ponytail/           # Filosofía de arquitectura Lean / YAGNI
│   │   └── caveman/            # Protocolo de compresión y ahorro de tokens
│   ├── mcp_config.template.json
│   └── mcp_config.json         # Servidores MCP activos generados
├── docs/
│   └── walkthroughs/           # Evidencia visual y técnica de tareas terminadas
├── scripts/
│   └── init-agentic-flow.sh    # Script de mantenimiento y doctor
├── .env.example                # Plantilla de credenciales
├── .gitignore                  # Blindado para evitar filtración de .env
├── AGENTS.md                   # Catálogo de roles y prompts del squad
└── task.md                     # Checklist operativo para la tarea en curso
```

---

## 🔄 Migración de Modo Operativo a Enterprise

Si tu proyecto inició como un MVP en **Modo Operativo** y posteriormente escala a una empresa que requiere **Plane.so** y sprints formales:

1. Ejecuta el inicializador con la bandera de actualización:
   ```bash
   bash scripts/init-agentic-flow.sh --mode enterprise --target .
   ```
2. Completa las credenciales de Plane en `.env`:
   ```dotenv
   PLANE_API_KEY=tu_plane_api_key
   PLANE_WORKSPACE_SLUG=mi-organizacion
   PLANE_PROJECT_ID=uuid-del-proyecto
   ```
3. Ejecuta el chequeo de salud:
   ```bash
   bash scripts/init-agentic-flow.sh --check-env
   ```
4. El squad comenzará a reportar los avances directamente a Plane.so.
