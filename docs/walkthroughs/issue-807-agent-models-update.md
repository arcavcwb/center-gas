# Walkthrough - ISSUE-807: Actualización de Modelos de IA del Squad Agéntico

## 📌 Contexto y Objetivo
El objetivo de este issue fue alinear y modernizar las asignaciones de modelos de inteligencia artificial para los 10 agentes del **Antigravity Squad**, verificando los modelos reales disponibles en el runtime de Antigravity CLI (`agy models`) y optimizando el balance entre calidad de código, capacidad analítica y consumo de cuotas en el plan Claude Pro.

---

## 🛠️ Cambios Realizados

### 1. Definiciones de Agentes Actualizadas (`.agents/agents/`)
Se actualizaron los frontmatters de los agentes para reflejar la distribución óptima de 3 niveles:

- **Nivel 1: Constructores de Código & Arquitectura (Anthropic Claude)**
  - `architect-agent`: `claude-opus-4-6-thinking` (Razonamiento profundo para contratos Zod, esquemas SQL y diseño relacional).
  - `frontend-dev-agent`: `claude-sonnet-4-6` (Precisión sintáctica en Next.js 15, Astro 5, SolidJS y reglas Impeccable).
  - `backend-dev-agent`: `claude-sonnet-4-6` (Esquemas Zod en packages/contracts y migraciones Supabase con RLS).
  - `devops-agent`: `claude-sonnet-4-6` (GitHub Actions, Dockerfiles y despliegues en Vercel).

- **Nivel 2: Auditoría Crítica & Diagnóstico Forense (Gemini Pro)**
  - `pr-reviewer-agent`: `gemini-3.1-pro-high` (Ventana de contexto masiva para auditar diffs enteros sin agotar la cuota de Claude).
  - `qa-agent`: `gemini-3.1-pro-high` (Diseño de suites E2E Playwright y análisis de trazas/logs complejos).

- **Nivel 3: Gestión Ágil, Diseño & Automatización (Gemini 3.8 Flash High)**
  - `po-agent`: Actualizado a `gemini-3.8-flash-high` (Redacción de PRD e historias de usuario).
  - `scrum-master-agent`: Actualizado a `gemini-3.8-flash-high` (Sincronización de Plane.so y sprint log).
  - `designer-agent`: Actualizado a `gemini-3.8-flash-high` (Tokens visuales y assets SVG).
  - `automation-agent`: Actualizado a `gemini-3.8-flash-high` (Workflows n8n y webhooks de WhatsApp).

### 2. Documentación Central Sincronizada
- Sincronizadas las tablas maestras de agentes en `README.md`, `README.en.md` y `README.pt-br.md`.
- Registrado el ticket `ISSUE-807` en `sprint_actual.md`.

---

## 🧪 Verificación Zero-Trust

| Verificación | Comando | Resultado |
| :--- | :--- | :---: |
| **Modelos CLI (`agy models`)** | `agy models` | 🟢 Todos los identificadores son válidos |
| **Auditoría Impeccable** | `pnpm run check:design` | 🟢 0 anti-patterns |
| **Pruebas de Contratos Zod** | `pnpm --filter @center-gas/contracts test` | 🟢 38/38 passing |
| **Compilación Monorepo** | `pnpm run build` | 🟢 Full Turbo (Next.js 15 + Astro 5) |
