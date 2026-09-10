-- ==============================================================================
-- MIGRACIÓN DE CONTENCIÓN DE SEGURIDAD (ISSUE-816)
-- ==============================================================================
-- Contexto: el repositorio es público y durante meses expuso en texto plano el
-- token del webhook de n8n. Además, una auditoría del esquema encontró seis
-- agujeros explotables únicamente con la clave anónima (pública por diseño).
--
-- Esta migración cierra, en este orden:
--   1. La sobrecarga huérfana y sin blindaje de update_order_status(4 args).
--   2. La ejecución anónima de RPCs que exponen o mutan datos personales.
--   3. La ausencia total de RLS en notifications_log.
--   4. El UPDATE directo e irrestricto de los motoboys sobre orders.
--   5. La ausencia total de índices (27 migraciones, cero CREATE INDEX).
--   6. El token del webhook hardcodeado dentro del cuerpo de la función.
--
-- La migración es IDEMPOTENTE: puede re-aplicarse sin fallar.
-- ==============================================================================


-- ==============================================================================
-- 1. DROP de la sobrecarga huérfana de update_order_status
-- ==============================================================================
-- Existían DOS funciones vivas con el mismo nombre:
--   * update_order_status(UUID, order_status, TEXT, UUID, BOOLEAN)  -> blindada
--     (20260908020000_security_hardening_rpcs.sql): exige auth.uid(), valida rol
--     de dueño o chofer asignado, restringe las transiciones y fija search_path.
--   * update_order_status(UUID, order_status, TEXT, UUID)           -> SIN blindar
--     (20260829164600_update_order_status.sql): es SECURITY DEFINER, no comprueba
--     auth.uid(), no valida rol ni transiciones y nunca se le hizo DROP.
--
-- PostgREST resuelve las sobrecargas por coincidencia exacta de NOMBRES de
-- parámetro, así que un POST anónimo con exactamente esos 4 campos caía en la
-- versión sin blindar y podía mover cualquier pedido a cualquier estado.
--
-- Verificado que ningún cliente depende de la versión vieja:
--   apps/web/src/components/KanbanBoard.tsx  -> {p_order_id, p_new_status, p_driver_id}
--                                            -> {p_order_id, p_new_status, p_reason}
--   apps/site/src/components/DriverApp.tsx   -> {p_order_id, p_new_status}
--                                            -> {p_order_id, p_new_status, p_cylinder_returned}
-- Todas esas llamadas resuelven contra la versión de 5 parámetros usando los
-- valores por defecto, así que al borrar la sobrecarga vieja además desaparece
-- la ambigüedad que PostgREST tenía que arbitrar.
DROP FUNCTION IF EXISTS public.update_order_status(UUID, public.order_status, TEXT, UUID);


-- ==============================================================================
-- 2. Cierre de la ejecución anónima sobre RPCs con datos personales
-- ==============================================================================
-- DECISIÓN DE PRODUCTO (leer antes de tocar nada):
-- El camino legítimo del catálogo es el enlace de WhatsApp. El cliente escribe
-- al número, n8n llama a generate_catalog_session y le devuelve un enlace con un
-- token opaco; el catálogo lo canjea con resolve_catalog_session y cierra el
-- pedido con create_b2c_order. Esas TRES funciones DEBEN seguir siendo
-- invocables por anon: son el producto. Aquí no se tocan.
--
-- PENDIENTE (no se resuelve en esta migración): create_b2c_order todavía acepta
-- un teléfono arbitrario sin exigir el token de sesión, de modo que un anónimo
-- puede crear pedidos a nombre de terceros y sobrescribir su address_line.
-- Blindarla obliga a añadir un parámetro p_session_token y a cambiar la llamada
-- del frontend (apps/site/src/components/Catalog.tsx), es decir un cambio de
-- contrato que excede una migración de contención. Queda como issue de
-- seguimiento inmediato.

-- ------------------------------------------------------------------------------
-- 2.a) check_customer_exists: se blinda en vez de revocarse
-- ------------------------------------------------------------------------------
-- Devolvía name, address_line y neighborhood_id de CUALQUIER teléfono sin ninguna
-- prueba de posesión del número. Con la clave anónima (que viaja en el bundle del
-- navegador) cualquiera podía barrer el rango de móviles de Curitiba y quedarse
-- con el nombre y la dirección de toda la cartera.
--
-- Revocarla a secas cerraba la fuga pero rompía el producto: el catálogo la usa
-- para reconocer al cliente que vuelve, en Catalog.tsx:269 (teléfono recordado en
-- localStorage) y Catalog.tsx:346 (el cliente escribe su número). Ambas habrían
-- empezado a recibir 403.
--
-- Se aplica el mismo criterio que en register_b2c_customer: no se cierra la
-- función, se cierra el dato. La firma y el permiso a anon se conservan intactos.
--   * Con prueba de posesión (catalog_session vigente para alguna variante del
--     teléfono, es decir el enlace llegó por WhatsApp al número real) o si quien
--     llama es el dueño autenticado -> respuesta completa, UX idéntica a hoy.
--   * Sin prueba -> se responde únicamente { exists, phone }. El catálogo sigue
--     sabiendo si debe ofrecer el alta, pero ya no entrega PII a un desconocido.
--
-- Un atacante que barra números sólo aprende si un teléfono es cliente; deja de
-- poder construir un padrón de domicilios del barrio, que era el daño real.
CREATE OR REPLACE FUNCTION check_customer_exists(p_phone VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_customer RECORD;
    v_variants TEXT[];
    v_has_session BOOLEAN := false;
BEGIN
    v_variants := get_phone_variants(p_phone);

    SELECT * INTO v_customer
    FROM customers
    WHERE phone = ANY(v_variants)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exists', false);
    END IF;

    -- Prueba de posesión del teléfono: misma comprobación que register_b2c_customer.
    SELECT EXISTS (
        SELECT 1
        FROM catalog_sessions cs
        WHERE cs.expires_at > NOW()
          AND get_phone_variants(cs.phone_context) && v_variants
    ) INTO v_has_session;

    IF v_has_session OR public.is_owner() THEN
        RETURN jsonb_build_object(
            'exists', true,
            'phone', v_customer.phone,
            'name', v_customer.name,
            'address_line', v_customer.address_line,
            'neighborhood_id', v_customer.neighborhood_id
        );
    END IF;

    -- Sin prueba de posesión: se confirma la existencia y nada más.
    -- El frontend debe encaminar este caso al paso de alta (ver Catalog.tsx).
    RETURN jsonb_build_object(
        'exists', true,
        'phone', v_customer.phone
    );
END;
$$;

-- El permiso a anon se conserva a propósito: la protección vive dentro de la
-- función, no en el GRANT. Se garantiza también para el panel y para n8n.
DO $$
BEGIN
    IF to_regprocedure('public.check_customer_exists(character varying)') IS NOT NULL THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.check_customer_exists(character varying) TO anon, authenticated, service_role';
    ELSE
        RAISE WARNING 'Center Gas: no se encontró public.check_customer_exists(varchar); se omite el GRANT.';
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2.b) register_b2c_customer: se blinda en vez de revocarse
-- ------------------------------------------------------------------------------
-- El problema real de esta función NO es que anon la ejecute, sino su rama de
-- UPDATE: si el teléfono ya pertenece a un cliente, sobrescribe su name,
-- neighborhood_id y address_line sin exigir ninguna prueba de posesión del
-- número. Cualquiera podía pisar el nombre y la dirección de un cliente ajeno.
--
-- Revocarla a secas rompería el producto: el paso 'register' del catálogo se
-- alcanza también desde el camino legítimo de WhatsApp (resolve_catalog_session
-- devuelve exists=false para un cliente nuevo y el frontend llama a esta RPC).
-- Sin ella NINGÚN cliente nuevo podría comprar. Por eso se conserva el permiso a
-- anon y se cierra únicamente la rama peligrosa:
--   * Cliente inexistente  -> INSERT permitido siempre (primera compra).
--   * Cliente existente    -> sólo se actualiza si hay prueba de posesión, es
--                             decir una catalog_session vigente para ese teléfono
--                             (el enlace llegó por WhatsApp al número real), o si
--                             quien llama es el dueño autenticado.
--   * Sin prueba           -> se devuelve el id existente SIN tocar los datos y se
--                             deja un WARNING en el log. El flujo del catálogo no
--                             se rompe: el usuario sigue al paso de compra y
--                             create_b2c_order ya persiste la dirección del pedido.
CREATE OR REPLACE FUNCTION register_b2c_customer(
    p_phone VARCHAR,
    p_name VARCHAR,
    p_neighborhood_id UUID,
    p_address_line VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_customer_id UUID;
    v_variants TEXT[];
    v_existing_id UUID;
    v_has_session BOOLEAN := false;
BEGIN
    -- Validar que el barrio existe y está activo
    SELECT is_active INTO v_is_active FROM neighborhoods WHERE id = p_neighborhood_id;

    IF v_is_active IS NULL THEN
        RAISE EXCEPTION 'El barrio seleccionado no existe.';
    END IF;

    IF NOT v_is_active THEN
        RAISE EXCEPTION 'Lo sentimos, aún no tenemos cobertura en tu barrio.';
    END IF;

    -- Comprobar si el cliente ya existe bajo cualquiera de las variantes de teléfono
    v_variants := get_phone_variants(p_phone);
    SELECT id INTO v_existing_id FROM customers WHERE phone = ANY(v_variants) LIMIT 1;

    -- Caso 1: cliente nuevo. Alta directa, es la primera compra.
    IF v_existing_id IS NULL THEN
        INSERT INTO customers (phone, name, neighborhood_id, address_line)
        VALUES (p_phone, p_name, p_neighborhood_id, p_address_line)
        ON CONFLICT (phone) DO NOTHING
        RETURNING id INTO v_customer_id;

        IF v_customer_id IS NOT NULL THEN
            RETURN v_customer_id;
        END IF;

        -- Carrera o teléfono guardado con otro formato: el registro ya existía.
        -- Se cae al camino de cliente existente, que exige prueba de posesión.
        SELECT id INTO v_existing_id FROM customers WHERE phone = p_phone LIMIT 1;

        IF v_existing_id IS NULL THEN
            RAISE EXCEPTION 'No fue posible registrar el cliente. Intente nuevamente.';
        END IF;
    END IF;

    -- Caso 2: cliente existente. Sólo se sobrescriben sus datos con prueba de
    -- posesión del teléfono (sesión de catálogo vigente generada vía WhatsApp).
    SELECT EXISTS (
        SELECT 1
        FROM catalog_sessions cs
        WHERE cs.expires_at > NOW()
          AND get_phone_variants(cs.phone_context) && v_variants
    ) INTO v_has_session;

    IF v_has_session OR public.is_owner() THEN
        UPDATE customers
        SET name = p_name,
            neighborhood_id = p_neighborhood_id,
            address_line = p_address_line
        WHERE id = v_existing_id
        RETURNING id INTO v_customer_id;

        RETURN v_customer_id;
    END IF;

    RAISE WARNING 'Center Gas: se ignoró la actualización de datos del cliente % porque no hay sesión de catálogo vigente que pruebe la posesión del teléfono.', v_existing_id;
    RETURN v_existing_id;
END;
$$;

-- Los permisos de register_b2c_customer se mantienen abiertos a anon a propósito
-- (ver el bloque anterior); se garantizan además para el panel y para n8n.
DO $$
BEGIN
    IF to_regprocedure('public.register_b2c_customer(character varying, character varying, uuid, character varying)') IS NOT NULL THEN
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.register_b2c_customer(character varying, character varying, uuid, character varying) TO anon, authenticated, service_role';
    ELSE
        RAISE WARNING 'Center Gas: no se encontró public.register_b2c_customer(...); se omite el GRANT.';
    END IF;
END;
$$;


-- ==============================================================================
-- 3. RLS en notifications_log
-- ==============================================================================
-- La tabla se crea en 20260803015907_notifications_log_and_webhooks.sql y nunca
-- se le activó RLS. Como Supabase concede por defecto los privilegios de tabla a
-- anon, cualquiera con la clave pública podía leerla, insertarla y BORRARLA: era
-- el registro de idempotencia de las notificaciones de WhatsApp, así que
-- vaciarlo permitía provocar reenvíos masivos al cliente (riesgo de baneo del
-- número) además de exponer qué pedidos existen.
--
-- Quién escribe realmente en esta tabla: NINGÚN trigger ni función SQL del
-- esquema la toca (verificado con grep sobre supabase/). El único escritor es el
-- flujo n8n WF-02_WhatsApp_Outbound, nodo "Idempotency Insert", que llega por
-- PostgREST con la service_role key. service_role ignora RLS por diseño, de modo
-- que activar RLS aquí no rompe la idempotencia de las notificaciones.
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

-- Se retiran además los privilegios de tabla de anon: sin ellos ni siquiera hace
-- falta apoyarse sólo en RLS para bloquear el acceso anónimo.
REVOKE ALL ON TABLE public.notifications_log FROM anon;

-- Única política: sólo el dueño autenticado puede leer el log. No se crea
-- ninguna política para anon, así que RLS lo deniega todo por defecto.
DROP POLICY IF EXISTS "Solo el dueño lee el log de notificaciones" ON notifications_log;
CREATE POLICY "Solo el dueño lee el log de notificaciones" ON notifications_log
FOR SELECT TO authenticated USING (public.is_owner());


-- ==============================================================================
-- 4. Se elimina el UPDATE directo de los motoboys sobre orders
-- ==============================================================================
-- La política "Drivers actualizan sus propias ordenes"
-- (20260801122510_rls_policies.sql:61-62) era FOR UPDATE TO authenticated
-- USING (driver_id = auth.uid()), sin WITH CHECK y sin restricción de columnas.
-- Un chofer autenticado podía por tanto escribir total_amount = 0, cambiar
-- discount_applied o saltarse las transiciones de estado validadas por la RPC.
--
-- PostgreSQL no permite restringir columnas dentro de una política, así que la
-- solución correcta es quitar el UPDATE directo y obligar a operar por la RPC.
--
-- VERIFICADO antes de borrarla: no existe ningún .from('orders').update(...) del
-- lado del motoboy ni del panel. apps/site/src/components/DriverApp.tsx sólo hace
-- .from('orders').select(...) (línea 181) y cambia el estado con
-- rpc('update_order_status') (líneas 270 y 295); apps/web sólo hace select e
-- insert sobre orders. La RPC blindada es SECURITY DEFINER (corre como dueño de
-- la función, que ignora RLS) y ya valida que quien llama sea el chofer asignado
-- o el dueño, de modo que los motoboys conservan toda su operación.
-- Los choferes mantienen intacta su política de SELECT sobre sus propios pedidos.
DROP POLICY IF EXISTS "Drivers actualizan sus propias ordenes" ON orders;


-- ==============================================================================
-- 5. Índices
-- ==============================================================================
-- Verificado: en las 27 migraciones anteriores no hay un solo CREATE INDEX. Sólo
-- existían los índices implícitos de las PRIMARY KEY y de los UNIQUE. Todas las
-- consultas del Kanban, de la app del motoboy y del rate limit del catálogo
-- resolvían con Seq Scan.

-- Kanban del dueño: filtra por status y ordena por created_at.
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (status, created_at DESC);

-- App del motoboy: filtra por driver_id (y la política RLS de SELECT también).
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders (driver_id);

-- Historial del cliente y métricas de fidelidad: join por customer_id.
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);

-- Detalle del pedido: se lee siempre por order_id.
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- Auditoría de estados: se lee por order_id y lo usan las políticas RLS.
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history (order_id);

-- notifications_log(order_id): NO se crea. La tabla ya declara
-- UNIQUE(order_id, notification_type), cuyo índice tiene order_id como columna
-- principal y por tanto sirve para cualquier búsqueda por order_id. Un índice
-- adicional sólo añadiría coste de escritura sin ganancia de lectura.

-- catalog_sessions: generate_catalog_session y check_rate_limit filtran por
-- phone_context y ordenan por created_at DESC para aplicar el rate limit.
CREATE INDEX IF NOT EXISTS idx_catalog_sessions_phone_context_created_at
    ON catalog_sessions (phone_context, created_at DESC);

-- catalog_sessions: resolve_catalog_session y la prueba de posesión del punto 2.b
-- filtran por expires_at. (token ya tiene índice por ser UNIQUE.)
CREATE INDEX IF NOT EXISTS idx_catalog_sessions_expires_at ON catalog_sessions (expires_at);

-- customers: el join con neighborhoods y el cálculo de la taxa de entrega usan
-- neighborhood_id, que es una FK sin índice. (phone ya tiene índice por UNIQUE,
-- que es además el que aprovecha la búsqueda por variantes del 9º dígito.)
CREATE INDEX IF NOT EXISTS idx_customers_neighborhood_id ON customers (neighborhood_id);

-- customers: get_loyalty_metrics cuenta clientes por loyalty_points.
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_points ON customers (loyalty_points);


-- ==============================================================================
-- 6. El token del webhook sale del código y pasa a system_config
-- ==============================================================================
-- notify_order_status_to_n8n llevaba el bearer literal dentro del cuerpo SQL, y
-- ese cuerpo está commiteado en un repositorio público desde
-- 20260829000000_mvp_water_seed_and_webhook.sql. Cualquiera podía firmar
-- peticiones contra el webhook de n8n y disparar mensajes de WhatsApp en nombre
-- del negocio.
--
-- Fila de configuración con un valor deliberadamente inválido. El dueño DEBE
-- ejecutar, con el token YA ROTADO (el viejo se considera quemado para siempre):
--
--   UPDATE system_config
--   SET value = to_jsonb('<TOKEN-NUEVO-ROTADO>'::text)
--   WHERE key = 'n8n_webhook_token';
--
-- Hasta que eso ocurra las notificaciones de WhatsApp NO se envían: los pedidos
-- se siguen creando con normalidad y cada omisión queda como WARNING en el log
-- de Postgres.
INSERT INTO system_config (key, value)
VALUES ('n8n_webhook_token', to_jsonb('CONFIGURAR-TOKEN-ROTADO'::text))
ON CONFLICT (key) DO NOTHING;

-- La URL del webhook no es un secreto, pero se externaliza para no tener que
-- migrar la base cada vez que cambie el host de n8n. El valor por defecto es el
-- que ya estaba en producción.
INSERT INTO system_config (key, value)
VALUES ('n8n_webhook_url', to_jsonb('https://n8n.arcav.us/webhook/supabase-outbound-orders'::text))
ON CONFLICT (key) DO NOTHING;

-- Redefinición de la función del trigger.
-- Cambios respecto de la versión de 20260829210300:
--   * El token y la URL se leen de system_config; ya no hay literales.
--   * Pasa a SECURITY DEFINER con search_path fijo. Hace falta por dos motivos:
--     system_config tiene RLS con una política que lo deniega todo, y la lectura
--     de customers/profiles fallaba silenciosamente cuando el trigger corría bajo
--     un usuario autenticado no dueño (la política de customers exige is_owner()),
--     lo que dejaba customer_phone en NULL en el payload enviado a n8n.
--   * El envío HTTP va dentro de un bloque con EXCEPTION: si pg_net falla, se
--     registra un WARNING pero JAMÁS se aborta la transacción. Un pedido nunca
--     debe perderse porque la notificación no salga.
CREATE OR REPLACE FUNCTION notify_order_status_to_n8n()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_placeholder CONSTANT TEXT := 'CONFIGURAR-TOKEN-ROTADO';
    v_default_url CONSTANT TEXT := 'https://n8n.arcav.us/webhook/supabase-outbound-orders';
    customer_phone_var TEXT;
    motoboy_name_var TEXT;
    v_token TEXT;
    v_url TEXT;
    payload JSONB;
BEGIN
    -- Sólo notificar en alta o en cambio real de estado
    IF NOT ((TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status)) THEN
        RETURN NEW;
    END IF;

    -- Leer credencial y destino desde la configuración del sistema
    SELECT value #>> '{}' INTO v_token FROM system_config WHERE key = 'n8n_webhook_token';
    SELECT value #>> '{}' INTO v_url   FROM system_config WHERE key = 'n8n_webhook_url';
    v_url := COALESCE(NULLIF(btrim(v_url), ''), v_default_url);

    -- Si el token no está configurado (o sigue siendo el placeholder), se omite
    -- el envío y se avisa, pero la transacción del pedido continúa.
    IF v_token IS NULL OR btrim(v_token) = '' OR v_token = v_placeholder THEN
        RAISE WARNING 'Center Gas: notificación a n8n OMITIDA para el pedido % porque system_config.n8n_webhook_token no está configurado con el token rotado. El pedido se guardó correctamente.', NEW.display_id;
        RETURN NEW;
    END IF;

    -- Obtener teléfono del cliente
    SELECT phone INTO customer_phone_var FROM customers WHERE id = NEW.customer_id;

    -- Cumplimiento del contrato Zod: nombre del conductor (si existe)
    IF NEW.driver_id IS NOT NULL THEN
        SELECT full_name INTO motoboy_name_var FROM profiles WHERE id = NEW.driver_id;
    ELSE
        motoboy_name_var := NULL;
    END IF;

    payload := jsonb_build_object(
        'id', NEW.id,
        'display_id', NEW.display_id,
        'status', NEW.status,
        'customer_phone', customer_phone_var,
        'driver_id', NEW.driver_id,
        'driver_name', motoboy_name_var,
        'total_amount', NEW.total_amount
    );

    -- El envío nunca puede tumbar la creación del pedido
    BEGIN
        PERFORM net.http_post(
            url := v_url,
            body := payload,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_token
            )
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Center Gas: fallo al encolar la notificación a n8n para el pedido % (%). El pedido se guardó correctamente.', NEW.display_id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

-- El trigger ya existe desde 20260802000000_n8n_webhooks.sql y apunta a esta
-- misma función por nombre, así que no hace falta recrearlo.
