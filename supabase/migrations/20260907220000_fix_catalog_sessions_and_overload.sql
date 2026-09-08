-- Migración: Agregar created_at a catalog_sessions, resolver sobrecarga y retornar JSONB

-- 1. Agregar columna created_at a catalog_sessions si no existe
ALTER TABLE catalog_sessions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Eliminar funciones anteriores para evitar conflictos de tipo de retorno en PostgreSQL
DROP FUNCTION IF EXISTS generate_catalog_session(VARCHAR);
DROP FUNCTION IF EXISTS generate_catalog_session(VARCHAR, INT);

-- 3. Definición atómica de generate_catalog_session con retorno JSONB (compatible n8n y PostgREST)
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
BEGIN
    -- === RATE LIMIT CHECK (atómico, sin round-trip externo) ===
    SELECT created_at INTO v_last_session_at
    FROM catalog_sessions
    WHERE phone_context = p_phone
    ORDER BY created_at DESC
    LIMIT 1;

    -- Si existe una sesión reciente dentro del período de rate limit → retornar token null
    IF FOUND AND v_last_session_at >= NOW() - (p_rate_limit_minutes || ' minutes')::INTERVAL THEN
        RETURN jsonb_build_object('token', NULL, 'rate_limited', true);
    END IF;

    -- === GENERACIÓN DE TOKEN ===
    -- Token aleatorio seguro (32 bytes hex = 64 chars)
    v_token := encode(gen_random_bytes(32), 'hex');

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
