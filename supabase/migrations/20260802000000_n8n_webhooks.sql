-- Habilitar extensión pg_net (necesita estar activada en el dashboard de Supabase si es self-hosted)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Crear una función que envíe un payload enriquecido a n8n
CREATE OR REPLACE FUNCTION notify_order_status_to_n8n()
RETURNS trigger AS $$
DECLARE
    customer_phone_var TEXT;
    payload JSONB;
BEGIN
    -- Obtener el teléfono del cliente
    SELECT phone INTO customer_phone_var FROM customers WHERE id = NEW.customer_id;

    -- Solo enviar notificaciones si el status cambió (o si es nuevo)
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        
        -- Construir payload con datos esenciales
        payload := jsonb_build_object(
            'id', NEW.id,
            'display_id', NEW.display_id,
            'status', NEW.status,
            'customer_phone', customer_phone_var,
            'driver_id', NEW.driver_id,
            'total_amount', NEW.total_amount
        );

        -- Enviar petición HTTP POST a n8n de forma asíncrona
        -- Reemplazar esta URL con la IP/Host final de n8n en producción
        PERFORM net.http_post(
            url := 'http://localhost:5678/webhook/supabase-outbound-orders',
            body := payload,
            headers := '{"Content-Type": "application/json"}'::jsonb
        );
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el Trigger en la tabla orders
DROP TRIGGER IF EXISTS order_status_webhook_trigger ON orders;
CREATE TRIGGER order_status_webhook_trigger
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_status_to_n8n();
