-- Función para verificar si un cliente existe por su teléfono (Frontend B2C - Anónimo)
CREATE OR REPLACE FUNCTION check_customer_exists(p_phone VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer RECORD;
BEGIN
    SELECT * INTO v_customer FROM customers WHERE phone = p_phone LIMIT 1;
    
    IF FOUND THEN
        RETURN jsonb_build_object(
            'exists', true,
            'name', v_customer.name,
            'address_line', v_customer.address_line,
            'neighborhood_id', v_customer.neighborhood_id
        );
    ELSE
        RETURN jsonb_build_object('exists', false);
    END IF;
END;
$$;
