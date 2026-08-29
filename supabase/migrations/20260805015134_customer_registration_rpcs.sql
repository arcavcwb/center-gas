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

-- Función para registrar un nuevo cliente desde el B2C (Frontend Anónimo)
CREATE OR REPLACE FUNCTION register_b2c_customer(
    p_phone VARCHAR,
    p_name VARCHAR,
    p_neighborhood_id UUID,
    p_address_line VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_active BOOLEAN;
    v_customer_id UUID;
BEGIN
    -- Validar que el barrio existe y está activo
    SELECT is_active INTO v_is_active FROM neighborhoods WHERE id = p_neighborhood_id;
    
    IF v_is_active IS NULL THEN
        RAISE EXCEPTION 'El barrio seleccionado no existe.';
    END IF;
    
    IF NOT v_is_active THEN
        -- Aquí podríamos insertar en una tabla de leads perdidos si tuviéramos una,
        -- pero por ahora simplemente rechazamos con un mensaje claro.
        RAISE EXCEPTION 'Lo sentimos, aún no tenemos cobertura en tu barrio.';
    END IF;

    -- Insertar el cliente. Si hay conflicto de teléfono (ya existe), actualizamos los datos.
    INSERT INTO customers (phone, name, neighborhood_id, address_line)
    VALUES (p_phone, p_name, p_neighborhood_id, p_address_line)
    ON CONFLICT (phone) DO UPDATE 
    SET name = EXCLUDED.name,
        neighborhood_id = EXCLUDED.neighborhood_id,
        address_line = EXCLUDED.address_line
    RETURNING id INTO v_customer_id;

    RETURN v_customer_id;
END;
$$;
