-- ============================================================================
-- Fase 1 del plan de escala: que el coste de RLS deje de crecer con la tabla.
-- ============================================================================
--
-- El problema, en una frase: `is_owner()` no estaba marcada STABLE, así que
-- PostgreSQL la trataba como VOLATILE y la reevaluaba UNA VEZ POR FILA
-- EXAMINADA. Cada evaluación es, a su vez, una consulta contra `profiles`.
-- Con 36.000 pedidos, una lectura del Kanban disparaba hasta 36.000 consultas
-- para responder una pregunta cuya respuesta es idéntica en todas ellas.
--
-- Dos cambios lo arreglan y ninguno altera QUÉ filas se ven, sólo CUÁNTAS VECES
-- se pregunta:
--
--   1. STABLE le dice al planificador que la función no modifica nada y que
--      dentro de una misma sentencia devuelve siempre lo mismo. Es cierto: sólo
--      lee, y auth.uid() se apoya en un GUC que no cambia a mitad de sentencia.
--
--   2. Envolver el predicado en (SELECT ...) lo convierte en un InitPlan, que
--      PostgreSQL evalúa una sola vez por consulta y reutiliza. Es el patrón que
--      documenta Supabase para RLS a escala.
--
-- Esta migración es idempotente: ALTER FUNCTION, ALTER POLICY y
-- CREATE INDEX IF NOT EXISTS se pueden repetir sin efecto acumulativo.
--
-- Verificación: supabase/tests/hardening_auditoria.test.sql, bloque 15, prueba
-- que RLS sigue bloqueando exactamente lo mismo después de este cambio. Ese
-- bloque se escribió ANTES que esta migración, a propósito.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Las funciones de RLS dejan de ser VOLATILE
-- ----------------------------------------------------------------------------
ALTER FUNCTION public.is_owner()  STABLE;
ALTER FUNCTION public.is_driver() STABLE;


-- ----------------------------------------------------------------------------
-- 2. Los predicados pasan a InitPlan
-- ----------------------------------------------------------------------------
-- Se listan las 13 políticas que hoy llaman a is_owner() o a auth.uid(). La
-- lista sale de consultar pg_policies sobre el esquema ya aplicado, no de leer
-- las migraciones: varias políticas se crearon y se sustituyeron por el camino.
--
-- OJO con las políticas FOR ALL: no tienen WITH CHECK propio, así que su USING
-- hace también de comprobación de escritura. ALTER POLICY ... USING no toca el
-- WITH CHECK (sigue siendo NULL), de modo que esa doble función se conserva.

-- orders
ALTER POLICY "Dueños tienen control total sobre orders" ON orders
  USING ((SELECT public.is_owner()));
ALTER POLICY "Drivers ven sus propias ordenes" ON orders
  USING (driver_id = (SELECT auth.uid()));

-- customers
ALTER POLICY "Dueño lee y escribe customers" ON customers
  USING ((SELECT public.is_owner()));
ALTER POLICY "Drivers ven clientes de sus ordenes" ON customers
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.customer_id = customers.id
      AND orders.driver_id = (SELECT auth.uid())
  ));

-- order_items
ALTER POLICY "Dueños tienen control total sobre order items" ON order_items
  USING ((SELECT public.is_owner()));
ALTER POLICY "Drivers ven items de sus ordenes" ON order_items
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND orders.driver_id = (SELECT auth.uid())
  ));

-- order_status_history
ALTER POLICY "Dueños tienen control total sobre history" ON order_status_history
  USING ((SELECT public.is_owner()));
ALTER POLICY "Drivers ven history de sus ordenes" ON order_status_history
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_status_history.order_id
      AND orders.driver_id = (SELECT auth.uid())
  ));
-- Esta es FOR INSERT: sólo tiene WITH CHECK, no USING.
ALTER POLICY "Drivers pueden insertar en history" ON order_status_history
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_status_history.order_id
      AND orders.driver_id = (SELECT auth.uid())
  ));

-- profiles, products, neighborhoods, notifications_log
ALTER POLICY "Solo owner puede crear/modificar perfiles" ON profiles
  USING ((SELECT public.is_owner()));
ALTER POLICY "Solo owner puede administrar productos" ON products
  USING ((SELECT public.is_owner()));
ALTER POLICY "Solo owner puede administrar barrios" ON neighborhoods
  USING ((SELECT public.is_owner()));
ALTER POLICY "Solo el dueño lee el log de notificaciones" ON notifications_log
  USING ((SELECT public.is_owner()));


-- ----------------------------------------------------------------------------
-- 3. Índice parcial para el conjunto vivo
-- ----------------------------------------------------------------------------
-- El Kanban pide los pedidos que NO están entregados ni cancelados. El índice
-- que había, (status, created_at DESC), sirve para igualdad sobre status; con
-- dos desigualdades no ayuda, y se acababa recorriendo el histórico entero para
-- encontrar los pedidos del día.
--
-- Un índice parcial contiene sólo el conjunto vivo y se poda solo: un pedido
-- sale de él en cuanto se entrega. No crece con el histórico.
CREATE INDEX IF NOT EXISTS idx_orders_activos
  ON orders (created_at)
  WHERE status NOT IN ('entregado', 'cancelado');


-- ----------------------------------------------------------------------------
-- 4. Purga de lo desechable
-- ----------------------------------------------------------------------------
-- catalog_sessions, notifications_log y la cola de respuestas de pg_net crecen
-- sin techo y a nadie le importan pasados unos días. No había ni un DELETE
-- programado en las 29 migraciones anteriores.
--
-- La lógica vive en una función —testeable, invocable a mano— y el planificador
-- se ata aparte, porque pg_cron no está disponible en todos los entornos (ni en
-- el Postgres efímero de los tests). Separarlos hace que la migración se aplique
-- igual en los dos sitios.
CREATE OR REPLACE FUNCTION public.purge_ephemeral_data()
RETURNS TABLE (tabla TEXT, filas_borradas BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_n BIGINT;
BEGIN
  DELETE FROM catalog_sessions WHERE expires_at < now() - INTERVAL '7 days';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  tabla := 'catalog_sessions'; filas_borradas := v_n; RETURN NEXT;

  DELETE FROM notifications_log WHERE created_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  tabla := 'notifications_log'; filas_borradas := v_n; RETURN NEXT;

  -- pg_net puede no estar instalado (entorno de test) o no haber creado aún su
  -- tabla de respuestas. to_regclass devuelve NULL en vez de fallar.
  IF to_regclass('net._http_response') IS NOT NULL THEN
    EXECUTE 'DELETE FROM net._http_response WHERE created < now() - INTERVAL ''3 days''';
    GET DIAGNOSTICS v_n = ROW_COUNT;
  ELSE
    v_n := 0;
  END IF;
  tabla := 'net._http_response'; filas_borradas := v_n; RETURN NEXT;
END;
$$;

-- Sólo la ejecuta el backend. Ni el catálogo ni el panel tienen por qué borrar.
REVOKE ALL ON FUNCTION public.purge_ephemeral_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_ephemeral_data() TO service_role;

-- Planificación diaria a las 04:00. Si pg_cron no está habilitado, la migración
-- NO falla: avisa y deja la función lista para atarla después.
--
--   Para habilitarlo en Supabase: Dashboard -> Database -> Extensions -> pg_cron.
--   Después basta con volver a lanzar esta migración, que es idempotente.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purga-diaria')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purga-diaria');
    PERFORM cron.schedule('purga-diaria', '0 4 * * *',
                          'SELECT public.purge_ephemeral_data()');
    RAISE NOTICE 'Center Gas: purga diaria programada a las 04:00.';
  ELSE
    RAISE WARNING 'Center Gas: pg_cron no esta habilitado, la purga NO quedo programada. La funcion public.purge_ephemeral_data() ya existe y se puede invocar a mano. Para automatizarla: Dashboard -> Database -> Extensions -> pg_cron, y relanzar esta migracion.';
  END IF;
END $$;
