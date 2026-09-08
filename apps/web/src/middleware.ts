import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si no están configuradas las variables de Supabase (ej. build estático o CI), omitir verificación
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('dummy')) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verificar usuario autenticado mediante getUser() (no getSession() por seguridad)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';

  // 1. Si no hay usuario y no está en /login, redirigir a /login
  if (!user && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si ya hay usuario autenticado y está intentando acceder a /login, redirigir al dashboard
  if (user && isLoginPage) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/';
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. Verificación de RBAC (ISSUE-818): solo el rol 'owner' puede acceder al panel web
  if (user && !isLoginPage) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile || profile.role !== 'owner') {
      // Cerrar sesión y redirigir con mensaje de rol no autorizado
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = '/login';
      unauthorizedUrl.searchParams.set('error', 'unauthorized_role');
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas excepto recursos estáticos e imágenes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
