-- Función para generar un token de sesión opaco (ISSUE-106 LGPD)
CREATE OR REPLACE FUNCTION generate_catalog_session(p_phone VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token VARCHAR(64);
    v_customer_id UUID;
BEGIN
    -- Generar un token aleatorio seguro (32 bytes hex = 64 chars)
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Intentar buscar al cliente
    SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone LIMIT 1;
    
    -- Insertar en catalog_sessions (expira en 24hs)
    INSERT INTO catalog_sessions (token, customer_id, phone_context, expires_at)
    VALUES (
        v_token, 
        v_customer_id, 
        p_phone, 
        NOW() + INTERVAL '24 hours'
    );
    
    RETURN v_token;
END;
$$;

-- Función para resolver el token de sesión en el catálogo
CREATE OR REPLACE FUNCTION resolve_catalog_session(p_token VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_customer RECORD;
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
    
    -- Si el customer_id está nulo, volvemos a buscar por si el cliente se registró en el interín
    IF v_session.customer_id IS NULL THEN
        SELECT * INTO v_customer FROM customers WHERE phone = v_session.phone_context LIMIT 1;
        IF FOUND THEN
            -- Actualizar la sesión para futuras llamadas
            UPDATE catalog_sessions SET customer_id = v_customer.id WHERE id = v_session.id;
            v_session.customer_id := v_customer.id;
        END IF;
    ELSE
        SELECT * INTO v_customer FROM customers WHERE id = v_session.customer_id;
    END IF;

    IF v_session.customer_id IS NOT NULL THEN
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
