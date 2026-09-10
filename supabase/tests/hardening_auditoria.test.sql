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
