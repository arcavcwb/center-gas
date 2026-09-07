# 🚀 Guía de Despliegue en Vercel (Monorepo Turborepo)

Esta guía documenta la configuración y despliegue de las **dos aplicaciones** que componen la plataforma **Center Gás** en Vercel bajo una única cuenta de GitHub (`arcavcwb/center-gas`).

---

## 🏗️ Arquitectura Dual en Vercel

Vercel maneja los monorepos creando **un proyecto por cada aplicación frontend**, vinculados al mismo repositorio Git pero con diferente **Root Directory**:

| Proyecto Vercel | Directorio Raíz | Framework | Propósito | URL Pública |
| :--- | :---: | :---: | :--- | :--- |
| **`center-gas-site`** | `apps/site` | **Astro** | Catálogo B2C (Autoservicio) y App Móvil PWA del Repartidor (`/driver`) | [center-gas-site.vercel.app](https://center-gas-site.vercel.app) |
| **`center-gas-web`** | `apps/web` | **Next.js** | Panel B2B Administrativo del Dueño (Kanban en Tiempo Real y Dashboard de KPIs) | `center-gas-web.vercel.app` |

---

## 📱 Proyecto 1: `center-gas-site` (Ya Configurado y Online)
- **Estado:** 🟢 Desplegado y funcionando.
- **Variables de Entorno en Vercel:**
  - `PUBLIC_SUPABASE_URL`: `https://fsfaqzayoziaeaihycos.supabase.co`
  - `PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 💻 Proyecto 2: `center-gas-web` (Instrucciones de Configuración en 1 Minuto)

Para activar el panel B2B en producción, sigue estos sencillos pasos en tu navegador:

### Paso 1: Importar Repositorio
1. Ingresa a tu panel de Vercel: 👉 [https://vercel.com/new](https://vercel.com/new)
2. Selecciona el repositorio **`arcavcwb/center-gas`** y haz clic en **Import**.

### Paso 2: Configurar Parámetros del Monorepo
1. **Project Name:** `center-gas-web`
2. **Framework Preset:** Confirmar que detecte **`Next.js`**
3. **Root Directory:** Haz clic en **Edit** y selecciona la carpeta **`apps/web`**
4. Deja activada la casilla *"Include source files outside of the Root Directory in the Build Step"*.

### Paso 3: Pegar Variables de Entorno (Environment Variables)
Agrega las siguientes 4 variables en la sección **Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fsfaqzayoziaeaihycos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZmFxemF5b3ppYWVhaWh5Y29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTE2MjMsImV4cCI6MjEwMzU2NzYyM30.VeIsAMcImkKzUk1Ims52Y54btygJg12UNgOvqaAMhIw
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZmFxemF5b3ppYWVhaWh5Y29zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk5MTYyMywiZXhwIjoyMTAzNTY3NjIzfQ.NOMiAeXjILk-85YSbT4KKrI8A4Z-_vmCMDkNhFKNDhg
SUPABASE_DB_URL=postgresql://postgres.bnvxyryrwqessjdewjjr:piratini1984*@aws-0-us-east-2.pooler.supabase.com:5432/postgres
```

### Paso 4: Desplegar
Haz clic en el botón azul **Deploy**. Vercel compilará `apps/web` en ~30 segundos y te asignará la URL `https://center-gas-web.vercel.app`.

---

## 🔄 Despliegue Continuo Automatizado (CI/CD)
Una vez configurado este segundo proyecto, **cada commit o Pull Request mergeado a `main` actualizará automáticamente ambos proyectos en paralelo**:
- Si modificas código de `apps/site`, Vercel despliega el catálogo.
- Si modificas código de `apps/web`, Vercel despliega el panel B2B.
- Si modificas `packages/contracts`, Vercel reconstruye ambos para garantizar compatibilidad Zero-Trust.
