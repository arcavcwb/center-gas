# Runbook — Puesta en producción del hardening post-auditoría

**Estado:** pendiente de ejecutar
**Responsable:** _(anotar)_
**Fecha de ejecución:** _(anotar)_

Este documento cubre los pasos que **no** se pueden hacer desde el repositorio: tocan
el dashboard de Supabase, la instancia de n8n y el VPS de Evolution API.

El cambio de código ya está aplicado y verificado (ver
[la sección de verificación](#verificación-previa-opcional-pero-recomendada)). Lo que queda es desplegarlo.

---

## Por qué el orden importa

Hay una trampa. La migración revoca `generate_catalog_session` para el rol `anon`: a partir
de ese momento **sólo n8n puede acuñar sesiones de catálogo**, usando la `service_role`. Si
rotas la `service_role` y aplicas las migraciones *antes* de actualizar las credenciales en n8n,
WF-01 deja de poder crear sesiones y **los clientes dejan de recibir el enlace del catálogo**.

Sigue el orden de abajo y eso no ocurre.

Tiempo total estimado: **45–60 minutos**, casi todo en el paso 1.

---

## Paso 1 — Rotar las credenciales

> **Este paso va primero y no es negociable.** Mientras la `service_role` expuesta siga
> siendo válida, todo lo demás es secundario: quien la tenga lee, altera y borra la base
> entera saltándose el RLS. Sigue estando en el historial de git de un repositorio público
> (9 commits), y el `ref` del proyecto filtrado (`fsfaqzayoziaeaihycos`) es el que se usa hoy.

Los pasos exactos, credencial por credencial, están en
**[SECURITY-INCIDENT-2026-09.md § (b) Orden de rotación](./SECURITY-INCIDENT-2026-09.md)**.
No se duplican aquí para que haya una única fuente de verdad.

Dos avisos que se olvidan con facilidad:

- Al rotar la **`anon` key** hay que **redesplegar las dos apps**: va compilada dentro del
  bundle del navegador. Hasta el redespliegue, las apps siguen usando la key vieja.
- El valor nuevo de la `service_role` hay que actualizarlo en **cuatro sitios**: Environment
  Variables de Vercel (los dos proyectos), tu `.env` local, las *Credentials* de n8n, y los
  GitHub Secrets.

Ve anotando fecha y responsable de cada credencial en el propio runbook del incidente. Es lo
que convierte el documento en registro y evita la ambigüedad que ya causó una contradicción
entre documentos.

---

## Paso 2 — Aplicar las migraciones

Son **dos ficheros, y el orden importa**:

| # | Fichero | Qué aporta |
|---|---------|------------|
| 1 | `supabase/migrations/20260909000000_security_containment.sql` | Contención: saca el token del webhook del código y lo mueve a `system_config` |
| 2 | `supabase/migrations/20260909120000_hardening_auditoria_integral.sql` | Hardening: cierra los críticos y altos de la auditoría |

> [!WARNING]
> **No apliques sólo la segunda.** Las dos redefinen `check_customer_exists` y
> `register_b2c_customer`, así que la que se ejecute en segundo lugar es la que queda: si
> inviertes el orden, la contención pisa las versiones endurecidas y reabres los críticos.
>
> Y `notify_order_status_to_n8n` —la función que dispara el webhook de WhatsApp— **sólo** se
> redefine en la primera. Saltártela deja el token escrito a fuego dentro de la función, que
> es justamente el agujero que este paso viene a cerrar.

**No uses `supabase db push`.** El historial de migraciones del proyecto arrastra una
colisión de versión ya corregida en el repositorio (dos ficheros compartían el prefijo
`20260908010000`), y la CLI intentará reconciliar contra `supabase_migrations.schema_migrations`
con un estado que puede no coincidir con lo que hay aplicado en producción.

En su lugar: **Dashboard de Supabase → SQL Editor →** pega el contenido completo del primer
fichero y ejecútalo; después el segundo.

Las dos son **idempotentes**: si algo falla a media ejecución, puedes volver a lanzarlas
enteras sin romper nada. Los únicos `INSERT` a nivel de migración son los dos de
`system_config`, ambos con `ON CONFLICT DO NOTHING`; el resto viven dentro de cuerpos de
función y sólo corren al llamarlas.

### Comprobar que quedó aplicado

En el SQL Editor. No devuelve ningún secreto — del token sólo la longitud:

```sql
SELECT p.proname AS funcion,
       COALESCE(array_to_string(p.proconfig, ', '), '⚠ sin search_path') AS config,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_ejecuta
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN (
  'generate_catalog_session','resolve_catalog_session','check_customer_exists',
  'has_phone_possession_proof','register_b2c_customer','create_b2c_order',
  'update_order_status','increment_loyalty_points','get_vasilhame_fees',
  'calculate_vasilhame_penalty','notify_order_status_to_n8n','is_owner','is_driver')
ORDER BY 1;

SELECT key, CASE WHEN key = 'n8n_webhook_token'
         THEN CASE WHEN value #>> '{}' = 'CONFIGURAR-TOKEN-ROTADO'
              THEN '⚠ SIN CONFIGURAR' ELSE '✓ ' || length(value #>> '{}') || ' chars' END
         ELSE value #>> '{}' END AS estado
FROM system_config
WHERE key IN ('n8n_webhook_token','vasilhame_fee_gas','vasilhame_fee_water') ORDER BY 1;
```

Lo que tiene que salir: `generate_catalog_session` con `anon_ejecuta = false` —ahí está el
crítico cerrado—, todas las funciones con `search_path` fijado, y las tarifas en 170 y 20.

### Qué hace, en una línea cada cosa

| # | Cambio | Cierra |
|---|--------|--------|
| 1 | `has_phone_possession_proof()`: la prueba de posesión pasa a exigir el **token concreto** | Crítico |
| 2 | `generate_catalog_session`: `REVOKE` de `anon` — sólo n8n la puede llamar | Crítico |
| 3 | `resolve_catalog_session`: `search_path` fijo | Bajo |
| 4 | `check_customer_exists`: la PII exige el token | Crítico |
| 5 | `register_b2c_customer`: exige token y **deja de mentir** cuando no aplica el cambio | Alto |
| 6 | `orders.delivery_address`: la dirección del pedido deja de pisar la ficha del cliente | Crítico |
| 7 | `create_b2c_order`: token, variantes del 9º dígito, taxa correcta, `display_id` sin colisión | Crítico + 3 altos |
| 8 | `update_order_status`: valida transiciones y **persiste la taxa de vasilhame** | Crítico + alto |
| 9 | `increment_loyalty_points`: no se puede volver a disparar sobre el mismo pedido | Alto |
| 10 | `is_owner()` / `is_driver()`: `search_path` fijo | Bajo |

---

## Paso 3 — Configurar los valores que las migraciones dejan pendientes

### 3.a) Token del webhook Supabase → n8n

Con el token **ya rotado** en el paso 1 (`openssl rand -hex 32`), en el SQL Editor:

```sql
UPDATE system_config
SET value = to_jsonb('<TOKEN-NUEVO>'::text)
WHERE key = 'n8n_webhook_token';
```

> Mientras esta fila conserve el marcador `CONFIGURAR-TOKEN-ROTADO`, **los pedidos se crean
> con normalidad pero no sale ningún WhatsApp**, y cada omisión queda como `WARNING` en los
> logs de Postgres. Es deliberado: fallar en cerrado sin perder pedidos.

El mismo valor va en el nodo *Validate Token* de **WF-02** y en `SECURE_OUTBOUND_TOKEN` de tu `.env`.

### 3.b) Tarifas de vasilhame

Se auto-siembran en R$ 170,00 (gas) y R$ 20,00 (agua), que son los importes que la app del
motoboy tenía escritos a fuego. Si tus precios son otros:

```sql
UPDATE system_config SET value = to_jsonb(170.00::numeric) WHERE key = 'vasilhame_fee_gas';
UPDATE system_config SET value = to_jsonb(20.00::numeric)  WHERE key = 'vasilhame_fee_water';
```

Ahora la app del motoboy **lee estos mismos valores** por RPC (`get_vasilhame_fees`), así que
lo que se le muestra al entregador y lo que el servidor registra ya no pueden divergir.

---

## Paso 4 — Reimportar WF-01 en n8n

**n8n → Workflows → Import from File →** `workflows/n8n/WF-01_WhatsApp_Inbound.json`,
sobrescribiendo el existente.

El flujo nuevo valida una cabecera compartida contra `EVOLUTION_WEBHOOK_TOKEN`, filtra los
mensajes propios (`fromMe`) para cortar el bucle de eco, y respeta la señal `rate_limited`
para no responder dos veces seguidas al mismo número.

> ### ⚠️ Lo que casi siempre se olvida
>
> El nodo nuevo valida una cabecera, así que **hay que configurarla también en el lado de
> Evolution API**. En el `.env` del VPS junto al `docker-compose.yml`, define
> `EVOLUTION_WEBHOOK_TOKEN` con el mismo valor que en n8n, y configura la instancia
> `centerGas` para que envíe esa cabecera en su webhook.
>
> **Si sólo lo pones en n8n, WF-01 rechazará todos los mensajes entrantes** —falla en cerrado
> a propósito— y dejarás de recibir pedidos.

---

## Paso 5 — Redesplegar las apps

Necesario porque la `anon` key rotada va compilada en el bundle, y porque el catálogo y la
app del motoboy cambiaron para hablar el contrato nuevo de las RPC.

Ambos proyectos de Vercel: `center-gas-site` y `center-gas-web`.

---

## Paso 6 — Verificar que el negocio sigue vivo

Manda un WhatsApp real al número del negocio y recorre la cadena entera:

- [ ] Llega el enlace del catálogo
- [ ] El catálogo te reconoce por el enlace (muestra tu nombre y dirección)
- [ ] Puedes cerrar un pedido y el total incluye la **taxa de entrega de tu barrio**
- [ ] El pedido aparece en el Kanban del dueño con dirección y nombre correctos
- [ ] Asignas un motoboy y el pedido le aparece en su app
- [ ] El botón de WhatsApp del motoboy **abre una conversación real** (estaba roto)
- [ ] Al cerrar la entrega marcando «no devolvió el vazio», `orders.total_amount` **sube**
      con la taxa de vasilhame

Y una comprobación negativa, la más importante de todas — que el agujero está cerrado:

```bash
# Con la anon key NUEVA. Debe responder 404 / permission denied, no un token.
curl -s -X POST "https://<TU-REF>.supabase.co/rest/v1/rpc/generate_catalog_session" \
  -H "apikey: <ANON-KEY-NUEVA>" \
  -H "Content-Type: application/json" \
  -d '{"p_phone":"5541999999999"}'
```

Si eso devuelve un token, las migraciones no se aplicaron.

Si algo se corta por el camino, **n8n → Executions** te dice en qué nodo.

---

## Verificación previa (opcional pero recomendada)

Antes de tocar producción puedes ver las migraciones correr en limpio contra un Postgres real:

```bash
./supabase/tests/run.sh
```

Levanta un Postgres efímero en Docker, aplica las **29 migraciones** sobre una base vacía y
ejecuta **47 aserciones funcionales**. No toca ninguna base remota; sólo necesita Docker.

Es además la única forma de detectar colisiones de versión, migraciones no idempotentes y
funciones que no compilan — cosas que ningún linter de SQL ve. Conviene ejecutarlo antes de
cada despliegue de esquema.

---

## Lo que este runbook NO resuelve

- **La purga del historial de git.** Las credenciales viejas siguen en los commits antiguos y
  el repositorio es público: ya están en clones de terceros, forks y la caché de GitHub.
  Purgar el historial no borra esas copias. Por eso **rotar va antes**, y la purga es higiene
  posterior — está descrita en
  [SECURITY-INCIDENT-2026-09.md § (d)](./SECURITY-INCIDENT-2026-09.md).
- **Los 114 hallazgos medios y bajos** de la auditoría. Son una lista de triaje, no defectos
  confirmados uno a uno como los críticos y altos.
- **La ausencia de observabilidad.** Hoy no hay forma automática de enterarse de que los
  pedidos dejaron de llegar por WhatsApp: hay que mirar n8n a mano. Es el hueco operativo más
  grande que queda abierto.
