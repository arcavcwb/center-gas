-- Migración: Búsqueda Resiliente de Teléfonos en Brasil (Tolerancia al 9° Dígito Móvil) (ISSUE-812)

-- 1. Función Helper: genera variantes canónicas (+55 DDD con y sin 9° dígito)
CREATE OR REPLACE FUNCTION get_phone_variants(p_phone VARCHAR)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_digits TEXT;
    v_alt_phone TEXT := NULL;
BEGIN
    IF p_phone IS NULL OR trim(p_phone) = '' THEN
        RETURN ARRAY[]::TEXT[];
    END IF;

    -- Extraer solo dígitos numéricos
    v_digits := regexp_replace(p_phone, '\D', '', 'g');

    -- Prepend '55' si viene con 10 u 11 dígitos (DDD + 8 o 9 dígitos locales)
    IF length(v_digits) IN (10, 11) THEN
        v_digits := '55' || v_digits;
    END IF;

    -- Si es de Brasil (empieza con 55) y tiene 12 dígitos (55 + DDD 2 dígitos + 8 dígitos locales):
    -- La variante con 9° dígito inserta '9' después del DDD (posición 5)
    IF length(v_digits) = 12 AND v_digits LIKE '55%' THEN
        v_alt_phone := substr(v_digits, 1, 4) || '9' || substr(v_digits, 5);
        RETURN ARRAY[v_digits, v_alt_phone];
    -- Si tiene 13 dígitos y el 5° dígito es '9' (55 + DDD 2 dígitos + 9 + 8 dígitos locales):
    -- La variante sin 9° dígito remueve el '9'
    ELSIF length(v_digits) = 13 AND v_digits LIKE '55%' AND substr(v_digits, 5, 1) = '9' THEN
        v_alt_phone := substr(v_digits, 1, 4) || substr(v_digits, 6);
        RETURN ARRAY[v_digits, v_alt_phone];
    END IF;

    RETURN ARRAY[v_digits];
END;
$$;

-- 2. Actualizar generate_catalog_session para asociar clientes y sesiones previas con tolerancia al 9° dígito
CREATE OR REPLACE FUNCTION generate_catalog_session(
    p_phone VARCHAR,
    p_rate_limit_minutes INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

    -- 1. Buscar la última sesión generada para este teléfono o sus variantes
    SELECT token, created_at, expires_at 
    INTO v_last_token, v_last_session_at, v_last_expires_at
    FROM catalog_sessions
    WHERE phone_context = ANY(v_variants)
    ORDER BY created_at DESC
    LIMIT 1;

    -- 2. Si la sesión fue creada dentro de la ventana de rate limit y sigue vigente:
    IF FOUND AND v_last_session_at >= NOW() - (p_rate_limit_minutes || ' minutes')::INTERVAL THEN
        IF v_last_expires_at > NOW() THEN
            RETURN jsonb_build_object('token', v_last_token, 'rate_limited', false, 'reused', true);
        END IF;
    END IF;

    -- 3. Generación de nuevo token compacto Base62 (6 caracteres)
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

    -- 4. Asociar cliente si existe previamente por cualquiera de las variantes
    SELECT id INTO v_customer_id FROM customers WHERE phone = ANY(v_variants) LIMIT 1;

    -- 5. Insertar nueva sesión (vigencia de 24 horas)
    INSERT INTO catalog_sessions (token, customer_id, phone_context, expires_at, created_at)
    VALUES (
        v_token,
        v_customer_id,
        p_phone,
        NOW() + INTERVAL '24 hours',
        NOW()
    );

    RETURN jsonb_build_object('token', v_token, 'rate_limited', false, 'reused', false);
END;
$$;

-- 3. Actualizar resolve_catalog_session para resolver cliente por variantes si customer_id es nulo
CREATE OR REPLACE FUNCTION resolve_catalog_session(p_token VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_customer RECORD;
    v_variants TEXT[];
BEGIN
    -- Buscar sesión válida
    SELECT * INTO v_session FROM catalog_sessions 
    WHERE token = p_token AND expires_at > NOW() LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Enlace expirado o inválido');
    END IF;
    
    -- Marcar primer uso si está nulo
    IF v_session.used_at IS NULL THEN
        UPDATE catalog_sessions SET used_at = NOW() WHERE id = v_session.id;
    END IF;
    
    -- Si el customer_id está nulo, volvemos a buscar por si el cliente ya existía bajo cualquier variante
    IF v_session.customer_id IS NULL THEN
        v_variants := get_phone_variants(v_session.phone_context);
        SELECT * INTO v_customer FROM customers WHERE phone = ANY(v_variants) LIMIT 1;
        IF FOUND THEN
            -- Actualizar la sesión para futuras llamadas
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

-- 4. Actualizar check_customer_exists para verificar cliente por variantes canónicas
CREATE OR REPLACE FUNCTION check_customer_exists(p_phone VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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
    
    IF FOUND THEN
        RETURN jsonb_build_object(
            'exists', true,
            'phone', v_customer.phone,
            'name', v_customer.name,
            'address_line', v_customer.address_line,
            'neighborhood_id', v_customer.neighborhood_id
        );
    ELSE
        RETURN jsonb_build_object('exists', false);
    END IF;
END;
$$;

-- 5. Actualizar register_b2c_customer para prevenir duplicados ante variantes de 9° dígito
CREATE OR REPLACE FUNCTION register_b2c_customer(
    p_phone VARCHAR,
    p_name VARCHAR,
    p_neighborhood_id UUID,
    p_address_line VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_customer_id UUID;
    v_variants TEXT[];
    v_existing_id UUID;
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

    IF v_existing_id IS NOT NULL THEN
        UPDATE customers
        SET name = p_name,
            neighborhood_id = p_neighborhood_id,
            address_line = p_address_line
        WHERE id = v_existing_id
        RETURNING id INTO v_customer_id;
    ELSE
        INSERT INTO customers (phone, name, neighborhood_id, address_line)
        VALUES (p_phone, p_name, p_neighborhood_id, p_address_line)
        ON CONFLICT (phone) DO UPDATE 
        SET name = EXCLUDED.name,
            neighborhood_id = EXCLUDED.neighborhood_id,
            address_line = EXCLUDED.address_line
        RETURNING id INTO v_customer_id;
    END IF;

    RETURN v_customer_id;
END;
$$;
