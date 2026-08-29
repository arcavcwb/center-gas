-- Función para actualizar el estado del pedido e insertar en el historial (ISSUE-202)
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID, 
    p_new_status order_status, 
    p_reason TEXT DEFAULT NULL, 
    p_driver_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_status order_status;
BEGIN
    -- Obtener el estado actual
    SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
    
    -- Actualizar la orden
    IF p_driver_id IS NOT NULL THEN
        UPDATE orders SET status = p_new_status, driver_id = p_driver_id WHERE id = p_order_id;
    ELSE
        UPDATE orders SET status = p_new_status WHERE id = p_order_id;
    END IF;
    
    -- Insertar en el historial
    INSERT INTO order_status_history (
        order_id, previous_status, new_status, changed_by, reason
    ) VALUES (
        p_order_id, v_old_status, p_new_status, auth.uid(), p_reason
    );
END;
$$;
