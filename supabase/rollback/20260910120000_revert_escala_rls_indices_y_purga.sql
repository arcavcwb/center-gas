-- ============================================================================
-- REVERSIÓN de 20260910120000_escala_rls_indices_y_purga.sql
-- ============================================================================
-- Este fichero NO es una migración y no vive en supabase/migrations/ a
-- propósito: el runner aplica ese directorio entero y no debe tocar esto.
--
-- Se escribió junto a la migración, no cuando hizo falta. Una reversión
-- redactada con el sistema ya degradado es una reversión que nadie ha leído.
--
-- Devuelve el esquema al estado anterior sin pérdida de datos: todo son ALTER
-- y un DROP INDEX. Lo único que NO se puede deshacer es lo que la purga haya
-- borrado, que por eso se ejecuta con ventanas de retención generosas.
--
-- Cómo usarlo: Dashboard de Supabase -> SQL Editor -> pegar y ejecutar.
-- ============================================================================

-- 1. Las políticas vuelven al predicado sin envolver.
ALTER POLICY "Dueños tienen control total sobre orders" ON orders
  USING (is_owner());
ALTER POLICY "Drivers ven sus propias ordenes" ON orders
  USING (driver_id = auth.uid());

ALTER POLICY "Dueño lee y escribe customers" ON customers
  USING (is_owner());
ALTER POLICY "Drivers ven clientes de sus ordenes" ON customers
  USING (EXISTS (SELECT 1 FROM orders
    WHERE orders.customer_id = customers.id AND orders.driver_id = auth.uid()));

ALTER POLICY "Dueños tienen control total sobre order items" ON order_items
  USING (is_owner());
ALTER POLICY "Drivers ven items de sus ordenes" ON order_items
  USING (EXISTS (SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id AND orders.driver_id = auth.uid()));

ALTER POLICY "Dueños tienen control total sobre history" ON order_status_history
  USING (is_owner());
ALTER POLICY "Drivers ven history de sus ordenes" ON order_status_history
  USING (EXISTS (SELECT 1 FROM orders
    WHERE orders.id = order_status_history.order_id AND orders.driver_id = auth.uid()));
ALTER POLICY "Drivers pueden insertar en history" ON order_status_history
  WITH CHECK (EXISTS (SELECT 1 FROM orders
    WHERE orders.id = order_status_history.order_id AND orders.driver_id = auth.uid()));

ALTER POLICY "Solo owner puede crear/modificar perfiles" ON profiles
  USING (is_owner());
ALTER POLICY "Solo owner puede administrar productos" ON products
  USING (is_owner());
ALTER POLICY "Solo owner puede administrar barrios" ON neighborhoods
  USING (is_owner());
ALTER POLICY "Solo el dueño lee el log de notificaciones" ON notifications_log
  USING (is_owner());

-- 2. Las funciones vuelven a VOLATILE.
ALTER FUNCTION public.is_owner()  VOLATILE;
ALTER FUNCTION public.is_driver() VOLATILE;

-- 3. Fuera el índice parcial. El índice (status, created_at DESC) anterior
--    nunca se tocó, así que sigue ahí.
DROP INDEX IF EXISTS public.idx_orders_activos;

-- 4. Fuera la purga: primero el planificador, después la función.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron')
     AND EXISTS (SELECT 1 FROM cron.job WHERE jobname='purga-diaria') THEN
    PERFORM cron.unschedule('purga-diaria');
  END IF;
END $$;
DROP FUNCTION IF EXISTS public.purge_ephemeral_data();
