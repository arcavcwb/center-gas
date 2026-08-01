CREATE OR REPLACE FUNCTION create_b2c_order(
  p_phone VARCHAR,
  p_address_line VARCHAR,
  p_items JSONB,
  p_payment_method VARCHAR,
  p_cash_change_for NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con los privilegios de owner (bypassa RLS de forma segura)
AS $$
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
  v_total_amount NUMERIC := 0;
  v_item JSONB;
  v_product RECORD;
BEGIN
  -- 1. Upsert Customer: Buscar por teléfono
  SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone;
  
  IF v_customer_id IS NULL THEN
    -- Crear cliente anónimo (el nombre puede ser modificado después por el owner)
    INSERT INTO customers (phone, address_line) 
    VALUES (p_phone, p_address_line) 
    RETURNING id INTO v_customer_id;
  ELSE
    -- Actualizar dirección (la última dirección provista)
    UPDATE customers SET address_line = p_address_line WHERE id = v_customer_id;
  END IF;

  -- 2. Calcular total de la orden confiando SÓLO en la base de datos (seguridad)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID AND is_active = true;
    
    IF v_product IS NULL THEN
       RAISE EXCEPTION 'Producto no encontrado o inactivo: %', v_item->>'product_id';
    END IF;
    
    v_total_amount := v_total_amount + (v_product.price * (v_item->>'quantity')::INT);
  END LOOP;

  -- 3. Crear Orden
  INSERT INTO orders (
    display_id,
    customer_id,
    status,
    payment_method,
    cash_change_for,
    total_amount
  ) VALUES (
    floor(random() * 8999 + 1000)::text,
    v_customer_id,
    'nuevo',
    p_payment_method::payment_method,
    p_cash_change_for,
    v_total_amount
  ) RETURNING id INTO v_order_id;

  -- 4. Insertar Detalle de Orden (Items)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT price INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID;
    
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INT,
      v_product.price
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;
