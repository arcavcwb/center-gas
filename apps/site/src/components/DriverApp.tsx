import { createSignal, createEffect, onCleanup, Show } from 'solid-js';
import { supabase } from '../lib/supabase';

const PENALTY_FEE = 200.00; // Costo del envase vacío si el cliente no lo entrega

export default function DriverApp() {
  const [session, setSession] = createSignal<any>(null);
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [loadingAuth, setLoadingAuth] = createSignal(false);
  const [authError, setAuthError] = createSignal('');

  const [order, setOrder] = createSignal<any>(null);
  const [loadingOrder, setLoadingOrder] = createSignal(true);
  
  const [showModal, setShowModal] = createSignal(false);
  const [cylinderReceived, setCylinderReceived] = createSignal<boolean | null>(null);
  const [isFinishing, setIsFinishing] = createSignal(false);
  const [completed, setCompleted] = createSignal(false);

  // Check initial session
  createEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchActiveOrder(session.user.id);
      } else {
        setLoadingOrder(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchActiveOrder(session.user.id);
    });

    onCleanup(() => {
      subscription.unsubscribe();
    });
  });

  const fetchActiveOrder = async (driverId: string) => {
    setLoadingOrder(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        display_id,
        status,
        payment_method,
        cash_change_for,
        total_amount,
        customer:customer_id ( name, address_line, phone ),
        items:order_items ( quantity, product:product_id ( name ) )
      `)
      .eq('driver_id', driverId)
      .in('status', ['nuevo', 'preparacion', 'en_camino'])
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!error && data) {
      setOrder(data);
    } else {
      setOrder(null);
    }
    setLoadingOrder(false);
  };

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setLoadingAuth(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email(),
      password: password(),
    });
    if (error) setAuthError(error.message);
    setLoadingAuth(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOrder(null);
  };

  const finalTotal = () => {
    if (!order()) return 0;
    return Number(order().total_amount) + (cylinderReceived() === false ? PENALTY_FEE : 0);
  };

  const changeFor = () => {
    if (!order() || !order().cash_change_for) return 0;
    return Number(order().cash_change_for);
  };

  const changeToGive = () => {
    if (changeFor() === 0) return 0;
    const change = changeFor() - finalTotal();
    return change > 0 ? change : 0;
  };

  const handleFinish = async () => {
    if (cylinderReceived() === null) return alert("Debes confirmar si recogiste el envase vacío.");
    
    setIsFinishing(true);
    
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'entregado', 
        cylinder_returned: cylinderReceived() 
      })
      .eq('id', order().id);

    setIsFinishing(false);

    if (error) {
      alert("Error actualizando la orden: " + error.message);
      return;
    }

    setShowModal(false);
    setCompleted(true);
  };

  const mapsUrl = () => order() && order().customer?.address_line 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order().customer.address_line)}`
    : '#';

  const orderItemsText = () => {
    if (!order() || !order().items) return '';
    return order().items.map((i: any) => `${i.quantity}x ${i.product.name}`).join(', ');
  };

  if (!session()) {
    return (
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-10">
        <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Acceso Repartidor</h2>
        <form onSubmit={handleLogin} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email()} onInput={(e) => setEmail(e.currentTarget.value)} class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" required value={password()} onInput={(e) => setPassword(e.currentTarget.value)} class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>
          <Show when={authError()}>
            <p class="text-red-500 text-sm font-medium">{authError()}</p>
          </Show>
          <button type="submit" disabled={loadingAuth()} class="w-full bg-primary text-white font-bold py-4 rounded-xl active:bg-blue-800 transition-colors">
            {loadingAuth() ? 'Entrando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <div class="flex justify-end mb-4">
        <button onClick={handleLogout} class="text-sm font-medium text-gray-500 underline">Cerrar Sesión</button>
      </div>

      <Show when={loadingOrder()}>
        <div class="text-center p-10 text-gray-500">Cargando tus órdenes...</div>
      </Show>

      <Show when={!loadingOrder() && !order() && !completed()}>
        <div class="bg-gray-100 p-8 rounded-3xl text-center border-2 border-dashed border-gray-300">
          <div class="text-4xl mb-2">🛵</div>
          <h2 class="text-xl font-bold text-gray-700">Sin pedidos activos</h2>
          <p class="text-gray-500 mt-2">No tienes pedidos asignados en este momento. Refresca más tarde.</p>
          <button onClick={() => fetchActiveOrder(session().user.id)} class="mt-4 px-6 py-2 bg-white rounded-full shadow-sm font-semibold text-gray-700 border border-gray-200 active:bg-gray-50">Refrescar</button>
        </div>
      </Show>

      <Show when={completed()}>
        <div class="bg-green-100 border-2 border-green-500 rounded-2xl p-6 text-center shadow-lg">
          <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 class="text-2xl font-black text-green-900 mb-2">ENTREGA EXITOSA</h2>
          <p class="text-green-800 font-medium text-lg">Total cobrado: R$ {finalTotal().toFixed(2)}</p>
          <button onClick={() => { setCompleted(false); fetchActiveOrder(session().user.id); }} class="mt-6 font-bold text-green-700 underline p-4 active:text-green-900">Buscar próximo pedido</button>
        </div>
      </Show>

      <Show when={order() && !completed()}>
        {/* Order Card */}
        <div class="bg-white rounded-3xl shadow-sm border-2 border-gray-100 overflow-hidden">
          <div class="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
            <span class="font-black text-gray-800 text-xl">#{order().display_id}</span>
            <span class="bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-lg text-sm uppercase">{order().status.replace('_', ' ')}</span>
          </div>
          
          <div class="p-5 space-y-5">
            <div>
              <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Cliente</p>
              <p class="text-xl font-bold text-gray-900">{order().customer?.name || 'Cliente'}</p>
              <a href={`https://wa.me/${order().customer?.phone?.replace(/\D/g, '')}`} target="_blank" class="text-primary font-bold underline text-lg mt-1 inline-block">WhatsApp: {order().customer?.phone}</a>
            </div>
            
            <div class="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <p class="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-1">Dirección</p>
              <p class="text-lg font-medium text-gray-900 leading-tight mb-4">{order().customer?.address_line}</p>
              
              <a 
                href={mapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center w-full py-4 bg-secondary text-white font-bold rounded-xl active:bg-blue-800 transition-colors shadow-md text-lg"
              >
                🗺️ NAVEGAR CON GOOGLE MAPS
              </a>
            </div>

            <div class="pt-2 border-t border-dashed border-gray-200">
              <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Detalle de Entrega</p>
              <div class="bg-gray-50 p-4 rounded-xl space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-700">Entregar:</span>
                  <span class="font-bold text-gray-900 text-lg">{orderItemsText()}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-700">Total:</span>
                  <span class="font-black text-primary text-2xl">R$ {Number(order().total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Show when={order().payment_method === 'cash' && changeFor() > 0}>
              <div class="bg-orange-100 border-2 border-primary rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span class="uppercase font-bold text-orange-800 text-sm mb-1">¡Atención! Pago en Efectivo</span>
                <span class="font-black text-orange-900 text-2xl mb-1">Llevar Troco para: R$ {changeFor().toFixed(2)}</span>
                <span class="font-bold text-orange-800 text-lg bg-orange-200 px-3 py-1 rounded-lg mt-2">Dar vuelto de: R$ {changeToGive().toFixed(2)}</span>
              </div>
            </Show>
            
            <Show when={order().payment_method === 'pix'}>
              <div class="bg-blue-100 border-2 border-blue-500 rounded-2xl p-4 text-center">
                <span class="font-black text-blue-900 text-2xl">PAGO CON PIX</span>
              </div>
            </Show>

            <button 
              onClick={() => setShowModal(true)}
              class="w-full py-6 mt-4 bg-green-600 active:bg-green-700 text-white font-black text-2xl rounded-2xl shadow-xl border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
            >
              MARCAR COMO ENTREGADO
            </button>
          </div>
        </div>

        {/* Modal de Validación de Casco */}
        <Show when={showModal()}>
          <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div class="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
              <h3 class="text-2xl font-black text-gray-900 mb-2">Confirmación de Casco</h3>
              <p class="text-lg font-medium text-gray-600 mb-6">¿Recibiste 1x Envase Vacío (Casco)?</p>
              
              <div class="space-y-3 mb-8">
                <button 
                  onClick={() => setCylinderReceived(true)}
                  class="w-full p-5 rounded-2xl border-4 text-left font-bold text-lg transition-colors flex items-center justify-between"
                  classList={{
                    'border-green-500 bg-green-50 text-green-900': cylinderReceived() === true,
                    'border-gray-200 text-gray-700 active:bg-gray-100': cylinderReceived() !== true
                  }}
                >
                  <span>✅ Sí, envase recogido</span>
                  <Show when={cylinderReceived() === true}><div class="w-6 h-6 rounded-full bg-green-500"></div></Show>
                </button>
                
                <button 
                  onClick={() => setCylinderReceived(false)}
                  class="w-full p-5 rounded-2xl border-4 text-left font-bold text-lg transition-colors flex flex-col"
                  classList={{
                    'border-red-500 bg-red-50 text-red-900': cylinderReceived() === false,
                    'border-gray-200 text-gray-700 active:bg-gray-100': cylinderReceived() !== false
                  }}
                >
                  <div class="flex items-center justify-between w-full">
                    <span>❌ No me dio envase</span>
                    <Show when={cylinderReceived() === false}><div class="w-6 h-6 rounded-full bg-red-500"></div></Show>
                  </div>
                  <span class="text-sm font-medium text-red-700 mt-1">Se sumarán R$ {PENALTY_FEE} al cobro</span>
                </button>
              </div>

              <div class="space-y-3">
                <Show when={cylinderReceived() === false}>
                  <div class="bg-red-100 p-4 rounded-xl text-center border border-red-200 mb-4">
                    <p class="text-red-900 font-bold uppercase text-sm">Nuevo Total a Cobrar</p>
                    <p class="text-4xl font-black text-red-700">R$ {finalTotal().toFixed(2)}</p>
                  </div>
                </Show>

                <button 
                  onClick={handleFinish}
                  disabled={cylinderReceived() === null || isFinishing()}
                  class="w-full py-5 text-xl font-black text-white bg-gray-900 rounded-2xl disabled:bg-gray-300 disabled:text-gray-500 active:bg-black transition-colors"
                >
                  {isFinishing() ? 'PROCESANDO...' : 'FINALIZAR ENTREGA'}
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  disabled={isFinishing()}
                  class="w-full py-4 text-lg font-bold text-gray-500 active:text-gray-800"
                >
                  Cancelar / Volver
                </button>
              </div>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
