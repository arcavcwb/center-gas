const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase URL or Service Role Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createOwner() {
  const email = 'admin@centergas.com';
  const password = 'CenterGas2026!';

  console.log(`Creando usuario owner: ${email}...`);

  // 1. Crear usuario en Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  });

  if (authError) {
    if (authError.code === 'email_exists' || authError.message.includes('already registered')) {
      console.log('El usuario ya existe en Auth.');
    } else {
      console.error('Error creando usuario:', authError);
      process.exit(1);
    }
  } else {
    console.log('Usuario creado en Auth con ID:', authData.user.id);
  }

  // Obtener el ID para asegurarnos
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  const user = usersData?.users.find(u => u.email === email);

  if (user) {
    // 2. Insertar en profiles
    console.log('Insertando perfil owner para:', user.id);
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: 'Administrador Center Gas',
      role: 'owner'
    });

    if (profileError) {
      console.error('Error creando profile:', profileError);
    } else {
      console.log('Perfil creado exitosamente. Ya puedes iniciar sesión con:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    }
  }
}

createOwner();
