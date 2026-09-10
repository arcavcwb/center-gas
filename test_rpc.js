// =============================================================================
// ⚠️  AVISO DE RIESGO — SCRIPT DESTRUCTIVO
// =============================================================================
// Este test NO es de sólo lectura: crea pedidos reales y una sesión de catálogo
// y, en el bloque `finally`, borra con la service_role key filas de orders,
// order_items, order_status_history, catalog_sessions y del cliente con el
// teléfono de prueba en la base de datos a la que apunte.
//
// Históricamente se ejecutaba contra el proyecto Supabase de PRODUCCIÓN. Eso es
// peligroso: si el teléfono de prueba coincide con el de un cliente real, se
// borra su ficha.
//
// LO CORRECTO es apuntarlo a un proyecto Supabase de STAGING (variables
// PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY del entorno de staging) y
// nunca al de producción. Por eso el script exige la confirmación explícita
// ALLOW_DESTRUCTIVE_TEST=1 antes de arrancar.
// =============================================================================

const path = require('path');
module.paths.push(path.resolve(__dirname, 'apps/web/node_modules'));
const { createClient } = require('@supabase/supabase-js');

// Guarda anti-desastre: sin confirmación explícita el script no arranca.
if (process.env.ALLOW_DESTRUCTIVE_TEST !== '1') {
  console.error('\n❌ ABORTADO: este script es DESTRUCTIVO.');
  console.error('   Borra filas reales (orders, order_items, order_status_history,');
  console.error('   catalog_sessions y el cliente con el teléfono de prueba) de la base de');
  console.error('   datos a la que apunten PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  console.error('   Verifica que NO estás apuntando a producción: usa un proyecto Supabase de');
  console.error('   staging. Cuando estés seguro, ejecútalo así:');
  console.error('     ALLOW_DESTRUCTIVE_TEST=1 node test_rpc.js\n');
  process.exit(1);
}

/**
 * Devuelve el valor de una variable de entorno obligatoria.
 * Si falta, aborta ruidosamente: nunca se usa un valor por defecto para un
 * secreto, porque un default silencioso solo consigue que el script parezca
 * funcionar mientras habla con el sitio equivocado.
 */
function envObligatoria(nombre, pista = '') {
  const valor = (process.env[nombre] || '').trim();
  if (!valor) {
    console.error(`\n❌ ERROR: falta la variable de entorno obligatoria ${nombre}.`);
    console.error(`   Defínela antes de ejecutar este script, por ejemplo:`);
    console.error(`     export ${nombre}="<valor-real>"`);
    if (pista) console.error(`   ${pista}`);
    process.exit(1);
  }
  return valor;
}

// Secretos: obligatorios por entorno, nunca en el repositorio (es público).
const SUPABASE_URL = envObligatoria(
  'PUBLIC_SUPABASE_URL',
  'URL del proyecto Supabase de STAGING contra el que quieres correr el test.'
);
const SUPABASE_ANON_KEY = envObligatoria(
  'PUBLIC_SUPABASE_ANON_KEY',
  'Supabase > Project Settings > API > anon/public.'
);
const SUPABASE_SERVICE_ROLE_KEY = envObligatoria(
  'SUPABASE_SERVICE_ROLE_KEY',
  'Supabase > Project Settings > API > service_role. NO es la anon key.'
);

const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Teléfono de siembra para el cliente de prueba: NO es un secreto, pero sus filas
// se borran al final, así que debe ser un número ficticio bajo tu control.
const TEST_PHONE = process.env.TEST_PHONE || '5541999999999';

// El dinero se compara en centavos enteros: la aritmética binaria de JS
// (0,1 + 0,2 !== 0,3) no puede decidir si una cuenta en reales cuadra.
const centavos = (valor) => Math.round(Number(valor) * 100);

/**
 * Afirmación dura sobre un importe. Si no coincide lanza, y como el `catch` del
 * test pone process.exitCode = 1, el script termina con código distinto de 0.
 */
function afirmarImporte(etiqueta, obtenido, esperado) {
  if (centavos(obtenido) !== centavos(esperado)) {
    throw new Error(
      `${etiqueta}: se esperaba R$ ${Number(esperado).toFixed(2)} pero se obtuvo R$ ${Number(obtenido).toFixed(2)}`
    );
  }
}

async function testRpc() {
  let createdOrderIds = [];

  try {
    console.log('🧪 Iniciando prueba de RPC create_b2c_order y Descuento de Combo...');

    // 0. Prueba de posesión del teléfono (hardening de la auditoría integral)
    //    create_b2c_order ya no acepta un teléfono que pertenezca a un cliente
    //    existente sin el token de la sesión de catálogo, que es el que llega por
    //    WhatsApp al número real. Como generate_catalog_session está REVOCADA para
    //    anon, el token se acuña con la service_role key, igual que hace n8n WF-01.
    const { data: sessionData, error: sessionErr } = await adminSupabase.rpc('generate_catalog_session', {
      p_phone: TEST_PHONE,
      p_rate_limit_minutes: 10
    });

    if (sessionErr || !sessionData?.token) {
      throw new Error(`No se pudo generar la sesión de catálogo para ${TEST_PHONE}: ${sessionErr?.message || JSON.stringify(sessionData)}`);
    }

    const sessionToken = sessionData.token;
    console.log(`🔐 Token de sesión de catálogo obtenido con service_role: ${sessionToken}`);

    // 1. Obtener productos activos
    const { data: products, error: prodErr } = await adminSupabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (prodErr || !products || products.length === 0) {
      throw new Error(`Error obteniendo productos: ${prodErr?.message || 'No hay productos activos'}`);
    }

    const gasProduct = products.find(p => p.sku.toLowerCase().includes('p13') || p.sku.toLowerCase().includes('gas'));
    const waterProduct = products.find(p => p.sku.toLowerCase().includes('water') || p.sku.toLowerCase().includes('agua'));

    if (!gasProduct || !waterProduct) {
      throw new Error('Se requiere al menos 1 producto de Gas y 1 de Agua para probar el combo.');
    }

    console.log(`✓ Productos detectados: Gas (${gasProduct.name}, R$ ${gasProduct.price}) y Agua (${waterProduct.name}, R$ ${waterProduct.price})`);

    // 2. Probar creación de orden con COMBO (1 Gas + 1 Agua)
    const comboPayload = {
      p_phone: TEST_PHONE,
      p_address_line: 'Rua Teste de Integracao, 100 - Curitiba',
      p_items: [
        { product_id: gasProduct.id, quantity: 1 },
        { product_id: waterProduct.id, quantity: 1 }
      ],
      p_payment_method: 'cash',
      p_cash_change_for: 200,
      p_session_token: sessionToken
    };

    console.log('📦 Enviando pedido con Combo (Gas + Agua)...');
    const { data: comboResult, error: rpcErr } = await anonSupabase.rpc('create_b2c_order', comboPayload);

    if (rpcErr) {
      throw new Error(`RPC Error al crear orden: ${rpcErr.message}`);
    }

    // create_b2c_order devuelve JSONB { order_id, id, display_id, delivery_fee, total_amount }.
    const orderId = comboResult?.order_id || comboResult?.id;
    if (!orderId) {
      throw new Error(`create_b2c_order no devolvió el id del pedido: ${JSON.stringify(comboResult)}`);
    }

    createdOrderIds.push(orderId);
    console.log(`✓ Orden creada con ID: ${orderId} (display_id: #${comboResult.display_id})`);

    // 3. Validar cálculo del combo en la base de datos (Zero-Trust)
    const { data: order, error: orderErr } = await adminSupabase
      .from('orders')
      .select('id, total_amount, delivery_fee, discount_applied, status, payment_method')
      .eq('id', orderId)
      .single();

    if (orderErr) throw orderErr;

    // Números explícitos: el test calcula lo que DEBE cobrarse y lo confronta con
    // lo que la RPC devolvió y con lo que quedó persistido. Antes se leía la fila
    // por el JSONB entero en lugar de por su order_id, así que la comparación
    // financiera nunca llegaba a ejecutarse sobre el pedido recién creado.
    // El cliente de prueba se da de alta sin barrio, así que su taxa es 0,00.
    const expectedSubtotal = Number(gasProduct.price) + Number(waterProduct.price);
    const expectedDiscount = 5.00;
    const expectedDeliveryFee = 0.00;
    const expectedTotal = expectedSubtotal + expectedDeliveryFee - expectedDiscount;

    console.log(`📊 Validación Financiera: Subtotal R$ ${expectedSubtotal.toFixed(2)} | Taxa esperada R$ ${expectedDeliveryFee.toFixed(2)} | Descuento esperado R$ ${expectedDiscount.toFixed(2)} | Total esperado R$ ${expectedTotal.toFixed(2)}`);
    console.log(`   RPC devolvió: taxa R$ ${Number(comboResult.delivery_fee).toFixed(2)} | total R$ ${Number(comboResult.total_amount).toFixed(2)} — BD: taxa R$ ${Number(order.delivery_fee).toFixed(2)} | descuento R$ ${Number(order.discount_applied).toFixed(2)} | total R$ ${Number(order.total_amount).toFixed(2)}`);

    afirmarImporte('Combo: descuento persistido en la BD', order.discount_applied, expectedDiscount);
    afirmarImporte('Combo: taxa de entrega devuelta por create_b2c_order', comboResult.delivery_fee, expectedDeliveryFee);
    afirmarImporte('Combo: taxa de entrega persistida en orders.delivery_fee', order.delivery_fee, expectedDeliveryFee);
    afirmarImporte('Combo: total devuelto por create_b2c_order', comboResult.total_amount, expectedTotal);
    afirmarImporte('Combo: total persistido en orders.total_amount', order.total_amount, expectedTotal);

    console.log('✅ REGLA BR-001 VERIFICADA: El descuento de R$ 5,00 se aplicó correctamente en la base de datos!');

    // 4. Probar creación de orden PROGRAMADA / FUERA DE HORARIO (ISSUE-703)
    console.log('🌙 Enviando pedido agendado fuera de horario (ISSUE-703)...');
    const scheduledDateIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const scheduledPayload = {
      p_phone: TEST_PHONE,
      p_address_line: 'Rua Teste de Integracao, 100 - Curitiba',
      p_items: [
        { product_id: gasProduct.id, quantity: 1 }
      ],
      p_payment_method: 'pix',
      // p_cash_change_for no tiene DEFAULT en la firma: omitirlo hace que
      // PostgREST no encuentre la función.
      p_cash_change_for: null,
      p_is_scheduled: true,
      p_scheduled_for: scheduledDateIso,
      p_session_token: sessionToken
    };

    const { data: schedResult, error: schedRpcErr } = await anonSupabase.rpc('create_b2c_order', scheduledPayload);
    if (schedRpcErr) {
      throw new Error(`RPC Error al crear orden programada: ${schedRpcErr.message}`);
    }

    const schedOrderId = schedResult?.order_id || schedResult?.id;
    if (!schedOrderId) {
      throw new Error(`create_b2c_order no devolvió el id de la orden programada: ${JSON.stringify(schedResult)}`);
    }

    createdOrderIds.push(schedOrderId);
    console.log(`✓ Orden programada creada con ID: ${schedOrderId}`);

    const { data: schedOrder, error: schedOrderErr } = await adminSupabase
      .from('orders')
      .select('id, is_scheduled, scheduled_for')
      .eq('id', schedOrderId)
      .single();

    if (schedOrderErr) throw schedOrderErr;

    if (!schedOrder.is_scheduled) {
      throw new Error(`Se esperaba is_scheduled = true, pero se obtuvo: ${schedOrder.is_scheduled}`);
    }

    if (!schedOrder.scheduled_for) {
      throw new Error('Se esperaba scheduled_for con fecha, pero se obtuvo nulo');
    }

    console.log(`✅ ISSUE-703 VERIFICADO: Pedido programado guardado correctamente con is_scheduled=true y scheduled_for=${schedOrder.scheduled_for}!`);

    // 5. Probar el COBRO DE LA TAXA DE ENTREGA del barrio elegido
    //    Regla de dinero que entró sin ninguna prueba: el cliente elige el barrio
    //    y el servidor lee la taxa de ESE barrio desde neighborhoods; nunca acepta
    //    un importe del cliente. Si esto se rompe, la entrega se cobra a 0,00.
    console.log('🚚 Enviando pedido a un barrio con taxa > 0 (verificación de la taxa de entrega)...');

    const { data: barriosConTaxa, error: neighErr } = await adminSupabase
      .from('neighborhoods')
      .select('id, name, delivery_fee')
      // Sólo barrios con cobertura: son los únicos que el catálogo ofrece
      // (apps/site/src/components/Catalog.tsx filtra por is_active), así que es
      // el único universo del que un cliente real puede elegir.
      .eq('is_active', true)
      .gt('delivery_fee', 0)
      .order('delivery_fee', { ascending: false })
      .limit(1);

    if (neighErr) throw neighErr;

    if (!barriosConTaxa || barriosConTaxa.length === 0) {
      throw new Error('No hay ningún barrio activo con delivery_fee > 0: sin él no se puede verificar el cobro de la taxa de entrega.');
    }

    const barrioConTaxa = barriosConTaxa[0];
    const feePayload = {
      p_phone: TEST_PHONE,
      p_address_line: 'Rua Teste de Integracao, 100 - Curitiba',
      p_items: [
        { product_id: gasProduct.id, quantity: 1 },
        { product_id: waterProduct.id, quantity: 1 }
      ],
      p_payment_method: 'pix',
      p_cash_change_for: null,
      p_neighborhood_id: barrioConTaxa.id,
      p_session_token: sessionToken
    };

    const { data: feeResult, error: feeRpcErr } = await anonSupabase.rpc('create_b2c_order', feePayload);
    if (feeRpcErr) {
      throw new Error(`RPC Error al crear orden con taxa de entrega: ${feeRpcErr.message}`);
    }

    const feeOrderId = feeResult?.order_id || feeResult?.id;
    if (!feeOrderId) {
      throw new Error(`create_b2c_order no devolvió el id de la orden con taxa: ${JSON.stringify(feeResult)}`);
    }

    createdOrderIds.push(feeOrderId);
    console.log(`✓ Orden con taxa creada con ID: ${feeOrderId} (barrio "${barrioConTaxa.name}", taxa de la tabla R$ ${Number(barrioConTaxa.delivery_fee).toFixed(2)})`);

    const { data: feeOrder, error: feeOrderErr } = await adminSupabase
      .from('orders')
      .select('id, total_amount, delivery_fee, discount_applied')
      .eq('id', feeOrderId)
      .single();

    if (feeOrderErr) throw feeOrderErr;

    const feeSubtotal = Number(gasProduct.price) + Number(waterProduct.price);
    const feeExpectedFee = Number(barrioConTaxa.delivery_fee);
    const feeExpectedDiscount = 5.00;
    const feeExpectedTotal = feeSubtotal + feeExpectedFee - feeExpectedDiscount;

    console.log(`📊 Validación de Taxa: Subtotal R$ ${feeSubtotal.toFixed(2)} + Taxa R$ ${feeExpectedFee.toFixed(2)} - Descuento R$ ${feeExpectedDiscount.toFixed(2)} = Total esperado R$ ${feeExpectedTotal.toFixed(2)}`);
    console.log(`   RPC devolvió: taxa R$ ${Number(feeResult.delivery_fee).toFixed(2)} | total R$ ${Number(feeResult.total_amount).toFixed(2)} — BD: taxa R$ ${Number(feeOrder.delivery_fee).toFixed(2)} | total R$ ${Number(feeOrder.total_amount).toFixed(2)}`);

    afirmarImporte(`Barrio "${barrioConTaxa.name}": taxa devuelta por create_b2c_order`, feeResult.delivery_fee, feeExpectedFee);
    afirmarImporte(`Barrio "${barrioConTaxa.name}": total devuelto por create_b2c_order`, feeResult.total_amount, feeExpectedTotal);
    afirmarImporte(`Barrio "${barrioConTaxa.name}": taxa persistida en orders.delivery_fee`, feeOrder.delivery_fee, feeExpectedFee);
    afirmarImporte(`Barrio "${barrioConTaxa.name}": total persistido en orders.total_amount`, feeOrder.total_amount, feeExpectedTotal);

    console.log(`✅ TAXA DE ENTREGA VERIFICADA: se cobró la taxa del barrio "${barrioConTaxa.name}" (R$ ${feeExpectedFee.toFixed(2)}), leída por el servidor desde neighborhoods!`);

  } catch (error) {
    console.error('❌ Error en test_rpc:', error.message || error);
    process.exitCode = 1;
  } finally {
    // 4. Limpieza Idempotente de datos de prueba
    console.log('🧹 Limpiando registros de prueba de Supabase...');
    for (const id of createdOrderIds) {
      await adminSupabase.from('order_items').delete().eq('order_id', id);
      await adminSupabase.from('order_status_history').delete().eq('order_id', id);
      await adminSupabase.from('orders').delete().eq('id', id);
    }
    // La sesión de catálogo acuñada al principio también es residuo del test, y
    // además referencia al cliente: hay que borrarla antes que a él.
    await adminSupabase.from('catalog_sessions').delete().eq('phone_context', TEST_PHONE);
    await adminSupabase.from('customers').delete().eq('phone', TEST_PHONE);
    console.log('✨ Base de datos restaurada a estado limpio (0 residuos).');
  }
}

testRpc();
