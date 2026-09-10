// =============================================================================
// ⚠️  ROTACIÓN OBLIGATORIA DE CREDENCIALES
// =============================================================================
// Este script tenía el email y la contraseña del owner escritos en claro
// (admin@centergas.com / la contraseña por defecto del proyecto) en un
// repositorio PÚBLICO. Cualquier cuenta creada con aquella contraseña se
// considera comprometida: hay que cambiarla YA desde Supabase > Authentication,
// aunque el código ya no la contenga.
//
// Desde ahora las credenciales se leen de OWNER_EMAIL y OWNER_PASSWORD y no hay
// ningún valor por defecto: si faltan, el script aborta.
// =============================================================================

const { createClient } = require('@supabase/supabase-js');

// Longitud mínima razonable para la contraseña del owner (cuenta con permisos
// totales sobre el panel B2B). Supabase acepta 6 por defecto; aquí exigimos más.
const LONGITUD_MINIMA_PASSWORD = 12;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase URL or Service Role Key in .env');
  process.exit(1);
}

// Credenciales del owner: obligatorias por entorno, sin valores por defecto.
const ownerEmail = (process.env.OWNER_EMAIL || '').trim();
const ownerPassword = process.env.OWNER_PASSWORD || '';

if (!ownerEmail || !ownerPassword) {
  console.error('\n❌ ERROR: faltan las variables de entorno OWNER_EMAIL y/o OWNER_PASSWORD.');
  console.error('   Este script no trae credenciales por defecto a propósito. Ejecútalo así:');
  console.error('     OWNER_EMAIL="admin@tu-dominio.com" OWNER_PASSWORD="<contraseña-fuerte>" \\');
  console.error('       node apps/web/scripts/create_owner.js\n');
  process.exit(1);
}

if (ownerPassword.length < LONGITUD_MINIMA_PASSWORD) {
  console.error(`\n❌ ERROR: OWNER_PASSWORD debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`);
  console.error('   Es la cuenta con permisos totales sobre el panel: usa una contraseña larga');
  console.error('   y generada al azar, no una reutilizada.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createOwner() {
  const email = ownerEmail;
  const password = ownerPassword;

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
      // La contraseña no se imprime: acabaría en los logs de consola o de CI.
      console.log('Password: la que definiste en OWNER_PASSWORD.');
    }
  }
}

createOwner();
