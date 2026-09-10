# 🚨 Incidente de seguridad 2026-09 — Runbook de rotación de credenciales

> **Estado:** abierto · **Repositorio afectado:** `arcavcwb/center-gas` (**público** en GitHub)
> **Este documento no contiene ninguna credencial.** Los valores reales solo existen en los paneles de cada proveedor y en tu gestor de contraseñas.

**Resumen en una línea:** el repositorio es público y tenía credenciales de producción escritas en texto plano. Cualquiera que haya clonado el repo (o cualquier bot que rastree GitHub) las tiene. **Hay que rotarlas todas.**

**Ventana de exposición:** desde el primer commit del repositorio (`961d0ed`, 2026-07-30) hasta hoy. La guía de Vercel con la `service_role` y la contraseña de Postgres se añadió en `c978db8` (2026-09-07).

---

## (a) Qué estuvo expuesto y dónde

Rutas y líneas **del estado publicado en `main`** (antes del PR que acompaña a este documento).

| # | Credencial | Archivo y línea |
| :-- | :--- | :--- |
| 1 | Supabase `service_role` key (**omite todo el RLS**) | `docs/VERCEL_DEPLOYMENT_GUIDE.md:46` · `push_local_n8n.py:20` · `workflows/n8n/WF-02_WhatsApp_Outbound.json:57,61,422,426` |
| 2 | Supabase `anon` key | `docs/VERCEL_DEPLOYMENT_GUIDE.md:22,45` |
| 3 | Contraseña de Postgres **del proyecto Cápsula** (dentro de la cadena de conexión; ver **(e)**) | `docs/VERCEL_DEPLOYMENT_GUIDE.md:47` |
| 4 | API key de n8n (JWT, permite crear/borrar workflows) | `deploy_n8n_workflows.py:5` · `push_local_n8n.py:7` · `.agents/mcp_config.json:17` |
| 5 | API key de Plane | `sync_plane.py:3` · `get_plane_status.py:3` · `audit_traceability.py:3` · `.agents/mcp_config.json:7` |
| 6 | API key de Evolution API (envío de WhatsApp) | `push_local_n8n.py:19` · `scripts/test-e2e-whatsapp-lifecycle.js:13` · `workflows/n8n/WF-02_WhatsApp_Outbound.json:152,192,232,517,557,597` · descrita en prosa en `docs/walkthroughs/ISSUE-403-evolution-v2-infrastructure.md:12` |
| 7 | Token Bearer del webhook Supabase → n8n | `scripts/test-e2e-whatsapp-lifecycle.js:15` · `workflows/n8n/WF-02_WhatsApp_Outbound.json:34,399` · `supabase/migrations/20260829000000_mvp_water_seed_and_webhook.sql:24` · `supabase/migrations/20260829210300_update_webhook_contract.sql:36` · descrito en prosa en `docs/walkthroughs/n8n-security.md:12` y `docs/walkthroughs/refactor-mvp.md:30` |
| 8 | Contraseña de `admin@centergas.com` (owner del panel B2B) | `apps/web/scripts/create_owner.js:20` |
| 9 | Contraseña de `motoboy1@centergas.com` | `apps/web/scripts/create_driver.js:15` |

**Impacto peor caso:** con la `service_role` key (#1), un tercero lee, altera o borra toda la base de datos de Center Gas (clientes, pedidos, precios) saltándose RLS. La contraseña de Postgres (#3) da acceso directo y total a la base de **Cápsula**, que es un proyecto distinto — ver **(e)**. Con la key de Evolution (#6) envía WhatsApp desde el número del negocio, lo que además puede provocar el baneo del chip.

---

## (b) Orden de rotación

Hazlas en este orden: primero lo que da acceso total a los datos, luego lo que permite suplantar al negocio.

**1. Supabase — `service_role` y `anon` key**
Dashboard de Supabase → `Project Settings` → `API Keys` → **Rotate / Revoke** ambas.
Después actualiza el valor nuevo en: Environment Variables de Vercel (ambos proyectos: `center-gas-site` y `center-gas-web`), tu `.env` local, las Credentials de n8n y los GitHub Secrets si los usa el pipeline.
*Al rotar la `anon` key hay que redesplegar ambas apps: va compilada dentro del bundle.*

**2. Supabase — contraseña de Postgres, en LOS DOS proyectos (son de productos distintos)**
Dashboard → `Project Settings` → `Database` → `Reset database password`.

- **`bnvxyryrwqessjdewjjr` (Cápsula) — prioritario:** es la contraseña que estuvo publicada en claro. Rótala y avisa a quien opere Cápsula. **No borres el proyecto:** está vivo (ver **(e)**).
- **`fsfaqzayoziaeaihycos` (Center Gas):** su contraseña nunca estuvo en el repositorio, pero rótala en el mismo paso — la `service_role` de este proyecto sí se filtró.

Después actualiza `SUPABASE_DB_URL` donde se use (Vercel, GitHub Secrets, `.env` local), **verificando que apunta al ref de Center Gas**: la guía publicada tenía el de Cápsula.

**3. n8n — API key**
n8n → `Settings` → `n8n API` → borra la key existente y crea una nueva.
Actualiza `N8N_API_KEY` en `.env` y en `.agents/mcp_config.json` (que ahora la lee de `${N8N_API_KEY}`).

**4. Plane — API key**
Plane → `Workspace Settings` → `API Tokens` → revoca el token actual y genera otro.
Actualiza `PLANE_API_KEY` en `.env` y en los GitHub Secrets del repositorio.

**5. Evolution API — API key**
En el VPS: cambia `AUTHENTICATION_API_KEY` en el `.env` que acompaña al `docker-compose.yml` y reinicia el stack (`docker compose up -d`).
Actualiza `EVOLUTION_API_KEY` en las Credentials de n8n y en tu `.env`.
*Verifica después que la instancia `centerGas` sigue conectada y que un mensaje de prueba llega.*

**6. Token del webhook Supabase → n8n (`SECURE_OUTBOUND_TOKEN`)**
Genera uno nuevo: `openssl rand -hex 32`.
Cámbialo **en los dos extremos a la vez**, o las notificaciones de WhatsApp dejan de salir:
- **Supabase:** la migración `20260909000000_security_containment.sql` saca el token del código y lo mueve a la tabla `system_config`. Tras aplicarla, escribe el token nuevo ahí (la propia migración deja el `UPDATE` comentado, con el marcador `CONFIGURAR-TOKEN-ROTADO`).
- **n8n:** el nodo *Validate Token* del `WF-02` y la variable `SECURE_OUTBOUND_TOKEN` de tu `.env`.

**7. Contraseñas de las cuentas de usuario**
Supabase → `Authentication` → `Users`: cambia la contraseña de `admin@centergas.com` y la de `motoboy1@centergas.com`.
Revisa también en esa pantalla si hay sesiones o usuarios que no reconozcas.

**8. Verificación posterior (mismo día)**
- Supabase → `Logs` → busca accesos desde IPs desconocidas en la ventana de exposición.
- n8n → `Executions`: busca ejecuciones que tú no disparaste.
- Evolution API → historial de la instancia: busca mensajes salientes que no reconozcas.
- Base de datos: revisa `orders` y `products` por registros o precios alterados.

---

## (c) Por qué rotar va ANTES de limpiar el historial de git

Porque **son cosas distintas y solo una de ellas te protege**.

Una clave filtrada deja de ser peligrosa cuando el proveedor deja de aceptarla. Punto. Borrar el commit que la contenía **no invalida nada**: la clave sigue siendo válida en Supabase, en n8n, en Plane y en Evolution.

Además, el repositorio es público desde julio: el historial ya está fuera de tu control. Está en clones de terceros, en la caché de GitHub, en los forks, y en los índices de los bots que rastrean GitHub buscando exactamente estos patrones (una `service_role` key de Supabase y un `plane_api_...` se detectan en minutos). Purgar el historial no borra ninguna de esas copias.

Conclusión operativa: **rota primero (sección b), y trata la limpieza del historial (sección d) como higiene posterior, opcional y no urgente.** Si solo tienes tiempo para una cosa hoy, que sea rotar.

---

## (d) Purga del historial — PASO POSTERIOR Y DESTRUCTIVO

> [!CAUTION]
> **No ejecutes esto hasta haber terminado la sección (b).**
> Reescribe todos los hashes de commit del repositorio, exige `--force` al empujar, y rompe cualquier clon o rama en curso de otra persona. Coordínalo antes: avisa a todo el que tenga el repo clonado, y espera a que no haya Pull Requests abiertos (una reescritura los puede dejar inservibles).

```bash
# 0. Copia de seguridad completa antes de tocar nada
git clone --mirror https://github.com/arcavcwb/center-gas.git ~/backup-center-gas.git

# 1. Instalar git-filter-repo (no viene con git)
pip install git-filter-repo

# 2. Clon fresco: git-filter-repo exige trabajar sobre un clon limpio
git clone https://github.com/arcavcwb/center-gas.git center-gas-purga
cd center-gas-purga

# 3. Escribe los secretos a reemplazar en un fichero FUERA del repositorio.
#    Formato: un literal por línea; se puede usar "literal==>REEMPLAZO".
#    ⚠️ Este fichero contiene las claves antiguas: bórralo al terminar.
#    Ejemplo de contenido (con los valores REALES antiguos, no estos):
#      eyJ...service_role_antigua...==>***REMOVED***
#      plane_api_...antigua...==>***REMOVED***
#      la-contrasena-antigua-de-postgres==>***REMOVED***
$EDITOR ~/secretos-a-purgar.txt

# 4. Reescribir TODO el historial reemplazando esos literales
git filter-repo --replace-text ~/secretos-a-purgar.txt

# 5. Comprobar que ya no aparecen en ningún commit
git log -p --all | grep -c "plane_api_"   # debe devolver 0

# 6. Empujar la reescritura (DESTRUCTIVO E IRREVERSIBLE en remoto)
git remote add origin https://github.com/arcavcwb/center-gas.git
git push origin --force --all
git push origin --force --tags

# 7. Limpiar
shred -u ~/secretos-a-purgar.txt   # o: rm ~/secretos-a-purgar.txt
```

**Después del force-push:** todo el mundo (tú incluido) debe borrar su copia local y clonar de nuevo. Un `git pull` sobre un clon viejo reintroduce los commits antiguos.

**Y aun así:** pide a GitHub Support que purgue la caché de los commits antiguos y de los forks (`https://support.github.com/`); mientras no lo hagan, los commits viejos siguen siendo accesibles por su hash a través de la web de GitHub.

---

## (e) ✅ Resuelto: los dos `project-ref` son de proyectos distintos, y uno no es de Center Gas

En `docs/VERCEL_DEPLOYMENT_GUIDE.md` (estado publicado) convivían dos `project-ref` diferentes:

- El del resto del documento, en `PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` y dentro del payload de las dos JWT: **`fsfaqzayoziaeaihycos`** — el mismo que aparece en `.agents/mcp_config.json`.
- El de la cadena de conexión `SUPABASE_DB_URL` (línea 47): **`bnvxyryrwqessjdewjjr`**.

*(Un `project-ref` es un identificador público, visible en la URL del proyecto; no es un secreto. Lo que sí era secreto es la contraseña que lo acompañaba.)*

> **Resolución (2026-09-10, confirmada por el responsable del proyecto):**
> **`fsfaqzayoziaeaihycos` es Center Gas. `bnvxyryrwqessjdewjjr` es Cápsula, un proyecto
> distinto.** Fue la posibilidad 3 de las que se barajaban: un **copy-paste erróneo** — la
> cadena de conexión de Cápsula acabó pegada dentro de la guía de despliegue de Center Gas.

El historial de git lo corrobora: `fsfaqzayoziaeaihycos` aparece en 8 commits desde el MVP
inicial (`9324d53`), mientras que `bnvxyryrwqessjdewjjr` aparece en **un solo commit**
(`c978db8`, 2026-09-07) y **únicamente** dentro de la línea `SUPABASE_DB_URL` de esa guía.

### Qué implica, que no es lo que parecía

**1. La contraseña filtrada del punto #3 es la de Cápsula, no la de Center Gas.**
Se publicó en un repositorio público que no es el suyo. Sigue habiendo que rotarla, pero en
el dashboard de **Cápsula**, y quien opere ese proyecto tiene que enterarse: la fuga cruza la
frontera entre dos productos y no se ve desde el lado de Cápsula.
**Ventana de exposición de esa contraseña:** desde `c978db8` (2026-09-07) hasta que se sacó del
repositorio en el PR #67, más lo que siga viva en el historial público.

**2. NO borres `bnvxyryrwqessjdewjjr`.** La versión anterior de este documento contemplaba
que fuese un proyecto abandonado y recomendaba eliminarlo. Es lo contrario: es un proyecto
vivo de otro producto. Borrarlo sería destruir Cápsula.

**3. La guía de Vercel apuntaba a la base de datos equivocada.** Cualquiera que siguiese
`docs/VERCEL_DEPLOYMENT_GUIDE.md` al pie de la letra configuraba `SUPABASE_DB_URL` contra
Cápsula. Queda por comprobar en el dashboard de Vercel de `center-gas-web` y `center-gas-site`
si esa variable llegó a definirse con el valor erróneo — y, si es así, corregirla al ref de
Center Gas. *(La guía ya no contiene ningún ref: usa marcadores de posición.)*

**4. Center Gas tiene su propia contraseña de Postgres que rotar igualmente.** Nunca estuvo
en el repositorio, pero conviene rotarla en el mismo paso: la `service_role` de ese mismo
proyecto sí se filtró.

---

## (f) Que no vuelva a pasar

1. **Credentials nativas de n8n.** Nunca escribas una clave dentro del JSON de un workflow ni en un script de despliegue. Crea la Credential en la UI de n8n (queda cifrada en su base de datos) y referénciala por nombre desde el nodo. Los JSON exportados a `workflows/n8n/` deben contener referencias, no valores.
2. **Variables de entorno en Vercel.** Todo secreto vive en `Project Settings → Environment Variables`, marcado como **Sensitive**. Nunca en un `.md`, nunca en el código. Recuerda: cualquier variable con prefijo `PUBLIC_` o `NEXT_PUBLIC_` **se publica en el navegador por diseño** — ahí solo van la URL de Supabase y la `anon` key.
3. **`.env.example` como único catálogo.** El archivo [`.env.example`](../.env.example) de la raíz lista todas las variables del proyecto, marcadas como 🔒 secretas o 🌐 públicas. Cuando añadas una variable nueva, documéntala ahí **con un valor falso**. El `.env` real está en `.gitignore`; compruébalo antes de cada commit.
4. **Escaneo automático con gitleaks.** Este mismo PR añade `.github/workflows/secret-scan.yml` (con las reglas de `.gitleaks.toml`) al pipeline de CI: es un job **bloqueante**, así que cualquier Pull Request que introduzca un patrón de credencial falla antes de poder mergearse. Instálalo también en local para que te avise antes de commitear:
   ```bash
   gitleaks protect --staged --verbose
   ```
5. **Los agentes también filtran.** Buena parte de estas claves las escribió un agente automatizado "para que funcionara". Al revisar un PR generado por un agente, busca explícitamente literales que parezcan claves (`eyJ...`, `plane_api_...`, `postgresql://...:...@`) antes de aprobarlo.
6. **Rotación periódica.** Aunque no haya incidente, rota la `service_role` de Supabase y las API keys de n8n, Plane y Evolution cada 6 meses.
