---
name: pnpm-monorepo-architect
description: >
  Gobernanza y patrones de arquitectura para Monorepos escalables utilizando pnpm workspaces y Turborepo.
  Previene dependencias fantasma (phantom dependencies), optimiza el pipeline de build incremental con caché,
  y gestiona contratos compartidos de datos mediante 'workspace:*'.
license: MIT
---

# pnpm Monorepo Architect & Turborepo Guard

En proyectos con múltiples aplicaciones (Web B2B, Mobile B2C, packages compartidos), un monorepo mal configurado genera dependencias fantasma, builds redundantes e inconsistencias entre versiones de paquetes. Esta skill establece la gobernanza estricta para monorepos con `pnpm` y `Turborepo`.

---

## 1. Reglas Innegociables

1. **Protocolo `workspace:*` Estricto:**
   Toda dependencia entre paquetes internos (ej. `@org/contracts`, `@org/ui`) debe usar la sintaxis `"@org/contracts": "workspace:*"` en el `package.json` consumidor.
2. **Cero Dependencias Fantasma (No Phantom Dependencies):**
   Si una aplicación o paquete utiliza una librería (`zod`, `lucide-react`, etc.), DEBE estar declarada explícitamente en el `package.json` de ese paquete específico, nunca asumida por estar en la raíz.
3. **Pipeline de Turborepo Determinístico:**
   El archivo `turbo.json` en la raíz debe declarar inputs y outputs explícitos para que el caché remoto o local no reutilice builds desactualizados:
   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "tasks": {
       "build": {
         "dependsOn": ["^build"],
         "inputs": ["$TURBO_DEFAULT$", ".env*"],
         "outputs": [".next/**", "!.next/cache/**", "dist/**"]
       },
       "test": {
         "dependsOn": ["^build"],
         "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
       }
     }
   }
   ```
4. **Estructura Estándar de Monorepo:**
   - `apps/`: Aplicaciones desplegables (ej: `apps/web`, `apps/site`).
   - `packages/`: Paquetes y librerías compartidas (ej: `packages/contracts`, `packages/ui`).
   - `tools/` o `scripts/`: Utilidades globales de compilación y CI.

---

## 2. Archivo Canónico `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## 3. Comandos Esenciales de Operación

- **Ejecutar tarea en un solo paquete:**
  ```bash
  pnpm --filter web build
  pnpm --filter @org/contracts test
  ```
- **Agregar dependencia a un paquete específico:**
  ```bash
  pnpm --filter web add @supabase/ssr
  pnpm --filter site add -D tailwindcss
  ```
- **Auditoría de integridad de dependencias:**
  ```bash
  pnpm check
  ```
