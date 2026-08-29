-- Extensión de la función de actualización de estado para manejar la devolución de cascos (Epic 3/4)
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID, 
    p_new_status order_status, 
    p_reason TEXT DEFAULT NULL, 
    p_driver_id UUID DEFAULT NULL,
    p_cylinder_returned BOOLEAN DEFAULT NULL
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
    
    -- Actualizar la orden dinámicamente según lo provisto
    UPDATE orders 
    SET 
        status = p_new_status,
        driver_id = COALESCE(p_driver_id, driver_id),
        cylinder_returned = COALESCE(p_cylinder_returned, cylinder_returned)
    WHERE id = p_order_id;
    
    -- Insertar en el historial
    INSERT INTO order_status_history (
        order_id, previous_status, new_status, changed_by, reason
    ) VALUES (
        p_order_id, v_old_status, p_new_status, auth.uid(), p_reason
    );
END;
$$;
