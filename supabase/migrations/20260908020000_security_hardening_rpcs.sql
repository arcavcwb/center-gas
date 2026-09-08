-- Migración: Blindaje de Seguridad en RPCs de Supabase (ISSUE-814 & ISSUE-815)
-- 1. Revocar permisos de ejecución a anon y public en funciones críticas del dashboard
REVOKE EXECUTE ON FUNCTION get_customers_with_stats() FROM anon, public;
REVOKE EXECUTE ON FUNCTION get_drivers_performance(VARCHAR) FROM anon, public;
REVOKE EXECUTE ON FUNCTION get_loyalty_metrics() FROM anon, public;

-- Garantizar ejecución únicamente a usuarios autenticados y service_role
GRANT EXECUTE ON FUNCTION get_customers_with_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_drivers_performance(VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_loyalty_metrics() TO authenticated, service_role;

-- 2. Redefinir get_drivers_performance con validación de rol owner y search_path seguro
CREATE OR REPLACE FUNCTION get_drivers_performance(p_period VARCHAR DEFAULT 'all')
RETURNS TABLE (
    driver_id UUID,
    full_name VARCHAR,
    total_deliveries BIGINT,
    total_revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Acesso não autorizado ao relatório de desempenho de motoristas.';
    END IF;

    RETURN QUERY
    SELECT 
        p.id AS driver_id,
        p.full_name,
        COUNT(o.id) AS total_deliveries,
        COALESCE(SUM(o.total_amount), 0) AS total_revenue
    FROM profiles p
    LEFT JOIN orders o ON p.id = o.driver_id AND o.status = 'entregado'
    WHERE p.role = 'driver'
      AND (
          p_period = 'all' OR
          (p_period = 'today' AND o.created_at::DATE = CURRENT_DATE) OR
          (p_period = 'week' AND o.created_at >= date_trunc('week', CURRENT_DATE)) OR
          (p_period = 'month' AND o.created_at >= date_trunc('month', CURRENT_DATE))
      )
    GROUP BY p.id, p.full_name
    ORDER BY total_deliveries DESC;
END;
$$;

-- 3. Redefinir get_loyalty_metrics con validación de rol owner y search_path seguro
CREATE OR REPLACE FUNCTION get_loyalty_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_near_loyalty INT;
    v_available_claims INT;
    v_result JSON;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Acesso não autorizado aos indicadores de fidelidade.';
    END IF;

    SELECT COUNT(*) INTO v_near_loyalty
    FROM customers
    WHERE loyalty_points IN (6, 7);

    SELECT COUNT(*) INTO v_available_claims
    FROM customers
    WHERE available_free_cylinders > 0;

    v_result := json_build_object(
        'near_loyalty', v_near_loyalty,
        'available_claims', v_available_claims
    );

    RETURN v_result;
END;
$$;

-- 4. Redefinir get_customers_with_stats con validación de rol owner y search_path seguro
CREATE OR REPLACE FUNCTION get_customers_with_stats()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    phone VARCHAR,
    loyalty_points INT,
    available_free_cylinders INT,
    total_orders BIGINT,
    total_spent NUMERIC,
    last_order_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Acesso não autorizado à carteira de clientes.';
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.phone,
        c.loyalty_points,
        c.available_free_cylinders,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        MAX(o.created_at) AS last_order_date
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id AND o.status = 'entregado'
    GROUP BY c.id
    ORDER BY last_order_date DESC NULLS LAST;
END;
$$;

-- 5. Redefinir update_order_status con autorización estricta (ISSUE-815)
-- Sólo el dueño o el chofer asignado a esta orden específica pueden modificarla.
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
SET search_path = public, pg_temp
AS $$
DECLARE
    v_old_status order_status;
    v_current_driver UUID;
    v_is_owner BOOLEAN;
BEGIN
    -- Validar que el usuario esté autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Operação não permitida para usuários anônimos.';
    END IF;

    -- Obtener estado actual y chofer asignado
    SELECT status, driver_id INTO v_old_status, v_current_driver 
    FROM orders 
    WHERE id = p_order_id;

    IF v_old_status IS NULL THEN
        RAISE EXCEPTION 'Pedido não encontrado: %', p_order_id;
    END IF;

    v_is_owner := public.is_owner();

    -- Autorización: Sólo el dueño o el conductor asignado a este pedido
    IF NOT (v_is_owner OR (v_current_driver IS NOT NULL AND v_current_driver = auth.uid())) THEN
        RAISE EXCEPTION 'Acesso não autorizado para alterar o status deste pedido.';
    END IF;

    -- Los repartidores sólo pueden cambiar a 'en_camino' o 'entregado'
    IF NOT v_is_owner AND p_new_status NOT IN ('en_camino', 'entregado') THEN
        RAISE EXCEPTION 'Entregadores só podem atualizar pedidos para en_camino ou entregado.';
    END IF;

    -- Actualizar la orden
    UPDATE orders 
    SET 
        status = p_new_status,
        driver_id = CASE WHEN v_is_owner THEN COALESCE(p_driver_id, driver_id) ELSE driver_id END,
        cylinder_returned = COALESCE(p_cylinder_returned, cylinder_returned)
    WHERE id = p_order_id;
    
    -- Registrar en historial
    INSERT INTO order_status_history (
        order_id, previous_status, new_status, changed_by, reason
    ) VALUES (
        p_order_id, v_old_status, p_new_status, auth.uid(), p_reason
    );
END;
$$;
