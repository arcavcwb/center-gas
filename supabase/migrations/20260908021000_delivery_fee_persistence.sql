-- Migración: Persistencia y Cobro de Taxa de Entrega en create_b2c_order (ISSUE-816)

-- 1. Agregar columna delivery_fee a la tabla orders si no existe
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0.00;

-- 2. Redefinir create_b2c_order con cálculo de tasa de entrega, prevención de colisiones en display_id y search_path seguro
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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_customer_id UUID;
  v_neighborhood_id UUID;
  v_delivery_fee NUMERIC := 0.00;
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
  -- 1. Upsert Customer: Buscar por teléfono y obtener barrio
  SELECT id, neighborhood_id INTO v_customer_id, v_neighborhood_id 
  FROM customers 
  WHERE phone = p_phone;
  
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (phone, address_line) 
    VALUES (p_phone, p_address_line) 
    RETURNING id, neighborhood_id INTO v_customer_id, v_neighborhood_id;
  ELSE
    UPDATE customers SET address_line = p_address_line WHERE id = v_customer_id;
  END IF;

  -- 2. Obtener taxa de entrega del barrio asociado
  IF v_neighborhood_id IS NOT NULL THEN
    SELECT COALESCE(delivery_fee, 0.00) INTO v_delivery_fee 
    FROM neighborhoods 
    WHERE id = v_neighborhood_id;
  ELSE
    v_delivery_fee := 0.00;
  END IF;

  -- 3. Calcular subtotal de productos confiando exclusivamente en el precio de la base de datos
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID AND is_active = true;
    
    IF v_product IS NULL THEN
       RAISE EXCEPTION 'Produto não encontrado ou inativo: %', v_item->>'product_id';
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

  -- Total final = Subtotal + Taxa de Entrega - Desconto
  v_total_amount := GREATEST(0, v_subtotal_amount + v_delivery_fee - v_discount_applied);

  -- 4. Generar display_id único entre órdenes activas
  LOOP
    v_display_id := floor(random() * 8999 + 1000)::text;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM orders 
      WHERE display_id = v_display_id 
        AND status NOT IN ('entregado', 'cancelado')
    );
  END LOOP;

  -- 5. Crear Orden con taxa de entrega persistida
  INSERT INTO orders (
    display_id,
    customer_id,
    status,
    payment_method,
    cash_change_for,
    discount_applied,
    delivery_fee,
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
    v_delivery_fee,
    v_total_amount,
    COALESCE(p_is_scheduled, false),
    p_scheduled_for
  ) RETURNING id INTO v_order_id;

  -- 6. Insertar Detalle de Orden (Items)
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
    'display_id', v_display_id,
    'delivery_fee', v_delivery_fee,
    'total_amount', v_total_amount
  );
END;
$$;
