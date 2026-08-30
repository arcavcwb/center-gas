-- Migración: Corrección del RPC generate_catalog_session con rate limiting atómico
-- Corrección: Hallazgo Crítico #1 del @pr-reviewer-agent
-- Fusiona el check de rate limit DENTRO de la función para:
--   1. Eliminar el nodo HTTP separado en n8n (reducir superficie de ataque).
--   2. Garantizar que la clave anon nunca toque datos sensibles de catalog_sessions.
--   3. Operación atómica: check + insert en una sola transacción (LGPD safe).
--
-- Retorna: VARCHAR token si puede responder.
--          NULL si el número está en rate limit (n8n ignora silenciosamente).

CREATE OR REPLACE FUNCTION generate_catalog_session(
    p_phone VARCHAR,
    p_rate_limit_minutes INT DEFAULT 10
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token VARCHAR(64);
    v_customer_id UUID;
    v_last_session_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- === RATE LIMIT CHECK (atómico, sin round-trip externo) ===
    SELECT created_at INTO v_last_session_at
    FROM catalog_sessions
    WHERE phone_context = p_phone
    ORDER BY created_at DESC
    LIMIT 1;

    -- Si existe una sesión reciente dentro del período de rate limit → retornar NULL
    IF FOUND AND v_last_session_at >= NOW() - (p_rate_limit_minutes || ' minutes')::INTERVAL THEN
        RETURN NULL; -- n8n detecta NULL y aborta el flujo silenciosamente
    END IF;

    -- === GENERACIÓN DE TOKEN ===
    -- Token aleatorio seguro (32 bytes hex = 64 chars)
    v_token := encode(gen_random_bytes(32), 'hex');

    -- Intentar buscar al cliente por teléfono
    SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone LIMIT 1;

    -- Insertar sesión nueva (expira en 24hs)
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
