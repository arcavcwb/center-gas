-- Migración generada por el Squad (backend-dev-agent)
-- Objetivo: Actualizar el webhook de órdenes para cumplir con el contrato Zod (driver_name)

CREATE OR REPLACE FUNCTION notify_order_status_to_n8n()
RETURNS trigger AS $$
DECLARE
    customer_phone_var TEXT;
    motoboy_name_var TEXT;
    payload JSONB;
BEGIN
    -- Obtener teléfono del cliente
    SELECT phone INTO customer_phone_var FROM customers WHERE id = NEW.customer_id;
    
    -- Cumplimiento de Contrato Zod: Obtener nombre del conductor (si existe)
    IF NEW.driver_id IS NOT NULL THEN
        SELECT full_name INTO motoboy_name_var FROM profiles WHERE id = NEW.driver_id;
    ELSE
        motoboy_name_var := NULL;
    END IF;

    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        payload := jsonb_build_object(
            'id', NEW.id,
            'display_id', NEW.display_id,
            'status', NEW.status,
            'customer_phone', customer_phone_var,
            'driver_id', NEW.driver_id,
            'driver_name', motoboy_name_var,
            'total_amount', NEW.total_amount
        );

        -- Enviar petición HTTP POST a n8n
        PERFORM net.http_post(
            url := 'https://n8n.arcav.us/webhook/supabase-outbound-orders',
            body := payload,
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer CENTERGAS_SECURE_TOKEN_2026"}'::jsonb
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
