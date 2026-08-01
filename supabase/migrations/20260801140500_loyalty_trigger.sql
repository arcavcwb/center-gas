-- ==============================================================================
-- ISSUE-502: CRM e Historial de Fidelidad Automático
-- Añade la lógica transaccional para premiar clientes recurrentes.
-- ==============================================================================

-- 1. Añadimos el contador de cascos gratis que el cliente tiene disponibles
ALTER TABLE customers ADD COLUMN available_free_cylinders INT DEFAULT 0 CHECK (available_free_cylinders >= 0);

-- 2. Función Atómica PL/pgSQL
CREATE OR REPLACE FUNCTION increment_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
    current_points INT;
BEGIN
    -- Solo actuar si el estado de la orden pasó a 'entregado'
    IF NEW.status = 'entregado' AND (OLD.status IS NULL OR OLD.status != 'entregado') THEN
        
        -- Obtener los puntos actuales del cliente para evitar condiciones de carrera complejas
        SELECT loyalty_points INTO current_points 
        FROM customers 
        WHERE id = NEW.customer_id 
        FOR UPDATE; -- Bloqueo de fila para atomicidad
        
        -- Si al sumar este pedido llega a 8 (target de fidelidad)
        IF current_points + 1 >= 8 THEN
            -- Resetea puntos y otorga el cilindro gratis
            UPDATE customers 
            SET 
                loyalty_points = 0,
                available_free_cylinders = available_free_cylinders + 1
            WHERE id = NEW.customer_id;
        ELSE
            -- Solo incrementa el contador
            UPDATE customers 
            SET loyalty_points = loyalty_points + 1
            WHERE id = NEW.customer_id;
        END IF;

    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear el Trigger sobre la tabla 'orders'
DROP TRIGGER IF EXISTS trg_loyalty_points ON orders;
CREATE TRIGGER trg_loyalty_points
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION increment_loyalty_points();
