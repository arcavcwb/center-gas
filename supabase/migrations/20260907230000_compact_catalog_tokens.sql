-- Migración: Tokens compactos Base62 de 6 caracteres para WhatsApp Auto-Link (ISSUE-809)

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
    v_chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    v_bytes BYTEA;
    i INT;
    v_collision_count INT := 0;
BEGIN
    -- === RATE LIMIT CHECK (10 min por defecto) ===
    SELECT created_at INTO v_last_session_at
    FROM catalog_sessions
    WHERE phone_context = p_phone
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND AND v_last_session_at >= NOW() - (p_rate_limit_minutes || ' minutes')::INTERVAL THEN
        RETURN jsonb_build_object('token', NULL, 'rate_limited', true);
    END IF;

    -- === GENERACIÓN DE TOKEN COMPACTO (6 Chars Base62) ===
    -- Loop de garantía de unicidad absoluta
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

    -- Intentar buscar al cliente por teléfono
    SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone LIMIT 1;

    -- Insertar sesión nueva (expira en 24hs)
    INSERT INTO catalog_sessions (token, customer_id, phone_context, expires_at, created_at)
    VALUES (
        v_token,
        v_customer_id,
        p_phone,
        NOW() + INTERVAL '24 hours',
        NOW()
    );

    RETURN jsonb_build_object('token', v_token, 'rate_limited', false);
END;
$$;
