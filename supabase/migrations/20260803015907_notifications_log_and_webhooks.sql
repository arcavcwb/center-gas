-- 1. Create table for notifications log (Idempotency)
CREATE TABLE IF NOT EXISTS notifications_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id, notification_type)
);

-- 2. Update webhook function to point to production n8n VPS
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

        -- Enviar petición HTTP POST a n8n de forma asíncrona apuntando al VPS
        PERFORM net.http_post(
            url := 'https://n8n.arcav.us/webhook/supabase-outbound-orders',
            body := payload,
            headers := '{"Content-Type": "application/json"}'::jsonb
        );
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
