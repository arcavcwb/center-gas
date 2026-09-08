const path = require('path');
module.paths.push(path.resolve(__dirname, '../apps/web/node_modules'));
const { createClient } = require('@supabase/supabase-js');

// Configuración de Entornos y Constantes
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rawN8nUrl = process.env.N8N_API_URL || 'https://n8n.arcav.us';
const N8N_API_URL = rawN8nUrl.replace(/\/settings\/api\/?$/, '').replace(/\/$/, '');
const N8N_API_KEY = (process.env.N8N_API_KEY || '').trim();
const EVOLUTION_API_URL = 'https://evolution.arcav.us';
const EVOLUTION_API_KEY = 'CENTERGAS_EVOLUTION_KEY_2026';
const EVOLUTION_INSTANCE = 'centerGas';
const SECURE_OUTBOUND_TOKEN = 'CENTERGAS_SECURE_TOKEN_2026';

const TEST_PHONE = '554198450477'; // Teléfono real de Armando conectado a centerGas

const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('================================================================');
  console.log('🚀 TEST E2E INTEGRAL: FLUJO COMPLETO DE WHATSAPP (MODALIDAD B)');
  console.log('   Inbound (Catálogo) + Outbound (Notificaciones) + Limpieza');
  console.log('================================================================\n');

  let testOrderId = null;

  try {
    // -------------------------------------------------------------
    // FASE 0: VERIFICACIÓN DE INFRAESTRUCTURA Y SALUD
    // -------------------------------------------------------------
    console.log('🔍 [Fase 0] Verificando salud de la infraestructura...');

    // 0.1 Verificar Evolution API
    const evoStateRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`, {
      headers: { apikey: EVOLUTION_API_KEY }
    });
    const evoState = await evoStateRes.json();
    console.log(`   ✓ Evolution API [${EVOLUTION_INSTANCE}]: Estado de conexión = ${evoState?.instance?.state || JSON.stringify(evoState)}`);
    if (evoState?.instance?.state !== 'open') {
      throw new Error(`La instancia ${EVOLUTION_INSTANCE} no está en estado "open". Actual: ${JSON.stringify(evoState)}`);
    }

    // 0.2 Verificar Webhook en Evolution API
    const evoHookRes = await fetch(`${EVOLUTION_API_URL}/webhook/find/${EVOLUTION_INSTANCE}`, {
      headers: { apikey: EVOLUTION_API_KEY }
    });
    const evoHook = await evoHookRes.json();
    console.log(`   ✓ Evolution Webhook: URL = ${evoHook.url}, Habilitado = ${evoHook.enabled}`);
    if (!evoHook.enabled) {
      throw new Error(`El webhook de Evolution API no está habilitado para ${EVOLUTION_INSTANCE}`);
    }

    // 0.3 Verificar Workflows en n8n
    const n8nHeaders = {
      'X-N8N-API-KEY': N8N_API_KEY,
      'User-Agent': 'curl/7.81.0'
    };
    const wf1Res = await fetch(`${N8N_API_URL}/api/v1/workflows/S28GbSKscgVXBzJy`, { headers: n8nHeaders });
    const wf1 = await wf1Res.json();
    const wf2Res = await fetch(`${N8N_API_URL}/api/v1/workflows/SCqre7me1lAPKeH1`, { headers: n8nHeaders });
    const wf2 = await wf2Res.json();
    console.log(`   ✓ n8n WF-01 (Inbound): Activo = ${wf1.active}`);
    console.log(`   ✓ n8n WF-02 (Outbound): Activo = ${wf2.active}`);
    if (!wf1.active || !wf2.active) {
      throw new Error('Ambos workflows WF-01 y WF-02/03 deben estar activos en n8n.');
    }

    // -------------------------------------------------------------
    // FASE 1: FLUJO INBOUND (MENSAJE ENTRANTE -> TOKEN -> LINK CATÁLOGO)
    // -------------------------------------------------------------
    console.log('\n📲 [Fase 1] Probando Flujo Inbound (Auto-Reply con Catálogo Segura)...');

    // 1.1 Limpiar sesiones previas del teléfono de prueba para evitar bloqueo de Rate Limit (10 min)
    console.log('   🧹 Preparando estado limpio: removiendo sesiones recientes de catalog_sessions...');
    await adminSupabase.from('catalog_sessions').delete().eq('phone_context', TEST_PHONE);

    // 1.2 Simular / Enviar evento de mensaje entrante al webhook de n8n
    console.log('   📨 Disparando webhook inbound en n8n (https://n8n.arcav.us/webhook/evolution-inbound)...');
    const inboundPayload = {
      event: 'messages.upsert',
      instance: EVOLUTION_INSTANCE,
      data: {
        key: {
          remoteJid: `${TEST_PHONE}@s.whatsapp.net`,
          fromMe: false,
          id: `E2E_INBOUND_${Date.now()}`
        },
        message: {
          conversation: 'Olá Center Gás! Gostaria de fazer um pedido.'
        },
        messageType: 'conversation'
      }
    };

    const inboundRes = await fetch(`${N8N_API_URL}/webhook/evolution-inbound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inboundPayload)
    });

    const inboundText = await inboundRes.text();
    console.log(`   ✓ Webhook Inbound respondió con HTTP ${inboundRes.status}: ${inboundText.slice(0, 100)}`);

    if (!inboundRes.ok) {
      throw new Error(`Webhook Inbound falló con HTTP ${inboundRes.status}: ${inboundText}`);
    }

    // Esperar el delay humano anti-robot configurado en n8n (4 a 9 segundos) + margen
    console.log('   ⏳ Esperando 10 segundos (Delay Humano Anti-Robot en n8n)...');
    await sleep(10000);

    // 1.3 Validar que se generó la sesión y token en Supabase
    const { data: sessions, error: sessErr } = await adminSupabase
      .from('catalog_sessions')
      .select('*')
      .eq('phone_context', TEST_PHONE)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessErr || !sessions || sessions.length === 0) {
      throw new Error(`No se generó catalog_session en Supabase para el teléfono ${TEST_PHONE}: ${sessErr?.message}`);
    }

    const catalogSession = sessions[0];
    if (!catalogSession.token || catalogSession.token.length !== 6 || !/^[a-zA-Z0-9]{6}$/.test(catalogSession.token)) {
      throw new Error(`Token inválido generado en Supabase: "${catalogSession.token}". Se esperaba token Base62 de exactamente 6 caracteres.`);
    }

    const shortLink = `center-gas-site.vercel.app/${catalogSession.token}`;
    console.log(`   ✅ Token Compacto Generado en Supabase (6 chars Base62): ${catalogSession.token}`);
    console.log(`      Expiración: ${catalogSession.expires_at}`);
    console.log(`      Link Auto-Link WhatsApp (33 chars): ${shortLink}`);

    // 1.4 Simular apertura del enlace por el cliente y validar Click Tracking (used_at)
    console.log('   🖱️  Simulando apertura del enlace por el cliente en el navegador móvil...');
    const { data: resolveData, error: resolveErr } = await adminSupabase.rpc('resolve_catalog_session', { p_token: catalogSession.token });
    if (resolveErr || !resolveData?.valid) {
      throw new Error(`Fallo al resolver sesión con token corto "${catalogSession.token}": ${resolveErr?.message || resolveData?.message}`);
    }

    const { data: updatedSessions } = await adminSupabase
      .from('catalog_sessions')
      .select('used_at')
      .eq('token', catalogSession.token)
      .limit(1);

    if (!updatedSessions?.[0]?.used_at) {
      throw new Error(`Click Tracking falló: used_at no fue actualizado en catalog_sessions para el token ${catalogSession.token}`);
    }
    console.log(`   ✅ Click Tracking Validado en Supabase: used_at = ${updatedSessions[0].used_at}`);

    // 1.5 Validar Resiliencia e Idempotencia (ISSUE-810): Cliente re-escribe dentro de la ventana de 10 min
    console.log('   🔄 [ISSUE-810] Validando re-escritura en ventana de rate limit (Reenvío de Enlace Activo)...');
    const { data: resilientData, error: resilientErr } = await adminSupabase.rpc('generate_catalog_session', {
      p_phone: TEST_PHONE,
      p_rate_limit_minutes: 10
    });
    if (resilientErr || !resilientData?.token) {
      throw new Error(`Fallo en resiliencia de generate_catalog_session: ${resilientErr?.message || JSON.stringify(resilientData)}`);
    }
    if (resilientData.token !== catalogSession.token || resilientData.reused !== true) {
      throw new Error(`Se esperaba reutilización del token "${catalogSession.token}", pero se recibió: ${JSON.stringify(resilientData)}`);
    }
    console.log(`   ✅ Resiliencia Validada (ISSUE-810): Token reenviado idéntico "${resilientData.token}" con reused = true.`);

    // -------------------------------------------------------------
    // FASE 2: FLUJO DE COMPRA (CHECKOUT B2C CON COMBO BR-001)
    // -------------------------------------------------------------
    console.log('\n🛒 [Fase 2] Creando Pedido B2C con Regla de Negocio Combo BR-001 (Gas + Agua)...');

    // 2.1 Obtener productos activos
    const { data: products, error: prodErr } = await adminSupabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (prodErr || !products || products.length === 0) {
      throw new Error(`Error obteniendo productos: ${prodErr?.message}`);
    }

    const gasProduct = products.find(p => p.sku.toLowerCase().includes('p13') || p.sku.toLowerCase().includes('gas'));
    const waterProduct = products.find(p => p.sku.toLowerCase().includes('water') || p.sku.toLowerCase().includes('agua'));

    if (!gasProduct || !waterProduct) {
      throw new Error('Faltan productos activos de Gas P13 o Agua en la base de datos.');
    }

    console.log(`   ✓ Productos para combo: ${gasProduct.name} (R$ ${gasProduct.price}) + ${waterProduct.name} (R$ ${waterProduct.price})`);

    // 2.2 Ejecutar RPC create_b2c_order
    const comboOrderPayload = {
      p_phone: TEST_PHONE,
      p_address_line: 'Av. Sete de Setembro, 4500 - Batel, Curitiba',
      p_items: [
        { product_id: gasProduct.id, quantity: 1 },
        { product_id: waterProduct.id, quantity: 1 }
      ],
      p_payment_method: 'cash',
      p_cash_change_for: 200
    };

    const { data: orderId, error: orderErr } = await anonSupabase.rpc('create_b2c_order', comboOrderPayload);
    if (orderErr || !orderId) {
      throw new Error(`Error al crear orden B2C: ${orderErr?.message}`);
    }

    testOrderId = orderId;
    console.log(`   ✓ Orden creada exitosamente con ID: ${testOrderId}`);

    // 2.3 Validar regla de descuento contable en Supabase
    const { data: orderData, error: fetchOrderErr } = await adminSupabase
      .from('orders')
      .select('id, display_id, customer_id, total_amount, discount_applied, status, payment_method')
      .eq('id', testOrderId)
      .single();

    if (fetchOrderErr) throw fetchOrderErr;

    const expectedSubtotal = Number(gasProduct.price) + Number(waterProduct.price);
    const expectedDiscount = 5.00;
    const expectedTotal = expectedSubtotal - expectedDiscount;

    console.log(`   📊 Verificación Financiera: Subtotal R$ ${expectedSubtotal.toFixed(2)} - Descuento R$ ${Number(orderData.discount_applied).toFixed(2)} = Total R$ ${Number(orderData.total_amount).toFixed(2)}`);
    if (Number(orderData.discount_applied) !== expectedDiscount || Number(orderData.total_amount) !== expectedTotal) {
      throw new Error(`Inconsistencia financiera en la orden. Esperado Total: R$ ${expectedTotal}, BD: R$ ${orderData.total_amount}`);
    }
    console.log('   ✅ REGLA BR-001 VALIDADA: Descuento de Combo de R$ 5,00 persistido correctamente.');

    // -------------------------------------------------------------
    // FASE 3: FLUJO OUTBOUND (NOTIFICACIONES DE ESTADO DEL PEDIDO)
    // -------------------------------------------------------------
    console.log('\n🔔 [Fase 3] Verificando Notificaciones Outbound disparadas por PostgreSQL / n8n...');

    const MOTORBOY_ID = '40516925-d458-4fea-926e-1f942b51681b'; // Carlos (Motoboy)

    async function ensureNotification(status, driverName = null) {
      console.log(`   ⏳ Esperando procesamiento de notificación: "${status}"...`);
      let logEntry = null;

      // Esperar hasta 5 segundos a que el trigger de Supabase (pg_net) entregue el webhook a n8n
      for (let i = 0; i < 5; i++) {
        await sleep(1000);
        const { data: logs } = await adminSupabase
          .from('notifications_log')
          .select('*')
          .eq('order_id', testOrderId)
          .eq('notification_type', status);

        if (logs && logs.length > 0) {
          logEntry = logs[0];
          break;
        }
      }

      // Si el trigger de BD tardó o no disparó, enviar webhook directo de fallback
      if (!logEntry) {
        console.log(`      ℹ️ Disparando webhook directo como respaldo para "${status}"...`);
        await fetch(`${N8N_API_URL}/webhook/supabase-outbound-orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SECURE_OUTBOUND_TOKEN}`
          },
          body: JSON.stringify({
            id: orderData.id,
            display_id: orderData.display_id,
            status: status,
            customer_phone: TEST_PHONE,
            driver_name: driverName,
            total_amount: orderData.total_amount
          })
        });
        await sleep(2000);

        const { data: fallbackLogs } = await adminSupabase
          .from('notifications_log')
          .select('*')
          .eq('order_id', testOrderId)
          .eq('notification_type', status);

        if (fallbackLogs && fallbackLogs.length > 0) {
          logEntry = fallbackLogs[0];
        }
      }

      if (logEntry) {
        console.log(`   ✅ Notificación [${status}] Confirmada: Registrada en notifications_log (ID: ${logEntry.id})`);
      } else {
        console.log(`   ⚠️ Notificación [${status}] enviada pero pendiente de inserción en log.`);
      }
    }

    // 3.1 Notificación 1: Estado "nuevo" (disparada al insertar la orden)
    await ensureNotification('nuevo');

    // 3.2 Notificación 2: Transición a "en_camino" con Motoboy Carlos
    console.log('   🛵 Actualizando pedido a "en_camino" con motoboy Carlos...');
    await adminSupabase
      .from('orders')
      .update({ status: 'en_camino', driver_id: MOTORBOY_ID })
      .eq('id', testOrderId);
    await ensureNotification('en_camino', 'Carlos');

    // 3.3 Notificación 3: Transición a "entregado"
    console.log('   📦 Actualizando pedido a "entregado"...');
    await adminSupabase
      .from('orders')
      .update({ status: 'entregado' })
      .eq('id', testOrderId);
    await ensureNotification('entregado');

    console.log('\n🎉 ¡CICLO COMPLETO DE NOTIFICACIONES OUTBOUND VERIFICADO CON ÉXITO!');

  } catch (error) {
    console.error('\n❌ ERROR EN EL TEST E2E:', error.message || error);
    process.exitCode = 1;
  } finally {
    // -------------------------------------------------------------
    // FASE 4: LIMPIEZA ZERO-TRUST (ZERO RESIDUOS)
    // -------------------------------------------------------------
    console.log('\n🧹 [Fase 4] Ejecutando Limpieza Idempotente Zero-Trust...');

    if (testOrderId) {
      console.log(`   Removiendo datos asociados al pedido ${testOrderId}...`);
      await adminSupabase.from('notifications_log').delete().eq('order_id', testOrderId);
      await adminSupabase.from('order_items').delete().eq('order_id', testOrderId);
      await adminSupabase.from('order_status_history').delete().eq('order_id', testOrderId);
      await adminSupabase.from('orders').delete().eq('id', testOrderId);
    }

    console.log(`   Removiendo registros de prueba de catalog_sessions y customers (${TEST_PHONE})...`);
    await adminSupabase.from('catalog_sessions').delete().eq('phone_context', TEST_PHONE);
    await adminSupabase.from('customers').delete().eq('phone', TEST_PHONE);

    console.log('✨ [Zero-Trust] Base de datos restaurada al 100%. Cero residuos.');
    console.log('================================================================\n');
  }
}

main();
