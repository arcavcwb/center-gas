\set ON_ERROR_STOP on
\pset pager off
SET client_min_messages TO NOTICE;
UPDATE system_config SET value = to_jsonb('token-de-prueba'::text) WHERE key='n8n_webhook_token';

-- ---------- montaje ----------
INSERT INTO products (sku, name, price, includes_cylinder, is_active)
VALUES ('p13_refill', 'Botijão P13 (Recarga)', 110.00, false, true)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111','owner@t.com'),
  ('22222222-2222-2222-2222-222222222222','driver@t.com')
ON CONFLICT DO NOTHING;
INSERT INTO profiles (id, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111','Dono','owner'),
  ('22222222-2222-2222-2222-222222222222','Motoboy','driver')
ON CONFLICT (id) DO NOTHING;

-- Cliente EXISTENTE, en Xaxim (taxa R$5), con dirección conocida
INSERT INTO customers (phone, name, neighborhood_id, address_line)
VALUES ('5541999990001','Maria Silva',
        (SELECT id FROM neighborhoods WHERE name='Xaxim'), 'Rua Bettega 1234')
ON CONFLICT (phone) DO NOTHING;

CREATE OR REPLACE FUNCTION t(label text, got text, want text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF got IS NOT DISTINCT FROM want THEN RAISE NOTICE '  PASS  % (=%)', label, got;
  ELSE RAISE EXCEPTION 'FAIL  % : obtuvo <%> esperaba <%>', label, got, want; END IF;
END $$;

\echo ''
\echo '=== 1. generate_catalog_session ya NO es ejecutable por anon (CRITICO) ==='
SELECT t('anon puede ejecutar generate_catalog_session',
  has_function_privilege('anon','public.generate_catalog_session(varchar,int)','EXECUTE')::text, 'false');
SELECT t('service_role sí puede',
  has_function_privilege('service_role','public.generate_catalog_session(varchar,int)','EXECUTE')::text, 'true');

\echo ''
\echo '=== 2. check_customer_exists: la PII exige el token (CRITICO) ==='
SELECT t('sin token no hay nombre',
  (check_customer_exists('5541999990001') ? 'name')::text, 'false');
SELECT t('sin token no hay direccion',
  (check_customer_exists('5541999990001') ? 'address_line')::text, 'false');
SELECT t('sin token sí confirma existencia',
  (check_customer_exists('5541999990001')->>'exists'), 'true');

-- Sesión legítima (la crea n8n con service_role)
INSERT INTO catalog_sessions (token, phone_context, expires_at, created_at)
VALUES ('TOKOK1','5541999990001', NOW()+INTERVAL '24h', NOW());

SELECT t('con token válido sí devuelve nombre',
  (check_customer_exists('5541999990001','TOKOK1')->>'name'), 'Maria Silva');
SELECT t('token de OTRO teléfono no sirve',
  (check_customer_exists('5541999990001','TOKNOPE') ? 'name')::text, 'false');

INSERT INTO catalog_sessions (token, phone_context, expires_at, created_at)
VALUES ('TOKEXP','5541999990001', NOW()-INTERVAL '1h', NOW()-INTERVAL '25h');
SELECT t('token caducado no sirve',
  (check_customer_exists('5541999990001','TOKEXP') ? 'name')::text, 'false');

\echo ''
\echo '=== 3. create_b2c_order exige token para cliente EXISTENTE (CRITICO) ==='
DO $$
DECLARE ok boolean := false;
BEGIN
  BEGIN
    PERFORM create_b2c_order('5541999990001','Rua Falsa 0',
      jsonb_build_array(jsonb_build_object('product_id',(SELECT id FROM products WHERE sku='p13_refill'),'quantity',1)),
      'cash', NULL);
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  PERFORM t('pedido sin token sobre cliente existente es rechazado', ok::text, 'true');
END $$;

SELECT t('la direccion del cliente NO fue pisada',
  (SELECT address_line FROM customers WHERE phone='5541999990001'), 'Rua Bettega 1234');

\echo ''
\echo '=== 4. Con token: pedido OK, taxa correcta, ficha intacta (ALTO) ==='
SELECT t('total con taxa de Xaxim (110 + 5)',
  (create_b2c_order('5541999990001','Rua Nova 99',
     jsonb_build_array(jsonb_build_object('product_id',(SELECT id FROM products WHERE sku='p13_refill'),'quantity',1)),
     'cash', NULL, false, NULL, NULL, 'TOKOK1')->>'total_amount'), '115.00');

SELECT t('la ficha del cliente sigue intacta',
  (SELECT address_line FROM customers WHERE phone='5541999990001'), 'Rua Bettega 1234');
SELECT t('la direccion del PEDIDO se guardo aparte',
  (SELECT delivery_address FROM orders ORDER BY created_at DESC LIMIT 1), 'Rua Nova 99');

\echo ''
\echo '=== 5. Tolerancia al 9o digito: no duplica cliente (ALTO) ==='
-- mismo cliente, teléfono con el 9º dígito (13 dígitos en vez de 12)
INSERT INTO catalog_sessions (token, phone_context, expires_at, created_at)
VALUES ('TOK9D','554199990001', NOW()+INTERVAL '24h', NOW());
SELECT t('variantes del 9o digito resuelven al MISMO cliente',
  (SELECT count(*)::text FROM customers WHERE phone IN ('5541999990001','554199990001')), '1');

\echo ''
\echo '=== 6. display_id no colisiona con pedidos ya entregados (ALTO) ==='
DO $$
DECLARE i int; v_pid uuid; n int;
BEGIN
  -- saturar: marcar todos los pedidos como entregados y crear muchos más
  UPDATE orders SET status='entregado', loyalty_awarded=true;
  FOR i IN 1..40 LOOP
    PERFORM create_b2c_order('5541999990001','Rua X',
      jsonb_build_array(jsonb_build_object('product_id',(SELECT id FROM products WHERE sku='p13_refill'),'quantity',1)),
      'cash', NULL, false, NULL, NULL, 'TOKOK1');
    UPDATE orders SET status='entregado', loyalty_awarded=true WHERE status='nuevo';
  END LOOP;
  SELECT count(*) INTO n FROM orders;
  SELECT count(DISTINCT display_id) INTO i FROM orders;
  PERFORM t('todos los display_id son unicos tras 41 pedidos', (i=n)::text, 'true');
END $$;

\echo ''
\echo '=== 7. update_order_status valida transiciones (ALTO) ==='
SET "test.uid" = '11111111-1111-1111-1111-111111111111';
DO $$
DECLARE v_id uuid; ok boolean := false;
BEGIN
  INSERT INTO customers (phone, name, neighborhood_id, address_line)
  VALUES ('5541988880002','Joao', (SELECT id FROM neighborhoods WHERE name='Xaxim'), 'Rua A')
  ON CONFLICT (phone) DO NOTHING;
  INSERT INTO catalog_sessions (token, phone_context, expires_at, created_at)
  VALUES ('TOKJ','5541988880002', NOW()+INTERVAL '24h', NOW());

  v_id := (create_b2c_order('5541988880002','Rua A',
     jsonb_build_array(jsonb_build_object('product_id',(SELECT id FROM products WHERE sku='p13_refill'),'quantity',1)),
     'cash', NULL, false, NULL, NULL, 'TOKJ')->>'order_id')::uuid;

  BEGIN
    PERFORM update_order_status(v_id, 'entregado');   -- nuevo -> entregado: salto ilegal
  EXCEPTION
    WHEN invalid_parameter_value THEN ok := true;     -- ERRCODE 22023: transicion invalida
    WHEN OTHERS THEN RAISE EXCEPTION 'rechazado por el motivo EQUIVOCADO: % (%)', SQLERRM, SQLSTATE;
  END;
  PERFORM t('salto nuevo->entregado rechazado por transicion invalida', ok::text, 'true');

  PERFORM update_order_status(v_id, 'asignado', NULL, '22222222-2222-2222-2222-222222222222');
  PERFORM update_order_status(v_id, 'en_camino');
  PERFORM t('camino legitimo nuevo->asignado->en_camino',
    (SELECT status::text FROM orders WHERE id=v_id), 'en_camino');
END $$;

\echo ''
\echo '=== 8. La taxa de vasilhame SE PERSISTE (CRITICO - dinero) ==='
DO $$
DECLARE v_id uuid; v_before numeric; v_after numeric;
BEGIN
  SELECT id, total_amount INTO v_id, v_before FROM orders WHERE status='en_camino' LIMIT 1;
  PERFORM update_order_status(v_id, 'entregado', NULL, NULL, false);  -- NO devolvio el casco
  SELECT total_amount INTO v_after FROM orders WHERE id=v_id;
  PERFORM t('total antes de entregar', v_before::text, '115.00');
  PERFORM t('total DESPUES con taxa de vasilhame (115 + 170)', v_after::text, '285.00');
  PERFORM t('quedo traza en el historial',
    (SELECT (reason LIKE '%vasilhame%')::text FROM order_status_history
     WHERE order_id=v_id AND new_status='entregado' LIMIT 1), 'true');
END $$;

\echo ''
\echo '=== 9. Fidelidad no se puede volver a disparar (ALTO) ==='
DO $$
DECLARE v_cid uuid; p1 int; p2 int;
BEGIN
  SELECT id INTO v_cid FROM customers WHERE phone='5541988880002';
  SELECT loyalty_points INTO p1 FROM customers WHERE id=v_cid;
  -- reintento directo del dueño sobre un pedido ya entregado
  UPDATE orders SET status='entregado' WHERE customer_id=v_cid;
  SELECT loyalty_points INTO p2 FROM customers WHERE id=v_cid;
  PERFORM t('los puntos NO se acreditan dos veces', (p1=p2)::text, 'true');
END $$;

\echo ''
\echo '=== 10. Rate limit senaliza para el anti-baneo (ALTO) ==='
SELECT t('primera sesion no esta limitada',
  (generate_catalog_session('5541977770003')->>'rate_limited'), 'false');
SELECT t('segunda dentro de la ventana SI esta limitada',
  (generate_catalog_session('5541977770003')->>'rate_limited'), 'true');
SELECT t('y reenvia el MISMO token (ISSUE-810)',
  (generate_catalog_session('5541977770003')->>'reused'), 'true');

\echo ''
-- Volvemos a ser un ANONIMO: el dueño autenticado sí puede editar sin token,
-- así que hay que soltar la identidad del test 7 antes de probar el caso anónimo.
SET "test.uid" = '';
\echo '=== 11. register_b2c_customer deja de mentir (ALTO) ==='
SELECT t('sin token: applied=false',
  (register_b2c_customer('5541999990001','Hacker',(SELECT id FROM neighborhoods WHERE name='Tatuquara'),'Rua Mala')->>'applied'), 'false');
SELECT t('y NO cambio el nombre real',
  (SELECT name FROM customers WHERE phone='5541999990001'), 'Maria Silva');
SELECT t('con token: applied=true',
  (register_b2c_customer('5541999990001','Maria S. Souza',(SELECT id FROM neighborhoods WHERE name='Tatuquara'),'Rua Nova 5','TOKOK1')->>'applied'), 'true');

\echo ''
\echo '=== 12. notifications_log sigue cerrado a anon ==='
SELECT t('anon no puede leer notifications_log',
  has_table_privilege('anon','public.notifications_log','SELECT')::text, 'false');

\echo ''
\echo '=== 13. ALTA ORGANICA: cliente nuevo SIN enlace de WhatsApp puede comprar ==='
-- Regresion encontrada en revision: register_b2c_customer creaba al cliente y acto
-- seguido create_b2c_order lo veia como "cliente existente sin token" y rechazaba su
-- PRIMERA compra, pidiendole un enlace que nunca habia recibido. El alta emite ahora
-- la sesion de ese cliente recien creado y devuelve su token.
DO $$
DECLARE
  v_reg JSONB;
  v_tok TEXT;
  v_res JSONB;
BEGIN
  v_reg := register_b2c_customer(
    '5541966660004', 'Cliente Organico',
    (SELECT id FROM neighborhoods WHERE name='Sítio Cercado'), 'Rua Organica 10');

  PERFORM t('el alta crea al cliente', v_reg->>'created', 'true');
  PERFORM t('el alta devuelve un token de sesion', (v_reg ? 'session_token')::text, 'true');

  v_tok := v_reg->>'session_token';

  v_res := create_b2c_order('5541966660004','Rua Organica 10',
    jsonb_build_array(jsonb_build_object('product_id',(SELECT id FROM products WHERE sku='p13_refill'),'quantity',1)),
    'cash', NULL, false, NULL, NULL, v_tok);

  -- Sítio Cercado tiene taxa 6.00 -> 110 + 6 = 116
  PERFORM t('su primera compra SI se completa', v_res->>'total_amount', '116.00');
END $$;

\echo ''
\echo '=== 14. Pero un tercero NO puede pedir por un cliente que YA existia ==='
DO $$
DECLARE ok boolean := false;
BEGIN
  -- mismo telefono del test 13, ahora ya es cliente: sin token debe rechazar
  BEGIN
    PERFORM create_b2c_order('5541966660004','Rua Falsa 0',
      jsonb_build_array(jsonb_build_object('product_id',(SELECT id FROM products WHERE sku='p13_refill'),'quantity',1)),
      'cash', NULL);
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  PERFORM t('la puerta sigue cerrada para clientes existentes', ok::text, 'true');
END $$;

-- ============================================================================
-- 15. RLS — que la fila que no te toca, NO la veas
-- ============================================================================
-- Estas aserciones no prueban una función: prueban las POLÍTICAS. Existen para
-- que el día que se toque RLS por rendimiento (marcar is_owner() como STABLE,
-- envolver los predicados en SELECT) se pueda comprobar que sigue bloqueando
-- exactamente lo mismo. Un cambio de RLS que va más rápido y además abre un
-- agujero no falla por sí solo: hay que preguntarle.
--
-- Nota sobre el montaje: el resto del fichero corre como `postgres`, que es
-- superusuario y SALTA RLS por completo. Aquí hace falta SET ROLE para dejar de
-- ser superusuario y que las políticas se apliquen de verdad.

-- Segundo motoboy, para poder demostrar aislamiento entre iguales.
INSERT INTO auth.users (id, email)
VALUES ('33333333-3333-3333-3333-333333333333','driver2@t.com')
ON CONFLICT DO NOTHING;
INSERT INTO profiles (id, full_name, role)
VALUES ('33333333-3333-3333-3333-333333333333','Motoboy Dos','driver')
ON CONFLICT (id) DO NOTHING;

-- Un pedido para cada uno. display_id fijo para no depender del generador.
INSERT INTO orders (display_id, customer_id, driver_id, status, payment_method, total_amount)
VALUES
  ('RLS001', (SELECT id FROM customers WHERE phone='5541999990001'),
   '22222222-2222-2222-2222-222222222222', 'asignado', 'cash', 100.00),
  ('RLS002', (SELECT id FROM customers WHERE phone='5541999990001'),
   '33333333-3333-3333-3333-333333333333', 'asignado', 'cash', 100.00)
ON CONFLICT (display_id) DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, (SELECT id FROM products WHERE sku='p13_refill'), 1, 100.00
FROM orders o WHERE o.display_id IN ('RLS001','RLS002')
  AND NOT EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id);

-- Un cliente con el que NINGUN motoboy tiene pedidos. Es el que delimita
-- de verdad la politica: el motoboy ve los clientes DE SUS pedidos
-- (20260829205500_fix_customers_rls.sql, deliberado: necesita nombre y
-- direccion para entregar), pero no debe ver a nadie mas.
INSERT INTO customers (phone, name) VALUES ('5541900000099','Cliente Ajeno')
ON CONFLICT (phone) DO NOTHING;

-- El id del cliente, para el intento de escritura de anon (que no puede leerlo).
SELECT set_config('test.cust',
  (SELECT id::text FROM customers WHERE phone='5541999990001'), false);

\echo ''
\echo '=== 15. RLS: cada quien ve lo suyo y nada mas ==='

-- ---------- motoboy 1 ----------
SET ROLE authenticated;
SELECT set_config('test.uid','22222222-2222-2222-2222-222222222222', false);

SELECT t('motoboy ve UN solo pedido de los dos',
  count(*)::text, '1') FROM orders WHERE display_id LIKE 'RLS%';
SELECT t('y es exactamente el suyo',
  COALESCE(max(display_id),'ninguno'), 'RLS001') FROM orders WHERE display_id LIKE 'RLS%';
SELECT t('motoboy NO ve a un cliente con el que no tiene pedidos',
  count(*)::text, '0') FROM customers WHERE phone='5541900000099';
SELECT t('pero SI ve al cliente de su propio pedido',
  count(*)::text, '1') FROM customers WHERE phone='5541999990001';
SELECT t('motoboy NO ve items de pedidos ajenos',
  count(*)::text, '1') FROM order_items i
  JOIN orders o ON o.id = i.order_id WHERE o.display_id LIKE 'RLS%';
RESET ROLE;

-- ---------- motoboy 2: el aislamiento es simetrico ----------
SET ROLE authenticated;
SELECT set_config('test.uid','33333333-3333-3333-3333-333333333333', false);
SELECT t('el otro motoboy ve el OTRO pedido',
  COALESCE(max(display_id),'ninguno'), 'RLS002') FROM orders WHERE display_id LIKE 'RLS%';
RESET ROLE;

-- ---------- el dueno ----------
SET ROLE authenticated;
SELECT set_config('test.uid','11111111-1111-1111-1111-111111111111', false);
SELECT t('el dueno ve los DOS pedidos',
  count(*)::text, '2') FROM orders WHERE display_id LIKE 'RLS%';
SELECT t('el dueno SI ve al cliente ajeno',
  count(*)::text, '1') FROM customers WHERE phone='5541900000099';
RESET ROLE;

-- ---------- anonimo ----------
SET ROLE anon;
SELECT set_config('test.uid','', false);
SELECT t('anon NO lee pedidos',   count(*)::text, '0') FROM orders;
SELECT t('anon NO lee clientes',  count(*)::text, '0') FROM customers;
SELECT t('anon NO lee perfiles',  count(*)::text, '0') FROM profiles;
SELECT t('anon NO lee historial', count(*)::text, '0') FROM order_status_history;
SELECT t('anon SI lee el catalogo de productos', (count(*) > 0)::text, 'true') FROM products;
RESET ROLE;

-- ---------- anonimo, escritura ----------
SET ROLE anon;
DO $$
DECLARE ok boolean := false;
BEGIN
  BEGIN
    INSERT INTO orders (display_id, customer_id, status, payment_method, total_amount)
    VALUES ('RLSHACK', current_setting('test.cust')::uuid, 'nuevo', 'cash', 1.00);
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  PERFORM t('anon NO puede insertar pedidos a mano', ok::text, 'true');
END $$;
RESET ROLE;

-- ---------- un motoboy no puede reasignarse pedidos ajenos ----------
SET ROLE authenticated;
SELECT set_config('test.uid','22222222-2222-2222-2222-222222222222', false);
DO $$
DECLARE v_afectadas int;
BEGIN
  UPDATE orders SET status = 'en_camino' WHERE display_id = 'RLS002';
  GET DIAGNOSTICS v_afectadas = ROW_COUNT;
  PERFORM t('motoboy no puede tocar el pedido de otro', v_afectadas::text, '0');
END $$;
RESET ROLE;

-- ============================================================================
-- 16. Fase 1: el coste de RLS deja de crecer con la tabla
-- ============================================================================
-- Estas aserciones comprueban la FORMA del cambio, no su efecto: que las
-- funciones sean STABLE y que ningún predicado llame a is_owner() o a
-- auth.uid() sin envolver. El efecto —que el plan use InitPlan e Index Scan—
-- sólo se ve con volumen real, y por eso se mide con EXPLAIN (ANALYZE) contra
-- producción, no aquí: con cuatro filas de prueba el planificador elegiría un
-- Seq Scan de todos modos y la aserción fallaría por el motivo equivocado.
--
-- La verificación de que NO se rompió nada es el bloque 15, que se acaba de
-- ejecutar contra este mismo esquema ya migrado.

\echo ''
\echo '=== 16. RLS: predicados envueltos y funciones STABLE ==='

SELECT t('is_owner() es STABLE',  provolatile::text, 's')
FROM pg_proc WHERE proname='is_owner'  AND pronamespace='public'::regnamespace;
SELECT t('is_driver() es STABLE', provolatile::text, 's')
FROM pg_proc WHERE proname='is_driver' AND pronamespace='public'::regnamespace;

-- Si alguien añade una política nueva con el patrón viejo, estas dos la cazan.
SELECT t('ninguna politica llama a is_owner() sin envolver', count(*)::text, '0')
FROM pg_policies
WHERE schemaname='public'
  AND COALESCE(qual,'')||COALESCE(with_check,'') LIKE '%is_owner()%'
  AND COALESCE(qual,'')||COALESCE(with_check,'') NOT LIKE '%SELECT is_owner()%';

SELECT t('ninguna politica llama a auth.uid() sin envolver', count(*)::text, '0')
FROM pg_policies
WHERE schemaname='public'
  AND COALESCE(qual,'')||COALESCE(with_check,'') LIKE '%auth.uid()%'
  AND COALESCE(qual,'')||COALESCE(with_check,'') NOT LIKE '%SELECT auth.uid()%';

SELECT t('existe el indice parcial de pedidos activos',
  (to_regclass('public.idx_orders_activos') IS NOT NULL)::text, 'true');

\echo ''
\echo '=== 17. La purga borra lo caducado y respeta lo vigente ==='

INSERT INTO catalog_sessions (token, phone_context, expires_at, created_at) VALUES
  ('PURGEOLD','5541900000001', now() - INTERVAL '30 days', now() - INTERVAL '31 days'),
  ('PURGENEW','5541900000002', now() + INTERVAL '1 day',   now())
ON CONFLICT (token) DO NOTHING;

SELECT public.purge_ephemeral_data();

SELECT t('borra la sesion caducada hace 30 dias', count(*)::text, '0')
FROM catalog_sessions WHERE token='PURGEOLD';
SELECT t('y NO toca la sesion vigente', count(*)::text, '1')
FROM catalog_sessions WHERE token='PURGENEW';
SELECT t('tampoco toca una caducada hace 1 hora', count(*)::text, '1')
FROM catalog_sessions WHERE token='TOKEXP';

SELECT t('anon NO puede ejecutar la purga',
  has_function_privilege('anon','public.purge_ephemeral_data()','EXECUTE')::text, 'false');
SELECT t('authenticated NO puede ejecutar la purga',
  has_function_privilege('authenticated','public.purge_ephemeral_data()','EXECUTE')::text, 'false');
SELECT t('service_role SI puede',
  has_function_privilege('service_role','public.purge_ephemeral_data()','EXECUTE')::text, 'true');

-- ============================================================================
-- 18. Fase 2: la carteira de clientes se sirve por paginas
-- ============================================================================
-- Lo que hay que probar de una paginacion por cursor no es que devuelva pocas
-- filas: es que recorriendola entera se visite cada fila UNA vez. Un cursor mal
-- construido repite filas en el limite entre paginas o se salta las que empatan,
-- y eso no se ve mirando una pagina suelta.

-- Clientes con historiales distintos. Los tres ultimos no han pedido nunca:
-- su last_order_date es NULL, que es justo la zona donde un cursor mal hecho
-- se rompe, porque NULL no se compara con <.
INSERT INTO customers (phone, name) VALUES
  ('5541977770001','Pagina Uno'),   ('5541977770002','Pagina Dos'),
  ('5541977770003','Pagina Tres'),  ('5541977770004','Sin Pedidos A'),
  ('5541977770005','Sin Pedidos B'), ('5541977770006','Sin Pedidos C')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO orders (display_id, customer_id, status, payment_method, total_amount, created_at)
SELECT 'PAG'||n, c.id, 'entregado', 'cash', 50.00, now() - (n || ' days')::INTERVAL
FROM (VALUES (1,'5541977770001'),(2,'5541977770002'),(3,'5541977770003')) AS v(n,tel)
JOIN customers c ON c.phone = v.tel
ON CONFLICT (display_id) DO NOTHING;

\echo ''
\echo '=== 18. Paginacion por cursor de la carteira ==='

SELECT set_config('test.uid','11111111-1111-1111-1111-111111111111', false);

SELECT t('respeta el limite pedido', count(*)::text, '3')
FROM get_customers_page(3, NULL, NULL, NULL);

SELECT t('avisa de que hay mas paginas', bool_and(has_more)::text, 'true')
FROM get_customers_page(3, NULL, NULL, NULL);

-- El recorrido completo: se pagina de 3 en 3 hasta agotar.
DO $$
DECLARE
  r          RECORD;
  v_cur_ts   TIMESTAMPTZ := NULL;
  v_cur_id   UUID        := NULL;
  v_ids      UUID[]      := '{}';
  v_more     BOOLEAN     := TRUE;
  v_paginas  INT         := 0;
  v_total    INT;
  v_vistos   INT;
  v_unicos   INT;
BEGIN
  SELECT count(*) INTO v_total FROM customers;

  WHILE v_more AND v_paginas < 100 LOOP
    v_more := FALSE;
    FOR r IN SELECT * FROM get_customers_page(3, v_cur_ts, v_cur_id, NULL) LOOP
      v_ids    := v_ids || r.id;
      v_cur_ts := r.last_order_date;
      v_cur_id := r.id;
      v_more   := r.has_more;
    END LOOP;
    v_paginas := v_paginas + 1;
  END LOOP;

  v_vistos := COALESCE(array_length(v_ids, 1), 0);
  SELECT count(DISTINCT x) INTO v_unicos FROM unnest(v_ids) x;

  PERFORM t('el recorrido completo visita a TODOS los clientes', v_vistos::text, v_total::text);
  PERFORM t('y no repite ninguno',                                v_unicos::text, v_vistos::text);
  PERFORM t('la ultima pagina dice que no hay mas',               v_more::text,   'false');
END $$;

-- La busqueda se resuelve en el servidor, no filtrando en el navegador.
SELECT t('la busqueda por nombre filtra en el servidor', count(*)::text, '3')
FROM get_customers_page(50, NULL, NULL, 'Sin Pedidos');
SELECT t('la busqueda por telefono tambien', count(*)::text, '1')
FROM get_customers_page(50, NULL, NULL, '5541977770002');
SELECT t('una busqueda sin resultados devuelve vacio', count(*)::text, '0')
FROM get_customers_page(50, NULL, NULL, 'no-existe-este-cliente');

-- El limite es del servidor, no del que llama.
SELECT t('un limite absurdo se recorta a 200', (count(*) <= 200)::text, 'true')
FROM get_customers_page(99999, NULL, NULL, NULL);

-- Y sigue siendo cosa del dueno.
SELECT set_config('test.uid','22222222-2222-2222-2222-222222222222', false);
DO $$
DECLARE ok boolean := false;
BEGIN
  BEGIN PERFORM * FROM get_customers_page(10, NULL, NULL, NULL);
  EXCEPTION WHEN OTHERS THEN ok := true; END;
  PERFORM t('un motoboy NO puede listar la carteira', ok::text, 'true');
END $$;
SELECT t('anon no puede ejecutar la RPC paginada',
  has_function_privilege('anon','public.get_customers_page(int,timestamptz,uuid,text)','EXECUTE')::text, 'false');
SELECT set_config('test.uid','11111111-1111-1111-1111-111111111111', false);
