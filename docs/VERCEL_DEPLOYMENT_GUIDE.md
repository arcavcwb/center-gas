# 🚀 Guía de Despliegue en Vercel (Monorepo Turborepo)

> [!CAUTION]
> **⚠️ AVISO DE SEGURIDAD — Incidente 2026-09**
>
> Este documento contenía credenciales reales en texto plano (`anon key`, `SUPABASE_SERVICE_ROLE_KEY` y una cadena de conexión de Postgres **con la contraseña incluida**) y estuvo publicado en un repositorio **público**.
>
> De este archivo se retiraron los valores: aquí solo quedan marcadores del tipo `<NOMBRE_DE_LA_VARIABLE>`. **Retirarlos del documento NO es rotarlos**: siguen siendo recuperables del historial de git de un repositorio público, así que deben considerarse comprometidos mientras el proveedor los siga aceptando.
>
> **El estado de rotación de cada credencial se sigue únicamente en [`docs/SECURITY-INCIDENT-2026-09.md`](./SECURITY-INCIDENT-2026-09.md)** — esa es la única fuente de verdad. Ese runbook está **abierto**: no des por rotada ninguna clave que no figure allí como rotada.
>
> **Los valores reales NUNCA deben volver a este archivo ni a ningún `.md` del repositorio.** Viven únicamente en las *Environment Variables* de Vercel y en tu `.env` local (ignorado por git).
>
> Runbook del incidente: [`docs/SECURITY-INCIDENT-2026-09.md`](./SECURITY-INCIDENT-2026-09.md) · Catálogo de variables: [`.env.example`](../.env.example)

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
  - `PUBLIC_SUPABASE_URL`: `https://<SUPABASE_PROJECT_REF>.supabase.co` (pública, viaja al navegador)
  - `PUBLIC_SUPABASE_ANON_KEY`: `<PUBLIC_SUPABASE_ANON_KEY>` (pública por diseño; protegida por RLS)

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
Agrega las siguientes 4 variables en la sección **Environment Variables**, copiando los valores reales desde el **Dashboard de Supabase** (`Project Settings → API` y `Project Settings → Database`). **No los escribas aquí ni en ningún archivo versionado.**

```env
# 🌐 PÚBLICAS — se compilan dentro del bundle y viajan al navegador
NEXT_PUBLIC_SUPABASE_URL=https://<SUPABASE_PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEXT_PUBLIC_SUPABASE_ANON_KEY>

# 🔒 SECRETAS — solo servidor. La service_role omite RLS: acceso total a la base de datos
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
SUPABASE_DB_URL=postgresql://postgres.<SUPABASE_PROJECT_REF>:<SUPABASE_DB_PASSWORD>@<SUPABASE_POOLER_HOST>:5432/postgres
```

> [!WARNING]
> En Vercel, marca `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_DB_URL` como **Sensitive**, y no las expongas nunca con prefijo `NEXT_PUBLIC_`/`PUBLIC_`: ese prefijo las publicaría en el navegador.
> La descripción completa de cada variable está en [`.env.example`](../.env.example).

### Paso 4: Desplegar
Haz clic en el botón azul **Deploy**. Vercel compilará `apps/web` en ~30 segundos y te asignará la URL `https://center-gas-web.vercel.app`.

---

## 🔄 Despliegue Continuo Automatizado (CI/CD)
Una vez configurado este segundo proyecto, **cada commit o Pull Request mergeado a `main` actualizará automáticamente ambos proyectos en paralelo**:
- Si modificas código de `apps/site`, Vercel despliega el catálogo.
- Si modificas código de `apps/web`, Vercel despliega el panel B2B.
- Si modificas `packages/contracts`, Vercel reconstruye ambos para garantizar compatibilidad Zero-Trust.
