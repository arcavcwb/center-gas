import { createSignal, createEffect, onCleanup, Show } from 'solid-js';
import { supabase } from '../lib/supabase';

const PENALTY_FEE = 200.00; // Custo do vasilhame caso o cliente não entregue o vazio

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
  const [modalError, setModalError] = createSignal<string | null>(null);
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
      .in('status', ['asignado', 'en_camino'])
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email(),
      password: password(),
    });
    if (error) {
      setAuthError(error.message);
    } else if (data.session) {
      setSession(data.session);
      fetchActiveOrder(data.user.id);
    }
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
    setModalError(null);
    if (cylinderReceived() === null) {
      setModalError("Por favor, confirme se recolheu o botijão vazio.");
      return;
    }
    
    setIsFinishing(true);
    
    const { error } = await supabase.rpc('update_order_status', { 
        p_order_id: order().id,
        p_new_status: 'entregado',
        p_cylinder_returned: cylinderReceived()
    });

    setIsFinishing(false);

    if (error) {
      setModalError("Erro ao atualizar o pedido: " + error.message);
      return;
    }

    setShowModal(false);
    setCompleted(true);
  };

  const mapsUrl = () => order() && order().customer?.address_line 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order().customer.address_line)}`
    : '#';

  const wazeUrl = () => order() && order().customer?.address_line
    ? `https://waze.com/ul?q=${encodeURIComponent(order().customer.address_line)}&navigate=yes`
    : '#';

  const orderItemsText = () => {
    if (!order() || !order().items) return '';
    return order().items.map((i: any) => `${i.quantity}x ${i.product.name}`).join(', ');
  };

  return (
    <div class="space-y-4">
      <Show when={!session()}>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-10">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Acesso Entregador</h2>
          <form onSubmit={handleLogin} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" required value={email()} onInput={(e) => setEmail(e.currentTarget.value)} class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input type="password" required value={password()} onInput={(e) => setPassword(e.currentTarget.value)} class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
            </div>
            <Show when={authError()}>
              <p class="text-red-500 text-sm font-medium">{authError()}</p>
            </Show>
            <button type="submit" disabled={loadingAuth()} class="w-full bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-extrabold py-4 rounded-xl shadow-md transition-colors cursor-pointer">
              {loadingAuth() ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </Show>

      <Show when={session()}>
        <div class="flex justify-end mb-4">
          <button onClick={handleLogout} class="text-sm font-medium text-gray-500 underline">Sair da Conta</button>
        </div>

        <Show when={loadingOrder()}>
          <div class="text-center p-10 text-gray-500">Carregando pedidos...</div>
        </Show>

        <Show when={!loadingOrder() && !order() && !completed()}>
          <div class="bg-gray-100 p-8 rounded-3xl text-center border-2 border-dashed border-gray-300">
            <div class="text-4xl mb-2">🛵</div>
            <h2 class="text-xl font-bold text-gray-700">Sem pedidos ativos</h2>
            <p class="text-gray-500 mt-2">Você não tem entregas atribuídas no momento. Atualize mais tarde.</p>
            <button onClick={() => fetchActiveOrder(session().user.id)} class="mt-4 px-6 py-2 bg-white rounded-full shadow-sm font-semibold text-gray-700 border border-gray-200 active:bg-gray-50">Atualizar</button>
          </div>
        </Show>

        <Show when={completed()}>
          <div class="bg-green-100 border-2 border-green-500 rounded-2xl p-6 text-center shadow-lg">
            <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 class="text-2xl font-black text-green-900 mb-2">ENTREGA CONCLUÍDA</h2>
            <p class="text-green-800 font-medium text-lg">Total recebido: R$ {finalTotal().toFixed(2)}</p>
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
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</p>
                <p class="text-xl font-extrabold text-slate-900">{order().customer?.name || 'Cliente'}</p>
                <div class="flex flex-wrap items-center gap-2 mt-2">
                  <a 
                    href={`https://wa.me/${order().customer?.phone?.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs"
                  >
                    <span>💬</span>
                    <span>WhatsApp: {order().customer?.phone}</span>
                  </a>
                  <a 
                    href={`tel:${order().customer?.phone?.replace(/\D/g, '')}`} 
                    class="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                  >
                    <span>📞</span>
                    <span>Ligar</span>
                  </a>
                </div>
              </div>
              
              <div class="bg-slate-100 p-4 rounded-2xl border-2 border-slate-300 shadow-xs">
                <p class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">📍 Endereço de Entrega</p>
                <p class="text-xl font-black text-slate-950 leading-snug mb-4 select-all">{order().customer?.address_line}</p>
                
                <div class="grid grid-cols-2 gap-2.5">
                  <a 
                    href={mapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-center py-3.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition-colors shadow-sm text-sm"
                  >
                    🗺️ Google Maps
                  </a>
                  <a 
                    href={wazeUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-center py-3.5 px-3 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold rounded-xl transition-colors shadow-sm text-sm"
                  >
                    🚙 Waze
                  </a>
                </div>
              </div>

              <div class="pt-2 border-t border-dashed border-gray-200">
                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detalhes da Entrega</p>
                <div class="bg-gray-50 p-4 rounded-xl space-y-2 border border-slate-200">
                  <div class="flex justify-between items-center">
                    <span class="font-medium text-gray-700">Entregar:</span>
                    <span class="font-bold text-gray-900 text-lg">{orderItemsText()}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="font-medium text-gray-700">Total:</span>
                    <span class="font-black text-orange-700 text-2xl">R$ {Number(order().total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Show when={order().payment_method === 'cash' && changeFor() > 0}>
                <div class="bg-orange-100 border-2 border-primary rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                  <span class="uppercase font-bold text-orange-800 text-sm mb-1">Atenção! Pagamento em Dinheiro</span>
                  <span class="font-black text-orange-900 text-2xl mb-1">Levar Troco para: R$ {changeFor().toFixed(2)}</span>
                  <span class="font-bold text-orange-800 text-lg bg-orange-200 px-3 py-1 rounded-lg mt-2">Dar troco de: R$ {changeToGive().toFixed(2)}</span>
                </div>
              </Show>
              
              <Show when={order().payment_method === 'pix'}>
                <div class="bg-blue-100 border-2 border-blue-500 rounded-2xl p-4 text-center">
                  <span class="font-black text-blue-900 text-2xl">PAGAMENTO VIA PIX</span>
                </div>
              </Show>

              <button 
                type="button"
                onClick={() => setShowModal(true)}
                class="w-full py-5 mt-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xl tracking-wide rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>✅</span>
                <span>MARCAR COMO ENTREGUE</span>
              </button>
            </div>
          </div>

          {/* Modal de Validação de Casco */}
          <Show when={showModal()}>
            <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div class="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
                <h3 class="text-2xl font-black text-gray-900 mb-2">Confirmação de Vasilhame</h3>
                <p class="text-lg font-medium text-gray-600 mb-6">Você recolheu 1x Botijão Vazio?</p>
                
                <div class="space-y-3 mb-8">
                  <button 
                    onClick={() => setCylinderReceived(true)}
                    class="w-full p-5 rounded-2xl border-4 text-left font-bold text-lg transition-colors flex items-center justify-between"
                    classList={{
                      'border-green-500 bg-green-50 text-green-900': cylinderReceived() === true,
                      'border-gray-200 text-gray-700 active:bg-gray-100': cylinderReceived() !== true
                    }}
                  >
                    <span>✅ Sim, botijão recolhido</span>
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
                      <span>❌ Não entregou botijão</span>
                      <Show when={cylinderReceived() === false}><div class="w-6 h-6 rounded-full bg-red-500"></div></Show>
                    </div>
                    <span class="text-sm font-medium text-red-700 mt-1">Será somado R$ {PENALTY_FEE} ao valor</span>
                  </button>
                </div>

                <div class="space-y-3">
                  <Show when={modalError()}>
                    <div class="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold p-3.5 rounded-xl">
                      ⚠️ {modalError()}
                    </div>
                  </Show>

                  <Show when={cylinderReceived() === false}>
                    <div class="bg-red-100 p-4 rounded-xl text-center border border-red-200 mb-4">
                      <p class="text-red-900 font-bold uppercase text-sm">Novo Total a Cobrar</p>
                      <p class="text-4xl font-black text-red-700">R$ {finalTotal().toFixed(2)}</p>
                    </div>
                  </Show>

                  <button 
                    onClick={handleFinish}
                    disabled={cylinderReceived() === null || isFinishing()}
                    class="w-full py-5 text-xl font-black text-white bg-gray-900 rounded-2xl disabled:bg-gray-300 disabled:text-gray-500 active:bg-black transition-colors"
                  >
                    {isFinishing() ? 'PROCESSANDO...' : 'FINALIZAR ENTREGA'}
                  </button>
                  <button 
                    onClick={() => { setShowModal(false); setModalError(null); }}
                    disabled={isFinishing()}
                    class="w-full py-4 text-lg font-bold text-gray-500 active:text-gray-800"
                  >
                    Cancelar / Voltar
                  </button>
                </div>
              </div>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  );
}
