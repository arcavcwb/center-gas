// =============================================================================
// ⚠️  ROTACIÓN OBLIGATORIA DE CREDENCIALES
// =============================================================================
// Este script tenía el email y la contraseña del motoboy escritos en claro
// (motoboy1@centergas.com / la contraseña por defecto del proyecto) en un
// repositorio PÚBLICO. Cualquier cuenta creada con aquella contraseña se
// considera comprometida: hay que cambiarla YA desde Supabase > Authentication,
// aunque el código ya no la contenga.
//
// Desde ahora las credenciales se leen de DRIVER_EMAIL y DRIVER_PASSWORD y no
// hay ningún valor por defecto: si faltan, el script aborta.
// =============================================================================

import { createClient } from '@supabase/supabase-js';

// Longitud mínima razonable para la contraseña del motoboy.
const LONGITUD_MINIMA_PASSWORD = 12;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Credenciales del motoboy: obligatorias por entorno, sin valores por defecto.
const driverEmail = (process.env.DRIVER_EMAIL || '').trim();
const driverPassword = process.env.DRIVER_PASSWORD || '';

if (!driverEmail || !driverPassword) {
  console.error('\n❌ ERROR: faltan las variables de entorno DRIVER_EMAIL y/o DRIVER_PASSWORD.');
  console.error('   Este script no trae credenciales por defecto a propósito. Ejecútalo así:');
  console.error('     DRIVER_EMAIL="motoboy1@tu-dominio.com" DRIVER_PASSWORD="<contraseña-fuerte>" \\');
  console.error('       node apps/web/scripts/create_driver.js\n');
  process.exit(1);
}

if (driverPassword.length < LONGITUD_MINIMA_PASSWORD) {
  console.error(`\n❌ ERROR: DRIVER_PASSWORD debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`);
  console.error('   Usa una contraseña larga y generada al azar, no una reutilizada.\n');
  process.exit(1);
}

// Teléfono del cliente de siembra que se crea si la tabla `customers` está vacía.
// NO es un secreto: es un placeholder ficticio para poder generar la orden de
// prueba del motoboy. Se puede sobreescribir con SEED_CUSTOMER_PHONE.
const seedCustomerPhone = process.env.SEED_CUSTOMER_PHONE || '5541999999999';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const email = driverEmail;
  const password = driverPassword;

  console.log('Creando usuario driver:', email);
  
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      console.log('El usuario ya existe, obteniendo ID...');
    } else {
      console.error('Error creando usuario:', authError.message);
      process.exit(1);
    }
  }

  // Get user to update role
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('No se pudo encontrar el usuario después de crearlo');
    process.exit(1);
  }

  // 2. Update profiles table to role = 'driver'
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id,
      role: 'driver',
      full_name: 'João Motoboy'
    });

  if (profileError) {
    console.error('Error actualizando el perfil:', profileError.message);
    process.exit(1);
  }

  console.log(`✅ Motoboy configurado con éxito. ID: ${user.id}`);
  
  // 3. Crear una orden manual asignada a este motoboy
  console.log('Creando orden de prueba...');
  
  // Create a fake customer first if needed or use existing
  const { data: customers, error: custError } = await supabase.from('customers').select('id').limit(1);
  let customerId = customers?.[0]?.id;
  
  if (!customerId) {
    const { data: newCust, error: newCustError } = await supabase.from('customers').insert({
      phone: seedCustomerPhone,
      address_line: 'Rua de Prueba 123',
      name: 'Cliente Test'
    }).select().single();
    if (newCustError) {
      console.error('Error creando cliente:', newCustError.message);
      process.exit(1);
    }
    customerId = newCust.id;
  }

  const { data: order, error: orderError } = await supabase.from('orders').insert({
    display_id: 'TEST-' + Math.floor(Math.random() * 1000),
    customer_id: customerId,
    driver_id: user.id,
    status: 'en_camino',
    payment_method: 'cash',
    cash_change_for: 150.00,
    total_amount: 110.00
  }).select().single();

  if (orderError) {
    console.error('Error creando orden:', orderError.message);
    process.exit(1);
  }

  console.log(`✅ Orden ${order.display_id} asignada a ${email}`);
}

main();
