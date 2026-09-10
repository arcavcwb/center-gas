-- ============================================================================
-- Fase 2 del plan de escala: paginar la carteira de clientes.
-- ============================================================================
--
-- get_customers_with_stats() cruza la tabla entera de clientes contra la entera
-- de pedidos, agrupa, ordena y devuelve TODO. Sin LIMIT y sin filtro. Cada vez
-- que el dueño abre la pantalla se mandan al navegador tantas filas como
-- clientes haya, y el buscador filtra en JavaScript sobre lo ya descargado.
--
-- QUÉ ARREGLA ESTA MIGRACIÓN, Y QUÉ NO
--
-- Arregla lo que domina hoy: el payload y el coste de buscar.
--   · Devuelve una página, no la base entera.
--   · El filtro de búsqueda se aplica ANTES de agregar, así que buscar a un
--     cliente concreto deja de recorrer el historial de los otros 2.999.
--
-- No elimina el agregado en el caso de navegar sin buscar, y no puede: la
-- pantalla ordena por «último pedido», que es MAX(orders.created_at) por
-- cliente. Ordenar por un valor calculado obliga a calcularlo para todas las
-- filas candidatas antes de poder quedarse con las primeras. Es una propiedad
-- del problema, no de esta implementación.
--
-- El siguiente escalón, cuando la carteira lo pida, es desnormalizar
-- `last_order_at` como columna de `customers` mantenida por trigger: entonces
-- el orden pasa a ser indexable y la consulta se vuelve O(página). No se hace
-- aquí porque añade trigger, columna y backfill —riesgo que esta fase no tiene—
-- y porque a la escala de hoy el agregado no es lo que duele.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Índice de apoyo para el cálculo por cliente
-- ----------------------------------------------------------------------------
-- El LATERAL de abajo pregunta, por cliente, cuántos pedidos entregados tiene,
-- cuánto suman y cuál fue el último. Un índice parcial sobre (customer_id,
-- created_at DESC) restringido a los entregados convierte cada una de esas
-- preguntas en una lectura de índice, y deja fuera los no entregados, que en
-- esta consulta no pintan nada.
CREATE INDEX IF NOT EXISTS idx_orders_entregados_por_cliente
  ON orders (customer_id, created_at DESC)
  WHERE status = 'entregado';


-- ----------------------------------------------------------------------------
-- 2. La función paginada
-- ----------------------------------------------------------------------------
-- Paginación por cursor y no por OFFSET: con OFFSET, pedir la página 40 obliga
-- a producir y descartar las 39 anteriores. El cursor es el par
-- (último pedido, id) de la última fila entregada, que es estable aunque entren
-- clientes nuevos mientras se navega.
--
-- El par hace falta porque `last_order_date` no es único —varios clientes
-- pueden no haber pedido nunca, y ahí es NULL para todos—: el `id` desempata y
-- garantiza que ninguna fila se repita ni se salte entre páginas.
CREATE OR REPLACE FUNCTION get_customers_page(
    p_limit             INT         DEFAULT 50,
    p_cursor_last_order TIMESTAMPTZ DEFAULT NULL,
    p_cursor_id         UUID        DEFAULT NULL,
    p_search            TEXT        DEFAULT NULL
)
RETURNS TABLE (
    id                       UUID,
    name                     VARCHAR,
    phone                    VARCHAR,
    loyalty_points           INT,
    available_free_cylinders INT,
    total_orders             BIGINT,
    total_spent              NUMERIC,
    last_order_date          TIMESTAMP WITH TIME ZONE,
    has_more                 BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    -- Un cliente no decide cuánto se le sirve: 200 filas es el techo.
    v_limit  INT  := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
    v_search TEXT := NULLIF(btrim(COALESCE(p_search, '')), '');
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Acesso não autorizado à carteira de clientes.';
    END IF;

    RETURN QUERY
    WITH filtrados AS (
        -- El filtro va aquí, sobre columnas de `customers`, antes de tocar
        -- `orders`. Buscar deja de pagar el historial de los que no casan.
        SELECT c.id, c.name, c.phone, c.loyalty_points, c.available_free_cylinders
        FROM customers c
        WHERE v_search IS NULL
           OR c.phone ILIKE '%' || v_search || '%'
           OR c.name  ILIKE '%' || v_search || '%'
    ),
    con_stats AS (
        SELECT f.*, s.n_pedidos, s.gastado, s.ultimo
        FROM filtrados f
        LEFT JOIN LATERAL (
            SELECT COUNT(*)                            AS n_pedidos,
                   COALESCE(SUM(o.total_amount), 0)    AS gastado,
                   MAX(o.created_at)                   AS ultimo
            FROM orders o
            WHERE o.customer_id = f.id
              AND o.status = 'entregado'
        ) s ON TRUE
    ),
    pagina AS (
        SELECT cs.*
        FROM con_stats cs
        WHERE p_cursor_id IS NULL
           OR (
                -- El cursor trae fecha: siguen los de fecha menor, el empate por
                -- id, y todos los que no tienen fecha (van al final del orden).
                (p_cursor_last_order IS NOT NULL AND (
                     cs.ultimo < p_cursor_last_order
                  OR (cs.ultimo = p_cursor_last_order AND cs.id < p_cursor_id)
                  OR cs.ultimo IS NULL))
                OR
                -- El cursor ya está en la zona sin fecha: sólo quedan los de id menor.
                (p_cursor_last_order IS NULL AND cs.ultimo IS NULL AND cs.id < p_cursor_id)
              )
        ORDER BY cs.ultimo DESC NULLS LAST, cs.id DESC
        LIMIT v_limit + 1   -- una de más, sólo para saber si hay página siguiente
    ),
    contada AS (
        SELECT p.*,
               COUNT(*) OVER ()                                                  AS n_traidas,
               ROW_NUMBER() OVER (ORDER BY p.ultimo DESC NULLS LAST, p.id DESC)  AS rn
        FROM pagina p
    )
    SELECT ct.id, ct.name, ct.phone, ct.loyalty_points, ct.available_free_cylinders,
           ct.n_pedidos, ct.gastado, ct.ultimo,
           (ct.n_traidas > v_limit) AS has_more
    FROM contada ct
    WHERE ct.rn <= v_limit          -- la fila de más se descarta aquí
    ORDER BY ct.rn;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_customers_page(INT, TIMESTAMPTZ, UUID, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION get_customers_page(INT, TIMESTAMPTZ, UUID, TEXT) TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- 3. La función vieja se queda, de momento
-- ----------------------------------------------------------------------------
-- get_customers_with_stats() sigue existiendo a propósito. Entre que esta
-- migración se aplica y que Vercel termina de desplegar el frontend nuevo hay
-- una ventana en la que el panel en el navegador de alguien sigue pidiendo la
-- función vieja. Retirarla ahora es romper esa pantalla.
--
-- Se elimina en el PR siguiente, cuando el despliegue haya asentado:
--   DROP FUNCTION IF EXISTS get_customers_with_stats();
