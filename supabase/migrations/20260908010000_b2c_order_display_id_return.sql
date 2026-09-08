-- Migración: Retorno estructurado de orden B2C con display_id amigable (ISSUE-811)

DROP FUNCTION IF EXISTS create_b2c_order(VARCHAR, VARCHAR, JSONB, VARCHAR, NUMERIC, BOOLEAN, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS create_b2c_order(VARCHAR, VARCHAR, JSONB, VARCHAR, NUMERIC);

CREATE OR REPLACE FUNCTION create_b2c_order(
  p_phone VARCHAR,
  p_address_line VARCHAR,
  p_items JSONB,
  p_payment_method VARCHAR,
  p_cash_change_for NUMERIC,
  p_is_scheduled BOOLEAN DEFAULT false,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
  v_display_id VARCHAR(10);
  v_subtotal_amount NUMERIC := 0;
  v_total_amount NUMERIC := 0;
  v_discount_applied NUMERIC := 0;
  v_item JSONB;
  v_product RECORD;
  v_gas_qty INT := 0;
  v_water_qty INT := 0;
  v_qty INT;
BEGIN
  -- 1. Upsert Customer: Buscar por teléfono
  SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone;
  
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (phone, address_line) 
    VALUES (p_phone, p_address_line) 
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE customers SET address_line = p_address_line WHERE id = v_customer_id;
  END IF;

  -- 2. Calcular total de la orden confiando SÓLO en la base de datos (seguridad)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID AND is_active = true;
    
    IF v_product IS NULL THEN
       RAISE EXCEPTION 'Producto no encontrado o inactivo: %', v_item->>'product_id';
    END IF;
    
    v_qty := (v_item->>'quantity')::INT;
    v_subtotal_amount := v_subtotal_amount + (v_product.price * v_qty);

    IF LOWER(v_product.sku) LIKE '%p13%' OR LOWER(v_product.sku) LIKE '%gas%' THEN
      v_gas_qty := v_gas_qty + v_qty;
    ELSIF LOWER(v_product.sku) LIKE '%water%' OR LOWER(v_product.sku) LIKE '%agua%' THEN
      v_water_qty := v_water_qty + v_qty;
    END IF;
  END LOOP;

  -- Regla de Negocio BR-001: Descuento de R$ 5,00 por cada par Gas + Agua
  v_discount_applied := LEAST(v_gas_qty, v_water_qty) * 5.00;
  v_total_amount := GREATEST(0, v_subtotal_amount - v_discount_applied);

  -- 3. Generar display_id amigable de 4 dígitos
  v_display_id := floor(random() * 8999 + 1000)::text;

  -- 4. Crear Orden con soporte para agendamiento y display_id amigable
  INSERT INTO orders (
    display_id,
    customer_id,
    status,
    payment_method,
    cash_change_for,
    discount_applied,
    total_amount,
    is_scheduled,
    scheduled_for
  ) VALUES (
    v_display_id,
    v_customer_id,
    'nuevo',
    p_payment_method::payment_method,
    p_cash_change_for,
    v_discount_applied,
    v_total_amount,
    COALESCE(p_is_scheduled, false),
    p_scheduled_for
  ) RETURNING id INTO v_order_id;

  -- 5. Insertar Detalle de Orden (Items)
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

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'id', v_order_id,
    'display_id', v_display_id
  );
END;
$$;
