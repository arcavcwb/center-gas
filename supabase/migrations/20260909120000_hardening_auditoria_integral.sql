-- ==============================================================================
-- HARDENING POST-AUDITORÍA INTEGRAL
-- ==============================================================================
-- Auditoría multi-agente del monorepo (42 agentes, 12 dimensiones, verificación
-- adversarial de cada hallazgo). Esta migración cierra los defectos de base de
-- datos confirmados: 4 críticos y 6 altos.
--
-- La contención anterior (20260909000000_security_containment.sql) definió una
-- "prueba de posesión del teléfono" como «existe una catalog_session vigente para
-- este número». Esa prueba es FORJABLE: generate_catalog_session es SECURITY
-- DEFINER, nunca recibió un REVOKE y por tanto conserva el EXECUTE a PUBLIC que
-- Postgres concede por defecto, de modo que PostgREST la expone al rol anon.
-- Cualquiera con la clave anónima (que viaja en el bundle del navegador) podía
-- acuñarse la prueba para el teléfono que quisiera y extraer el padrón completo
-- de clientes. Cinco de las doce dimensiones auditadas llegaron a este mismo
-- punto de forma independiente.
--
-- Corrección de fondo: la prueba de posesión pasa a ser EL TOKEN CONCRETO, que
-- sólo llega al cliente por WhatsApp al número real, y generate_catalog_session
-- deja de ser invocable por anon.
--
-- Índice de cambios:
--   1. has_phone_possession_proof(): la prueba de posesión, ahora ligada al token.
--   2. generate_catalog_session: REVOKE de anon + señal de rate limit para el anti-baneo.
--   3. resolve_catalog_session: search_path fijo.
--   4. check_customer_exists: la PII exige el token, no la mera existencia de una fila.
--   5. register_b2c_customer: ídem, y deja de mentir cuando no aplica el cambio.
--   6. orders.delivery_address: la dirección del pedido deja de pisar la ficha del cliente.
--   7. create_b2c_order: exige token para clientes existentes, busca por variantes
--      del 9º dígito, cobra la taxa del barrio correcto y genera display_id sin colisión.
--   8. update_order_status: valida transiciones y PERSISTE la taxa de vasilhame.
--   9. increment_loyalty_points: no se puede volver a disparar sobre el mismo pedido.
--  10. is_owner()/is_driver(): search_path fijo.
--
-- La migración es IDEMPOTENTE: puede re-aplicarse sin fallar.
-- ==============================================================================


-- ==============================================================================
-- 1. La prueba de posesión del teléfono, ligada al token
-- ==============================================================================
-- Antes: «existe alguna catalog_session vigente cuyo phone_context case con este
-- teléfono». Cualquiera podía crear esa fila, así que la prueba no probaba nada.
--
-- Ahora: «quien llama presenta el token concreto de una sesión vigente cuyo
-- phone_context case con este teléfono». El token es opaco, se genera con
-- gen_random_bytes y sólo se entrega por WhatsApp al número real, así que
-- presentarlo sí demuestra posesión del teléfono.
--
-- El dueño autenticado sigue teniendo acceso sin token (opera el panel).
CREATE OR REPLACE FUNCTION public.has_phone_possession_proof(
    p_phone VARCHAR,
    p_session_token VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_variants TEXT[];
    v_proof BOOLEAN := false;
BEGIN
    -- El dueño autenticado no necesita token: opera el panel.
    IF public.is_owner() THEN
        RETURN true;
    END IF;

    IF p_session_token IS NULL OR btrim(p_session_token) = '' THEN
        RETURN false;
    END IF;

    v_variants := get_phone_variants(p_phone);

    SELECT EXISTS (
        SELECT 1
        FROM catalog_sessions cs
        WHERE cs.token = p_session_token
          AND cs.expires_at > NOW()
          AND get_phone_variants(cs.phone_context) && v_variants
    ) INTO v_proof;

    RETURN v_proof;
END;
$$;

-- Sólo la llaman otras funciones SECURITY DEFINER, que corren como su dueño y
-- por tanto no dependen del permiso del llamante. Cerrarla a anon evita además
-- que sirva de oráculo para probar tokens contra teléfonos.
-- REVOKE FROM PUBLIC no basta: Supabase concede EXECUTE a anon por privilegios
-- por defecto sobre el esquema public, así que hay que revocarle a él en concreto.
REVOKE ALL ON FUNCTION public.has_phone_possession_proof(VARCHAR, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_phone_possession_proof(VARCHAR, VARCHAR) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_phone_possession_proof(VARCHAR, VARCHAR)
    TO authenticated, service_role;


-- ==============================================================================
-- 2. generate_catalog_session deja de ser invocable por anon
-- ==============================================================================
-- Es la función que acuña la prueba de posesión. Mientras anon pueda llamarla, la
-- prueba no vale nada. Verificado que ningún cliente del navegador la usa: el
-- único invocador es n8n WF-01_WhatsApp_Inbound.json (nodo "Generate Catalog
-- Token"), que ya se autentica con SUPABASE_SERVICE_ROLE_KEY. Revocarla a anon no
-- rompe ningún camino legítimo del producto.
--
-- Se redefine además para:
--   * fijar search_path (faltaba, siendo SECURITY DEFINER);
--   * señalizar el rate limit de forma explícita con `rate_limited`.
--
-- Sobre `rate_limited`: el reenvío del MISMO token dentro de la ventana es
-- deliberado (ISSUE-810, afirmado por scripts/test-e2e-whatsapp-lifecycle.js:246),
-- así que se conserva `token` y `reused` intactos. Lo que faltaba era decirle a
-- n8n que NO debe responder otra vez: dos auto-respuestas seguidas al mismo número
-- son exactamente el patrón que Meta castiga (Regla 2 del protocolo anti-baneo,
-- docs/16). WF-01 pasa a cortar cuando rate_limited es true.
CREATE OR REPLACE FUNCTION generate_catalog_session(
    p_phone VARCHAR,
    p_rate_limit_minutes INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_token VARCHAR(64);
    v_customer_id UUID;
    v_last_session_at TIMESTAMP WITH TIME ZONE;
    v_last_token VARCHAR(64);
    v_last_expires_at TIMESTAMP WITH TIME ZONE;
    v_chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    v_bytes BYTEA;
    i INT;
    v_collision_count INT := 0;
    v_variants TEXT[];
BEGIN
    v_variants := get_phone_variants(p_phone);

    -- 1. Última sesión generada para este teléfono o sus variantes
    SELECT token, created_at, expires_at
    INTO v_last_token, v_last_session_at, v_last_expires_at
    FROM catalog_sessions
    WHERE phone_context = ANY(v_variants)
    ORDER BY created_at DESC
    LIMIT 1;

    -- 2. Dentro de la ventana y con la sesión aún vigente: se devuelve el mismo
    --    enlace (ISSUE-810) pero marcado como limitado, para que n8n no responda.
    IF FOUND AND v_last_session_at >= NOW() - (p_rate_limit_minutes || ' minutes')::INTERVAL THEN
        IF v_last_expires_at > NOW() THEN
            RETURN jsonb_build_object(
                'token', v_last_token,
                'rate_limited', true,
                'reused', true
            );
        END IF;
    END IF;

    -- 3. Nuevo token compacto Base62 (6 caracteres)
    LOOP
        v_bytes := gen_random_bytes(6);
        v_token := '';
        FOR i IN 0..5 LOOP
            v_token := v_token || substr(v_chars, (get_byte(v_bytes, i) % 62) + 1, 1);
        END LOOP;

        EXIT WHEN NOT EXISTS (SELECT 1 FROM catalog_sessions WHERE token = v_token);

        v_collision_count := v_collision_count + 1;
        IF v_collision_count > 5 THEN
            RAISE EXCEPTION 'No se pudo generar un token único tras 5 intentos.';
        END IF;
    END LOOP;

    -- 4. Asociar cliente si ya existe bajo cualquiera de las variantes
    SELECT id INTO v_customer_id FROM customers WHERE phone = ANY(v_variants) LIMIT 1;

    -- 5. Insertar la sesión (vigencia de 24 horas)
    INSERT INTO catalog_sessions (token, customer_id, phone_context, expires_at, created_at)
    VALUES (v_token, v_customer_id, p_phone, NOW() + INTERVAL '24 hours', NOW());

    RETURN jsonb_build_object('token', v_token, 'rate_limited', false, 'reused', false);
END;
$$;

-- El cierre: sólo n8n (service_role) puede acuñar sesiones.
REVOKE ALL ON FUNCTION public.generate_catalog_session(VARCHAR, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_catalog_session(VARCHAR, INT) FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_catalog_session(VARCHAR, INT) TO service_role;


-- ==============================================================================
-- 3. resolve_catalog_session: search_path fijo
-- ==============================================================================
-- Sigue siendo invocable por anon a propósito: es el canje del enlace que el
-- cliente recibió por WhatsApp, es decir el producto. Quien no tenga un token
-- válido no obtiene nada. Sólo le faltaba el search_path, obligatorio en toda
-- función SECURITY DEFINER.
CREATE OR REPLACE FUNCTION resolve_catalog_session(p_token VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_session RECORD;
    v_customer RECORD;
    v_variants TEXT[];
BEGIN
    SELECT * INTO v_session FROM catalog_sessions
    WHERE token = p_token AND expires_at > NOW() LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Enlace expirado o inválido');
    END IF;

    IF v_session.used_at IS NULL THEN
        UPDATE catalog_sessions SET used_at = NOW() WHERE id = v_session.id;
    END IF;

    IF v_session.customer_id IS NULL THEN
        v_variants := get_phone_variants(v_session.phone_context);
        SELECT * INTO v_customer FROM customers WHERE phone = ANY(v_variants) LIMIT 1;
        IF FOUND THEN
            UPDATE catalog_sessions SET customer_id = v_customer.id WHERE id = v_session.id;
            v_session.customer_id := v_customer.id;
        END IF;
    ELSE
        SELECT * INTO v_customer FROM customers WHERE id = v_session.customer_id;
    END IF;

    IF v_session.customer_id IS NOT NULL AND v_customer.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'valid', true,
            'phone', v_session.phone_context,
            'exists', true,
            'name', v_customer.name,
            'address_line', v_customer.address_line,
            'neighborhood_id', v_customer.neighborhood_id
        );
    ELSE
        RETURN jsonb_build_object(
            'valid', true,
            'phone', v_session.phone_context,
            'exists', false
        );
    END IF;
END;
$$;


-- ==============================================================================
-- 4. check_customer_exists: la PII exige el token
-- ==============================================================================
-- Se DROPea la firma de 1 argumento antes de crear la de 2. Crear la nueva sin
-- borrar la vieja dejaría una SOBRECARGA HUÉRFANA invocable por anon con la
-- semántica antigua: exactamente el fallo que la contención anterior tuvo que
-- limpiar con un DROP de update_order_status(4 args).
DROP FUNCTION IF EXISTS public.check_customer_exists(VARCHAR);

CREATE OR REPLACE FUNCTION check_customer_exists(
    p_phone VARCHAR,
    p_session_token VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_customer RECORD;
    v_variants TEXT[];
BEGIN
    v_variants := get_phone_variants(p_phone);

    SELECT * INTO v_customer
    FROM customers
    WHERE phone = ANY(v_variants)
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exists', false);
    END IF;

    -- Con prueba de posesión (token de la sesión que llegó por WhatsApp al número
    -- real, o dueño autenticado) -> respuesta completa.
    IF public.has_phone_possession_proof(p_phone, p_session_token) THEN
        RETURN jsonb_build_object(
            'exists', true,
            'phone', v_customer.phone,
            'name', v_customer.name,
            'address_line', v_customer.address_line,
            'neighborhood_id', v_customer.neighborhood_id
        );
    END IF;

    -- Sin prueba: se confirma la existencia y nada más. El catálogo encamina este
    -- caso al paso de alta (ver apps/site/src/components/Catalog.tsx).
    RETURN jsonb_build_object(
        'exists', true,
        'phone', v_customer.phone
    );
END;
$$;

REVOKE ALL ON FUNCTION public.check_customer_exists(VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_customer_exists(VARCHAR, VARCHAR)
    TO anon, authenticated, service_role;


-- ==============================================================================
-- 5. register_b2c_customer: exige token y deja de mentir
-- ==============================================================================
-- Dos defectos:
--   * La rama de UPDATE se apoyaba en la prueba forjable.
--   * Cuando decidía NO aplicar el cambio devolvía igualmente el id, así que el
--     catálogo lo interpretaba como éxito y seguía al paso de compra creyendo que
--     el barrio se había guardado. Consecuencia aguas abajo: neighborhood_id nulo
--     y por tanto TAXA DE ENTREGA COBRADA A CERO.
--
-- Ahora devuelve JSONB con `applied`, para que el frontend distinga el no-op.
DROP FUNCTION IF EXISTS public.register_b2c_customer(VARCHAR, VARCHAR, UUID, VARCHAR);

CREATE OR REPLACE FUNCTION register_b2c_customer(
    p_phone VARCHAR,
    p_name VARCHAR,
    p_neighborhood_id UUID,
    p_address_line VARCHAR,
    p_session_token VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_customer_id UUID;
    v_variants TEXT[];
    v_existing_id UUID;
    v_session JSONB;
BEGIN
    SELECT is_active INTO v_is_active FROM neighborhoods WHERE id = p_neighborhood_id;

    IF v_is_active IS NULL THEN
        RAISE EXCEPTION 'El barrio seleccionado no existe.';
    END IF;

    IF NOT v_is_active THEN
        RAISE EXCEPTION 'Lo sentimos, aún no tenemos cobertura en tu barrio.';
    END IF;

    v_variants := get_phone_variants(p_phone);
    SELECT id INTO v_existing_id FROM customers WHERE phone = ANY(v_variants) LIMIT 1;

    -- Caso 1: cliente nuevo. Alta directa, es su primera compra.
    IF v_existing_id IS NULL THEN
        INSERT INTO customers (phone, name, neighborhood_id, address_line)
        VALUES (p_phone, p_name, p_neighborhood_id, p_address_line)
        ON CONFLICT (phone) DO NOTHING
        RETURNING id INTO v_customer_id;

        IF v_customer_id IS NOT NULL THEN
            -- El alta emite la sesión de ESTE cliente recién creado y devuelve su
            -- token. Sin esto, el alta orgánica (el cliente que entra al catálogo
            -- sin venir del enlace de WhatsApp) quedaba en un callejón sin salida:
            -- register lo creaba, y acto seguido create_b2c_order lo veía como
            -- "cliente existente sin prueba de posesión" y rechazaba su primera
            -- compra pidiéndole un enlace que nunca recibió.
            --
            -- No debilita nada: quien llama acaba de crear esa ficha con los datos
            -- que él mismo ha escrito, así que el token no le da acceso a ninguna
            -- PII ajena. La rama peligrosa —tomar el control de un cliente que YA
            -- existía— sigue exigiendo el token que sólo llega por WhatsApp.
            v_session := generate_catalog_session(p_phone);

            RETURN jsonb_build_object(
                'customer_id', v_customer_id,
                'applied', true,
                'created', true,
                'session_token', v_session->>'token'
            );
        END IF;

        -- Carrera, o el teléfono ya estaba guardado con otro formato.
        SELECT id INTO v_existing_id FROM customers WHERE phone = ANY(v_variants) LIMIT 1;

        IF v_existing_id IS NULL THEN
            RAISE EXCEPTION 'No fue posible registrar el cliente. Intente nuevamente.';
        END IF;
    END IF;

    -- Caso 2: cliente existente. Sus datos sólo se sobrescriben con prueba de
    -- posesión del teléfono.
    IF public.has_phone_possession_proof(p_phone, p_session_token) THEN
        UPDATE customers
        SET name = p_name,
            neighborhood_id = p_neighborhood_id,
            address_line = p_address_line
        WHERE id = v_existing_id
        RETURNING id INTO v_customer_id;

        RETURN jsonb_build_object(
            'customer_id', v_customer_id,
            'applied', true,
            'created', false
        );
    END IF;

    -- Sin prueba: NO se toca la ficha, y se dice claramente que no se aplicó.
    RAISE WARNING 'Center Gas: no se actualizaron los datos del cliente % por falta de token de sesión válido.', v_existing_id;

    RETURN jsonb_build_object(
        'customer_id', v_existing_id,
        'applied', false,
        'created', false,
        'reason', 'possession_proof_required'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.register_b2c_customer(VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_b2c_customer(VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR)
    TO anon, authenticated, service_role;


-- ==============================================================================
-- 6. La dirección del pedido deja de pisar la ficha del cliente
-- ==============================================================================
-- create_b2c_order hacía UPDATE customers SET address_line = p_address_line sin
-- ninguna prueba de posesión. Un anónimo podía redirigir la entrega de cualquier
-- cliente cuyo teléfono conociera. La dirección de UN pedido pertenece al pedido.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(255);

-- Los pedidos históricos se rellenan con la dirección que el cliente tenía, que
-- es la que efectivamente se usó para entregarlos.
UPDATE orders o
SET delivery_address = c.address_line
FROM customers c
WHERE o.customer_id = c.id
  AND o.delivery_address IS NULL;

COMMENT ON COLUMN orders.delivery_address IS
    'Dirección de entrega de ESTE pedido. Fuente de verdad para el motoboy: la ficha del cliente puede cambiar después.';


-- ==============================================================================
-- 7. create_b2c_order: token, variantes del 9º dígito, taxa correcta y display_id sin colisión
-- ==============================================================================
-- Cuatro defectos confirmados en una sola función:
--
--   a) CRÍTICO. Aceptaba cualquier teléfono sin token: pedidos a nombre de
--      terceros y sobrescritura de su dirección. La contención anterior lo dejó
--      escrito como PENDIENTE en sus líneas 56-62. Se cierra aquí.
--   b) ALTO. Era la ÚNICA RPC que comparaba el teléfono por igualdad exacta
--      mientras las otras cuatro usan get_phone_variants (ISSUE-812). Como el
--      catálogo envía el phone_context del JID de WhatsApp, creaba un cliente
--      duplicado con name y neighborhood_id nulos, y por tanto taxa de entrega
--      0,00 y "Cliente Sem Cadastro" en el Kanban.
--   c) ALTO. La taxa se derivaba de customers.neighborhood_id, que el checkout ya
--      no podía actualizar tras la contención: el cliente veía un total y se le
--      cobraba otro. Ahora el barrio viaja como parámetro y la taxa se LEE DE LA
--      BASE para ese barrio (nunca se acepta un importe del cliente).
--   d) ALTO. display_id es UNIQUE global sobre 9.000 valores pero el bucle sólo
--      comprobaba colisiones contra pedidos ACTIVOS, así que reusaba números de
--      pedidos ya entregados y el INSERT reventaba. La probabilidad de fallo
--      crecía hasta la certeza a medida que se acumula historial.
DROP FUNCTION IF EXISTS public.create_b2c_order(VARCHAR, VARCHAR, JSONB, VARCHAR, NUMERIC, BOOLEAN, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION create_b2c_order(
  p_phone VARCHAR,
  p_address_line VARCHAR,
  p_items JSONB,
  p_payment_method VARCHAR,
  p_cash_change_for NUMERIC,
  p_is_scheduled BOOLEAN DEFAULT false,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_neighborhood_id UUID DEFAULT NULL,
  p_session_token VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_customer_id UUID;
  v_neighborhood_id UUID;
  v_delivery_fee NUMERIC := 0.00;
  v_order_id UUID;
  v_display_id VARCHAR(10);
  v_subtotal_amount NUMERIC := 0;
  v_total_amount NUMERIC := 0;
  v_discount_applied NUMERIC := 0;
  v_item JSONB;
  v_product RECORD;
  v_gas_qty INT := 0;
  v_water_qty INT := 0;
  v_qty INT;
  v_variants TEXT[];
  v_attempts INT := 0;
  v_width INT := 4;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido no contiene productos.';
  END IF;

  -- 1. Localizar al cliente por CUALQUIER variante del teléfono (9º dígito).
  v_variants := get_phone_variants(p_phone);
  SELECT id, neighborhood_id INTO v_customer_id, v_neighborhood_id
  FROM customers
  WHERE phone = ANY(v_variants)
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    -- Cliente nuevo: primera compra. Se permite sin token; no hay ficha ajena
    -- que proteger todavía.
    INSERT INTO customers (phone, address_line, neighborhood_id)
    VALUES (p_phone, p_address_line, p_neighborhood_id)
    RETURNING id, neighborhood_id INTO v_customer_id, v_neighborhood_id;
  ELSE
    -- Cliente EXISTENTE: hace falta demostrar la posesión del teléfono. Sin ella
    -- no se crea el pedido: es el vector de suplantación y de entregas falsas.
    IF NOT public.has_phone_possession_proof(p_phone, p_session_token) THEN
      RAISE EXCEPTION 'Para pedir con este número hace falta abrir el enlace que enviamos por WhatsApp.'
        USING ERRCODE = '42501';
    END IF;

    -- NUNCA se sobrescribe customers.address_line: la dirección de este pedido
    -- se guarda en orders.delivery_address. La ficha del cliente sólo la cambia
    -- register_b2c_customer, que también exige la prueba de posesión.
    IF p_neighborhood_id IS NOT NULL THEN
      v_neighborhood_id := p_neighborhood_id;
    END IF;
  END IF;

  -- 2. Taxa de entrega: se lee SIEMPRE de la base para el barrio resuelto.
  --    El cliente elige el barrio; el precio de ese barrio lo pone el servidor.
  -- Nota: NO se filtra por is_active. Si un barrio se desactiva mientras un
  -- cliente antiguo pide, hay que cobrarle su taxa real, no 0,00 en silencio.
  -- La cobertura se valida al dar de alta al cliente (register_b2c_customer).
  IF v_neighborhood_id IS NOT NULL THEN
    SELECT COALESCE(delivery_fee, 0.00) INTO v_delivery_fee
    FROM neighborhoods
    WHERE id = v_neighborhood_id;

    v_delivery_fee := COALESCE(v_delivery_fee, 0.00);
  END IF;

  -- 3. Subtotal confiando exclusivamente en el precio de la base de datos.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID AND is_active = true;

    IF v_product IS NULL THEN
       RAISE EXCEPTION 'Produto não encontrado ou inativo: %', v_item->>'product_id';
    END IF;

    v_qty := (v_item->>'quantity')::INT;

    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Cantidad inválida para el producto %.', v_item->>'product_id';
    END IF;

    v_subtotal_amount := v_subtotal_amount + (v_product.price * v_qty);

    IF LOWER(v_product.sku) LIKE '%p13%' OR LOWER(v_product.sku) LIKE '%gas%' THEN
      v_gas_qty := v_gas_qty + v_qty;
    ELSIF LOWER(v_product.sku) LIKE '%water%' OR LOWER(v_product.sku) LIKE '%agua%' THEN
      v_water_qty := v_water_qty + v_qty;
    END IF;
  END LOOP;

  -- BR-001: R$ 5,00 de descuento por cada par Gas + Agua
  v_discount_applied := LEAST(v_gas_qty, v_water_qty) * 5.00;
  v_total_amount := GREATEST(0, v_subtotal_amount + v_delivery_fee - v_discount_applied);

  -- 4. display_id único contra la tabla ENTERA (la restricción es UNIQUE global).
  --    Se mantienen 4 dígitos mientras quede espacio y se ensancha al saturarse,
  --    para que el número corto y amigable dure lo máximo posible sin llegar
  --    nunca a un fallo de inserción.
  LOOP
    v_display_id := floor(random() * (9 * power(10, v_width - 1)) + power(10, v_width - 1))::BIGINT::TEXT;

    EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE display_id = v_display_id);

    v_attempts := v_attempts + 1;

    IF v_attempts % 50 = 0 THEN
      v_width := v_width + 1;
      IF v_width > 9 THEN
        RAISE EXCEPTION 'No se pudo generar un identificador de pedido único.';
      END IF;
    END IF;
  END LOOP;

  -- 5. Crear el pedido, con su propia dirección de entrega.
  INSERT INTO orders (
    display_id, customer_id, status, payment_method, cash_change_for,
    discount_applied, delivery_fee, total_amount, is_scheduled, scheduled_for,
    delivery_address
  ) VALUES (
    v_display_id, v_customer_id, 'nuevo', p_payment_method::payment_method, p_cash_change_for,
    v_discount_applied, v_delivery_fee, v_total_amount, COALESCE(p_is_scheduled, false), p_scheduled_for,
    p_address_line
  ) RETURNING id INTO v_order_id;

  -- 6. Detalle del pedido
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INT,
      v_product.price
    );
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'id', v_order_id,
    'display_id', v_display_id,
    'delivery_fee', v_delivery_fee,
    'total_amount', v_total_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_b2c_order(VARCHAR, VARCHAR, JSONB, VARCHAR, NUMERIC, BOOLEAN, TIMESTAMP WITH TIME ZONE, UUID, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_b2c_order(VARCHAR, VARCHAR, JSONB, VARCHAR, NUMERIC, BOOLEAN, TIMESTAMP WITH TIME ZONE, UUID, VARCHAR)
    TO anon, authenticated, service_role;


-- ==============================================================================
-- 8. La taxa de vasilhame se persiste, y las transiciones se validan
-- ==============================================================================
-- Defecto CRÍTICO de dinero: cuando el cliente no devolvía el casco, la app del
-- motoboy calculaba la penalidad en el navegador, la mostraba como "Novo Total a
-- Cobrar" y el entregador la cobraba en efectivo — pero la RPC sólo escribía
-- cylinder_returned = false. orders.total_amount se quedaba con el importe
-- original, así que TODOS los informes (get_drivers_performance,
-- get_customers_with_stats, "Total do Turno") subestimaban la caja en R$ 170 por
-- botijão y R$ 20 por galão, sin ninguna traza.
--
-- Defecto ALTO adjunto: no había grafo de transiciones. Se admitía saltar de
-- 'nuevo' a 'entregado' y volver a entrar en 'entregado' cuantas veces se
-- quisiera, lo que combinado con el trigger de fidelidad permitía fabricar
-- recargas gratis.
--
-- Los importes de la penalidad viven en system_config para que el dueño pueda
-- ajustarlos sin migrar, y para que la app del motoboy lea los MISMOS valores que
-- aplica el servidor (get_vasilhame_fees más abajo).
INSERT INTO system_config (key, value)
VALUES ('vasilhame_fee_gas', to_jsonb(170.00::numeric))
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_config (key, value)
VALUES ('vasilhame_fee_water', to_jsonb(20.00::numeric))
ON CONFLICT (key) DO NOTHING;

-- Lectura de las tarifas para la app del motoboy. system_config tiene RLS que lo
-- deniega todo, así que se expone únicamente ESTOS dos valores (no son secretos)
-- por una función SECURITY DEFINER, y sólo a usuarios autenticados.
CREATE OR REPLACE FUNCTION public.get_vasilhame_fees()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_gas NUMERIC;
    v_water NUMERIC;
BEGIN
    SELECT (value #>> '{}')::NUMERIC INTO v_gas   FROM system_config WHERE key = 'vasilhame_fee_gas';
    SELECT (value #>> '{}')::NUMERIC INTO v_water FROM system_config WHERE key = 'vasilhame_fee_water';

    RETURN jsonb_build_object(
        'gas', COALESCE(v_gas, 170.00),
        'water', COALESCE(v_water, 20.00)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_vasilhame_fees() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_vasilhame_fees() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_vasilhame_fees() TO authenticated, service_role;

-- Penalidad de un pedido concreto, derivada de sus propias líneas.
-- Se recalcula en el servidor: nunca se acepta un importe enviado por el cliente.
CREATE OR REPLACE FUNCTION public.calculate_vasilhame_penalty(p_order_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_fees JSONB;
    v_gas NUMERIC;
    v_water NUMERIC;
    v_total NUMERIC := 0;
    v_row RECORD;
BEGIN
    v_fees := public.get_vasilhame_fees();
    v_gas := (v_fees->>'gas')::NUMERIC;
    v_water := (v_fees->>'water')::NUMERIC;

    FOR v_row IN
        SELECT oi.quantity, p.sku, p.name, p.includes_cylinder
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = p_order_id
    LOOP
        -- Si el producto ya incluía el casco, el cliente ya pagó el vasilhame.
        CONTINUE WHEN COALESCE(v_row.includes_cylinder, false);

        IF LOWER(COALESCE(v_row.sku, v_row.name, '')) ~ '(water|agua|água)' THEN
            v_total := v_total + (v_row.quantity * v_water);
        ELSE
            v_total := v_total + (v_row.quantity * v_gas);
        END IF;
    END LOOP;

    RETURN COALESCE(v_total, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_vasilhame_penalty(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_vasilhame_penalty(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.calculate_vasilhame_penalty(UUID) TO authenticated, service_role;

-- La firma se conserva (5 argumentos, RETURNS void) para no romper a los
-- llamadores: KanbanBoard.tsx:92,103 y DriverApp.tsx:270,295.
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID,
    p_new_status order_status,
    p_reason TEXT DEFAULT NULL,
    p_driver_id UUID DEFAULT NULL,
    p_cylinder_returned BOOLEAN DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_old_status order_status;
    v_current_driver UUID;
    v_is_owner BOOLEAN;
    v_allowed order_status[];
    v_penalty NUMERIC := 0;
    v_reason TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Operação não permitida para usuários anônimos.';
    END IF;

    -- Se bloquea la fila: dos pulsaciones simultáneas del motoboy (o un doble
    -- clic en el Kanban) dejarían de aplicarse dos veces.
    SELECT status, driver_id INTO v_old_status, v_current_driver
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'Pedido não encontrado: %', p_order_id;
    END IF;

    v_is_owner := public.is_owner();

    IF NOT (v_is_owner OR (v_current_driver IS NOT NULL AND v_current_driver = auth.uid())) THEN
        RAISE EXCEPTION 'Acesso não autorizado para alterar o status deste pedido.';
    END IF;

    IF NOT v_is_owner AND p_new_status NOT IN ('en_camino', 'entregado') THEN
        RAISE EXCEPTION 'Entregadores só podem atualizar pedidos para en_camino ou entregado.';
    END IF;

    -- Grafo de transiciones. Sin él se podía saltar de 'nuevo' a 'entregado' y
    -- reentrar en 'entregado' indefinidamente, fabricando puntos de fidelidad.
    v_allowed := CASE v_old_status
        WHEN 'nuevo'      THEN ARRAY['confirmado', 'asignado', 'cancelado']::order_status[]
        WHEN 'confirmado' THEN ARRAY['asignado', 'cancelado']::order_status[]
        WHEN 'asignado'   THEN ARRAY['en_camino', 'confirmado', 'cancelado']::order_status[]
        WHEN 'en_camino'  THEN ARRAY['entregado', 'asignado', 'cancelado']::order_status[]
        WHEN 'entregado'  THEN ARRAY[]::order_status[]   -- terminal
        WHEN 'cancelado'  THEN ARRAY[]::order_status[]   -- terminal
        ELSE ARRAY[]::order_status[]
    END;

    IF NOT (p_new_status = ANY(v_allowed)) THEN
        RAISE EXCEPTION 'Transição de estado inválida: % -> %.', v_old_status, p_new_status
            USING ERRCODE = '22023';
    END IF;

    v_reason := p_reason;

    -- Cierre de la entrega: si el cliente NO devolvió el casco, la taxa de
    -- vasilhame se recalcula en el servidor y se suma al total del pedido, en la
    -- MISMA transacción. Es el importe que el motoboy cobró en efectivo.
    IF p_new_status = 'entregado' AND COALESCE(p_cylinder_returned, true) = false THEN
        v_penalty := public.calculate_vasilhame_penalty(p_order_id);

        IF v_penalty > 0 THEN
            v_reason := COALESCE(v_reason || ' | ', '')
                || 'Taxa de vasilhame aplicada: R$ ' || to_char(v_penalty, 'FM999999990.00');
        END IF;
    END IF;

    UPDATE orders
    SET
        status = p_new_status,
        driver_id = CASE WHEN v_is_owner THEN COALESCE(p_driver_id, driver_id) ELSE driver_id END,
        cylinder_returned = COALESCE(p_cylinder_returned, cylinder_returned),
        total_amount = total_amount + v_penalty
    WHERE id = p_order_id;

    INSERT INTO order_status_history (
        order_id, previous_status, new_status, changed_by, reason
    ) VALUES (
        p_order_id, v_old_status, p_new_status, auth.uid(), v_reason
    );
END;
$$;

-- Ya rechaza a los anónimos por auth.uid(), pero la defensa no debe depender de
-- una sola capa: se le retira también el permiso de ejecución.
REVOKE ALL ON FUNCTION public.update_order_status(UUID, order_status, TEXT, UUID, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_order_status(UUID, order_status, TEXT, UUID, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, order_status, TEXT, UUID, BOOLEAN)
    TO authenticated, service_role;


-- ==============================================================================
-- 9. El trigger de fidelidad no se puede volver a disparar sobre el mismo pedido
-- ==============================================================================
-- El grafo de transiciones ya impide reentrar en 'entregado', pero la defensa no
-- puede depender de una sola capa: cualquier UPDATE directo del dueño sobre
-- orders volvería a acreditar puntos. Se marca el pedido como ya premiado.
--
-- El trigger pasa de AFTER a BEFORE para poder fijar la marca en la misma fila
-- sin provocar una segunda escritura recursiva.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_awarded BOOLEAN NOT NULL DEFAULT false;

-- Los pedidos ya entregados se marcan como premiados: sus puntos ya se contaron.
UPDATE orders SET loyalty_awarded = true
WHERE status = 'entregado' AND loyalty_awarded = false;

CREATE OR REPLACE FUNCTION increment_loyalty_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_points INT;
BEGIN
    IF NEW.status = 'entregado'
       AND (OLD.status IS NULL OR OLD.status <> 'entregado')
       AND COALESCE(OLD.loyalty_awarded, false) = false
    THEN
        SELECT loyalty_points INTO current_points
        FROM customers
        WHERE id = NEW.customer_id
        FOR UPDATE;

        IF current_points IS NOT NULL THEN
            IF current_points + 1 >= 8 THEN
                UPDATE customers
                SET loyalty_points = 0,
                    available_free_cylinders = available_free_cylinders + 1
                WHERE id = NEW.customer_id;
            ELSE
                UPDATE customers
                SET loyalty_points = loyalty_points + 1
                WHERE id = NEW.customer_id;
            END IF;
        END IF;

        -- Marca idempotente: este pedido ya no vuelve a premiar.
        NEW.loyalty_awarded := true;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_loyalty_points ON orders;
CREATE TRIGGER trg_loyalty_points
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION increment_loyalty_points();


-- ==============================================================================
-- 10. search_path en is_owner() e is_driver()
-- ==============================================================================
-- Son el predicado de casi todas las políticas RLS y son SECURITY DEFINER sin
-- search_path fijo. La auditoría no logró construir un exploit reproducible, pero
-- fijarlo es gratis y elimina la clase entera de ataque.
CREATE OR REPLACE FUNCTION public.is_owner() RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_driver() RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'driver'
  );
END;
$$;


-- ==============================================================================
-- 11. Índices para los caminos nuevos
-- ==============================================================================
-- has_phone_possession_proof filtra por token + expires_at. token ya es UNIQUE,
-- así que el índice existente sirve; no se crea ninguno redundante.
-- El único camino nuevo sin índice es la búsqueda de pedidos por display_id
-- durante la generación, que ya cuenta con el índice implícito del UNIQUE.
