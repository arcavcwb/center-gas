-- 1. Actualizar URL del Webhook a Producción (n8n.arcav.us)
CREATE OR REPLACE FUNCTION notify_order_status_to_n8n()
RETURNS trigger AS $$
DECLARE
    customer_phone_var TEXT;
    payload JSONB;
BEGIN
    SELECT phone INTO customer_phone_var FROM customers WHERE id = NEW.customer_id;

    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        payload := jsonb_build_object(
            'id', NEW.id,
            'display_id', NEW.display_id,
            'status', NEW.status,
            'customer_phone', customer_phone_var,
            'driver_id', NEW.driver_id,
            'total_amount', NEW.total_amount
        );

        -- Enviar petición HTTP POST a n8n (Actualizado al host real)
        PERFORM net.http_post(
            url := 'https://n8n.arcav.us/webhook/supabase-outbound-orders',
            body := payload,
            headers := '{"Content-Type": "application/json"}'::jsonb
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 2. Seed Data (Barrios y Productos para el MVP)

-- Insertar Barrios Cercanos a Pinheirinho / Rua João Bettega / João Correa
INSERT INTO neighborhoods (name, delivery_fee) VALUES 
  ('Pinheirinho', 0.00),
  ('Capão Raso', 5.00),
  ('Xaxim', 5.00),
  ('Tatuquara', 8.00),
  ('Sítio Cercado', 6.00)
ON CONFLICT (name) DO NOTHING;

-- Insertar el Botellón de Agua
INSERT INTO products (sku, name, price, includes_cylinder) VALUES
  ('water', 'Botellón de Agua 20L', 15.00, false)
ON CONFLICT (sku) DO UPDATE SET 
  name = EXCLUDED.name,
  price = EXCLUDED.price;
