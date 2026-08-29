-- Migración para KPIs del Dueño (Épica 7 / Post-MVP -> Adelantado a Issue-701)

-- 1. Métricas de Rendimiento de Conductores
CREATE OR REPLACE FUNCTION get_drivers_performance(p_period VARCHAR DEFAULT 'all')
RETURNS TABLE (
    driver_id UUID,
    full_name VARCHAR,
    total_deliveries BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Métricas del Programa de Lealtad (Agregadas)
CREATE OR REPLACE FUNCTION get_loyalty_metrics()
RETURNS JSON AS $$
DECLARE
    v_near_loyalty INT;
    v_available_claims INT;
    v_result JSON;
BEGIN
    -- Clientes con 6 o 7 puntos (a 1 o 2 compras del gas gratis)
    SELECT COUNT(*) INTO v_near_loyalty
    FROM customers
    WHERE loyalty_points IN (6, 7);

    -- Clientes que ya llegaron a 8 y tienen su gas pendiente de reclamar
    SELECT COUNT(*) INTO v_available_claims
    FROM customers
    WHERE available_free_cylinders > 0;

    v_result := json_build_object(
        'near_loyalty', v_near_loyalty,
        'available_claims', v_available_claims
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Historial de Clientes para la Tabla
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
) AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
