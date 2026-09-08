-- Migración: Recordatorio Proactivo de Recompra (45+ días) y Opt-Out LGPD (ISSUE-702)

-- 1. Ampliación de tabla customers
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS allow_marketing BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS last_repurchase_reminder_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS repurchase_reminders_count INT NOT NULL DEFAULT 0;

-- 2. Índice compuesto para escaneo rápido de retención
CREATE INDEX IF NOT EXISTS idx_customers_repurchase_marketing 
ON public.customers (allow_marketing, last_repurchase_reminder_at);

-- 3. RPC: Obtener clientes inactivos para recordatorio de reposición
CREATE OR REPLACE FUNCTION public.get_inactive_customers_for_repurchase_reminder(
    p_days_inactive INT DEFAULT 45,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    customer_id UUID,
    customer_name VARCHAR,
    customer_phone VARCHAR,
    days_since_last_order INT,
    last_order_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    WITH customer_last_delivered AS (
        SELECT 
            o.customer_id,
            MAX(o.created_at) AS max_delivered_at
        FROM public.orders o
        WHERE o.status = 'entregado'
        GROUP BY o.customer_id
    )
    SELECT 
        c.id AS customer_id,
        COALESCE(c.name, 'Cliente') AS customer_name,
        c.phone AS customer_phone,
        EXTRACT(DAY FROM (NOW() - cld.max_delivered_at))::INT AS days_since_last_order,
        cld.max_delivered_at AS last_order_at
    FROM public.customers c
    JOIN customer_last_delivered cld ON cld.customer_id = c.id
    WHERE c.allow_marketing = true
      -- Cooldown de 30 días entre recordatorios para evitar spam
      AND (c.last_repurchase_reminder_at IS NULL OR c.last_repurchase_reminder_at <= NOW() - INTERVAL '30 days')
      -- Inactividad mínima requerida (45 días por defecto)
      AND cld.max_delivered_at <= NOW() - (p_days_inactive || ' days')::INTERVAL
      -- No debe tener pedidos activos o en curso
      AND NOT EXISTS (
          SELECT 1 
          FROM public.orders o_active
          WHERE o_active.customer_id = c.id 
            AND o_active.status IN ('nuevo', 'confirmado', 'asignado', 'en_camino')
      )
    ORDER BY cld.max_delivered_at ASC
    LIMIT p_limit;
END;
$$;

-- 4. RPC: Registrar recordatorio enviado
CREATE OR REPLACE FUNCTION public.record_repurchase_reminder_sent(
    p_customer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.customers
    SET 
        last_repurchase_reminder_at = NOW(),
        repurchase_reminders_count = repurchase_reminders_count + 1
    WHERE id = p_customer_id;

    RETURN FOUND;
END;
$$;

-- 5. RPC: Opt-Out de Marketing (LGPD)
CREATE OR REPLACE FUNCTION public.customer_opt_out_marketing(
    p_phone VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_updated INT := 0;
BEGIN
    IF p_phone IS NULL OR trim(p_phone) = '' THEN
        RETURN FALSE;
    END IF;

    -- Actualiza usando variantes de teléfono brasileño (tolerancia al 9° dígito)
    UPDATE public.customers
    SET allow_marketing = false
    WHERE phone = ANY(public.get_phone_variants(p_phone))
       OR regexp_replace(phone, '\D', '', 'g') = ANY(public.get_phone_variants(p_phone));

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN (v_updated > 0);
END;
$$;

-- 6. Permisos y Seguridad RLS
REVOKE EXECUTE ON FUNCTION public.get_inactive_customers_for_repurchase_reminder(INT, INT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_inactive_customers_for_repurchase_reminder(INT, INT) TO service_role, authenticated;

REVOKE EXECUTE ON FUNCTION public.record_repurchase_reminder_sent(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.record_repurchase_reminder_sent(UUID) TO service_role, authenticated;

GRANT EXECUTE ON FUNCTION public.customer_opt_out_marketing(VARCHAR) TO service_role, anon, authenticated;
