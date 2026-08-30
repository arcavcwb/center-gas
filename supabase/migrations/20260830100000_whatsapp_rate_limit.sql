-- Migración: RPC de Rate Limiting para proteger el número de WhatsApp
-- Regla 2 del Protocolo Anti-Baneo (docs/16-whatsapp-anti-ban-protocol.md)
-- Retorna TRUE si el número puede recibir una respuesta (no ha recibido una en los últimos N minutos).
-- Retorna FALSE si ya recibió una respuesta recientemente (ignorar silenciosamente).

CREATE OR REPLACE FUNCTION check_rate_limit(p_phone VARCHAR, p_minutes INT DEFAULT 10)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_session TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Buscar la sesión más reciente para este teléfono
    SELECT created_at INTO v_last_session
    FROM catalog_sessions
    WHERE phone_context = p_phone
    ORDER BY created_at DESC
    LIMIT 1;

    -- Si no existe sesión previa, puede responder
    IF NOT FOUND THEN
        RETURN TRUE;
    END IF;

    -- Si la última sesión fue hace más de p_minutes minutos, puede responder
    IF v_last_session < NOW() - (p_minutes || ' minutes')::INTERVAL THEN
        RETURN TRUE;
    END IF;

    -- Si llegó hasta aquí, está dentro del período de rate limit
    RETURN FALSE;
END;
$$;
