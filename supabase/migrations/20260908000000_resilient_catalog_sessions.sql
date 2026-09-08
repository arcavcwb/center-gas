-- Migración: Resiliencia de Inbound WhatsApp - Reenvío de token activo ante re-escritura en ventana de rate limit (ISSUE-810)

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
BEGIN
    -- 1. Buscar la última sesión generada para este teléfono
    SELECT token, created_at, expires_at 
    INTO v_last_token, v_last_session_at, v_last_expires_at
    FROM catalog_sessions
    WHERE phone_context = p_phone
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

    -- 4. Asociar cliente si existe previamente por teléfono
    SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone LIMIT 1;

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
