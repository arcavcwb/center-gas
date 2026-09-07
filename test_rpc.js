const path = require('path');
module.paths.push(path.resolve(__dirname, 'apps/web/node_modules'));
const { createClient } = require('@supabase/supabase-js');

const anonSupabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_ANON_KEY);
const adminSupabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEST_PHONE = '5541999999999';

async function testRpc() {
  let createdOrderIds = [];

  try {
    console.log('🧪 Iniciando prueba de RPC create_b2c_order y Descuento de Combo...');

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
      p_cash_change_for: 200
    };

    console.log('📦 Enviando pedido con Combo (Gas + Agua)...');
    const { data: orderId, error: rpcErr } = await anonSupabase.rpc('create_b2c_order', comboPayload);

    if (rpcErr) {
      throw new Error(`RPC Error al crear orden: ${rpcErr.message}`);
    }

    createdOrderIds.push(orderId);
    console.log(`✓ Orden creada con ID: ${orderId}`);

    // 3. Validar cálculo del combo en la base de datos (Zero-Trust)
    const { data: order, error: orderErr } = await adminSupabase
      .from('orders')
      .select('id, total_amount, discount_applied, status, payment_method')
      .eq('id', orderId)
      .single();

    if (orderErr) throw orderErr;

    const expectedSubtotal = Number(gasProduct.price) + Number(waterProduct.price);
    const expectedDiscount = 5.00;
    const expectedTotal = expectedSubtotal - expectedDiscount;

    console.log(`📊 Validación Financiera: Subtotal R$ ${expectedSubtotal.toFixed(2)} | Descuento BD: R$ ${Number(order.discount_applied).toFixed(2)} | Total BD: R$ ${Number(order.total_amount).toFixed(2)}`);

    if (Number(order.discount_applied) !== expectedDiscount) {
      throw new Error(`Descuento esperado R$ ${expectedDiscount}, pero se obtuvo R$ ${order.discount_applied}`);
    }

    if (Number(order.total_amount) !== expectedTotal) {
      throw new Error(`Total esperado R$ ${expectedTotal}, pero se obtuvo R$ ${order.total_amount}`);
    }

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
      p_is_scheduled: true,
      p_scheduled_for: scheduledDateIso
    };

    const { data: schedOrderId, error: schedRpcErr } = await anonSupabase.rpc('create_b2c_order', scheduledPayload);
    if (schedRpcErr) {
      throw new Error(`RPC Error al crear orden programada: ${schedRpcErr.message}`);
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
    await adminSupabase.from('customers').delete().eq('phone', TEST_PHONE);
    console.log('✨ Base de datos restaurada a estado limpio (0 residuos).');
  }
}

testRpc();
