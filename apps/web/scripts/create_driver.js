import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const email = 'motoboy1@centergas.com';
  const password = 'motoboypassword123';

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
      phone: '5541999999999',
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
