---
name: vite-modernizer
description: >
  Protocolo de migración quirúrgica y modernización de SPAs heredadas (Create React App, Webpack,
  Babel obsoleto) hacia Vite + React + TypeScript. Elimina dependencias muertas, configura
  HMR instantáneo, plugins oficiales y aliases de importación limpios (@/*).
license: MIT
---

# Vite Modernizer & Legacy SPA Migration

Create React App (`react-scripts`) y configuraciones antiguas de Webpack están obsoletas, son lentas, contienen decenas de vulnerabilidades de dependencias y no soportan el estándar moderno de ESM. Esta skill define la receta exacta para migrar una aplicación a Vite en minutos sin romper la lógica existente.

---

## 1. Reglas de Migración

1. **Erradicación de `react-scripts`:**
   Remover `react-scripts`, `craco`, `customize-cra` y configuraciones customizadas de Webpack/Babel.
2. **Adopción de ESM nativo:**
   El archivo `index.html` debe residir en la **raíz del proyecto** (no dentro de `public/`) y contener la etiqueta de entrada:
   ```html
   <script type="module" src="/src/index.tsx"></script>
   ```
3. **Variables de Entorno:**
   Reemplazar el prefijo obsoleto `REACT_APP_*` por `VITE_*` y acceder vía `import.meta.env.VITE_*` (en lugar de `process.env`).
4. **TypeScript Estricto:**
   Siempre preferir `.tsx` / `.ts` sobre `.js` / `.jsx`. Configurar `tsconfig.json` con `target: ESNext`, `moduleResolution: Bundler`, y `strict: true`.
5. **Path Aliases:**
   Configurar alias `@/` apuntando a `./src` tanto en `vite.config.ts` como en `tsconfig.json`.

---

## 2. Archivos Canónicos de Configuración

### `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    outDir: 'dist',
  },
});
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

---

## 3. Checklist de Limpieza de Dependencias

- [ ] Desinstalar `react-scripts`, `@testing-library/jest-dom` antiguo.
- [ ] Instalar `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`.
- [ ] Mover `index.html` de `public/` a `/` y agregar `<script type="module" src="/src/main.tsx"></script>`.
- [ ] Eliminar sintaxis `%PUBLIC_URL%` en `index.html` (reemplazar con rutas absolutas directas `/`).
- [ ] Actualizar scripts en `package.json`: `"dev": "vite"`, `"build": "tsc && vite build"`, `"preview": "vite preview"`.
- [ ] Verificar compilación estática ejecutando `npm run build` o `pnpm run build`.
