import { createSignal, createEffect, onCleanup, Show } from 'solid-js';
import { supabase } from '../lib/supabase';
import { formatBRL } from '@center-gas/contracts';

// Ícones SVG consistentes (Design System Impeccable - sem emojis)
function IconMotorcycle(props: { class?: string }) {
  return (
    <svg class={props.class || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <circle cx="5" cy="16" r="3" />
      <circle cx="19" cy="16" r="3" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 16l4-7h4l3 7m-7-7l2-4h3m-5 4h6" />
    </svg>
  );
}

function IconWhatsApp(props: { class?: string }) {
  return (
    <svg class={props.class || "w-5 h-5"} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.275-.1-.476-.15-.677.15-.201.3-.777.978-.952 1.179-.176.201-.351.226-.652.075s-1.274-.47-2.427-1.498c-.897-.8-1.503-1.789-1.679-2.09-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.1-.201.05-.376-.025-.527-.075-.15-.677-1.632-.928-2.234-.244-.588-.493-.508-.677-.518l-.578-.01c-.201 0-.527.075-.803.376s-1.053 1.029-1.053 2.509c0 1.48 1.078 2.909 1.229 3.11 0 .001 0 .001 0 .001.15.201 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.722.23 1.378.197 1.898.12.578-.087 1.78-.727 2.03-1.43.251-.703.251-1.305.176-1.43-.075-.125-.276-.201-.577-.351z"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.892.525 3.662 1.438 5.176L2 22l4.981-1.396A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.167 8.167 0 01-4.398-1.277l-.315-.192-2.955.828.84-2.884-.21-.334A8.172 8.172 0 013.8 12c0-4.522 3.678-8.2 8.2-8.2 4.521 0 8.2 3.678 8.2 8.2 0 4.522-3.679 8.2-8.2 8.2z"/>
    </svg>
  );
}

function IconPhone(props: { class?: string }) {
  return (
    <svg class={props.class || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function IconMapPin(props: { class?: string }) {
  return (
    <svg class={props.class || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconNavigation(props: { class?: string }) {
  return (
    <svg class={props.class || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 2L19 21l-7-4-7 4 7-19z" />
    </svg>
  );
}

function IconMap(props: { class?: string }) {
  return (
    <svg class={props.class || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function IconCheck(props: { class?: string }) {
  return (
    <svg class={props.class || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconX(props: { class?: string }) {
  return (
    <svg class={props.class || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconAlertTriangle(props: { class?: string }) {
  return (
    <svg class={props.class || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function IconLock(props: { class?: string }) {
  return (
    <svg class={props.class || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function IconMail(props: { class?: string }) {
  return (
    <svg class={props.class || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconRotateCw(props: { class?: string }) {
  return (
    <svg class={props.class || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export default function DriverApp() {
  const [session, setSession] = createSignal<any>(null);
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [loadingAuth, setLoadingAuth] = createSignal(false);
  const [authError, setAuthError] = createSignal('');

  const [order, setOrder] = createSignal<any>(null);
  const [loadingOrder, setLoadingOrder] = createSignal(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = createSignal(false);
  const [actionError, setActionError] = createSignal<string | null>(null);
  
  const [showModal, setShowModal] = createSignal(false);
  const [cylinderReceived, setCylinderReceived] = createSignal<boolean | null>(null);
  const [isFinishing, setIsFinishing] = createSignal(false);
  const [modalError, setModalError] = createSignal<string | null>(null);
  const [completed, setCompleted] = createSignal(false);
  const [lastCompletedAmount, setLastCompletedAmount] = createSignal<number>(0);
  const [lastCylinderReceived, setLastCylinderReceived] = createSignal<boolean | null>(null);

  // Tarifas de vasilhame servidas por la base (get_vasilhame_fees). Se usan los
  // valores históricos como respaldo mientras llega la respuesta, pero el importe
  // que se cobra de verdad lo recalcula el servidor en update_order_status.
  const [vasilhameFees, setVasilhameFees] = createSignal({ gas: 170, water: 20 });
  let vasilhameFeesLoaded = false;

  const loadVasilhameFees = async () => {
    if (vasilhameFeesLoaded) return;
    const { data, error } = await supabase.rpc('get_vasilhame_fees');
    if (!error && data) {
      const gas = Number((data as any).gas);
      const water = Number((data as any).water);
      vasilhameFeesLoaded = true;
      setVasilhameFees({
        gas: Number.isFinite(gas) ? gas : 170,
        water: Number.isFinite(water) ? water : 20,
      });
    }
  };

  // Check initial session & auth changes
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
      if (session) {
        fetchActiveOrder(session.user.id);
      }
    });

    onCleanup(() => {
      subscription.unsubscribe();
    });
  });

  // Suscripción Realtime para actualizar la orden asignada en vivo
  createEffect(() => {
    const currentSession = session();
    if (!currentSession?.user?.id) return;

    const driverId = currentSession.user.id;
    const channel = supabase
      .channel(`driver-orders-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `driver_id=eq.${driverId}`
        },
        () => {
          fetchActiveOrder(driverId);
        }
      )
      .subscribe();

    onCleanup(() => {
      supabase.removeChannel(channel);
    });
  });

  const fetchActiveOrder = async (driverId: string) => {
    setLoadingOrder(true);
    setActionError(null);
    loadVasilhameFees();
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        display_id,
        status,
        payment_method,
        cash_change_for,
        total_amount,
        delivery_address,
        customer:customer_id ( name, address_line, phone ),
        items:order_items ( quantity, product:product_id ( name, sku, price, includes_cylinder ) )
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
      setAuthError(error.message === 'Invalid login credentials' ? 'Credenciais inválidas. Verifique seu e-mail e senha.' : error.message);
    } else if (data.session) {
      setSession(data.session);
      fetchActiveOrder(data.user.id);
    }
    setLoadingAuth(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOrder(null);
    setSession(null);
  };

  // Cálculo dinámico de penalidad de casco según el producto (ISSUE-817)
  const penaltyFee = () => {
    if (!order() || !order().items) return 0;
    const fees = vasilhameFees();
    return (order().items as any[]).reduce((acc: number, item: any) => {
      const prod = item.product;
      if (!prod) return acc;
      // Si el producto ya incluía el casco, el cliente ya pagó el vasilhame
      if (prod.includes_cylinder) return acc;

      const sku = (prod.sku || prod.name || '').toLowerCase();
      const qty = Number(item.quantity) || 1;

      if (sku.includes('water') || sku.includes('agua') || sku.includes('água')) {
        return acc + (qty * fees.water); // Diferencia vasilhame galão 20L (tarifa vigente en system_config)
      } else {
        return acc + (qty * fees.gas); // Diferencia botijão GLP 13kg (tarifa vigente en system_config)
      }
    }, 0);
  };

  const finalTotal = () => {
    if (!order()) return 0;
    return Number(order().total_amount) + (cylinderReceived() === false ? penaltyFee() : 0);
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

  const handleStartRoute = async () => {
    if (!order()) return;
    setIsUpdatingStatus(true);
    setActionError(null);

    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: order().id,
      p_new_status: 'en_camino',
    });

    setIsUpdatingStatus(false);

    if (error) {
      setActionError("Erro ao iniciar rota: " + error.message);
    } else {
      fetchActiveOrder(session().user.id);
    }
  };

  const handleFinish = async () => {
    setModalError(null);
    if (cylinderReceived() === null) {
      setModalError("Por favor, selecione se recolheu ou não o botijão vazio.");
      return;
    }
    
    const amountToRecord = finalTotal();
    const wasCylinderReceived = cylinderReceived();
    const orderId = order().id;
    const needsRouteStep = order().status === 'asignado';
    setIsFinishing(true);

    // El servidor valida el grafo de transiciones: 'asignado' sólo puede pasar a
    // 'en_camino'. Si el entregador nunca pulsó INICIAR ROTA, se registra ese paso
    // antes de cerrar la entrega en vez de fallar con un error de transición.
    if (needsRouteStep) {
      const { error: routeError } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: 'en_camino',
      });
      if (routeError) {
        setIsFinishing(false);
        setModalError("Falha de conexão ao salvar: " + routeError.message + ". Toque novamente para tentar.");
        return;
      }
    }

    const { error } = await supabase.rpc('update_order_status', { 
        p_order_id: orderId,
        p_new_status: 'entregado',
        p_cylinder_returned: wasCylinderReceived
    });

    setIsFinishing(false);

    if (error) {
      setModalError("Falha de conexão ao salvar: " + error.message + ". Toque novamente para tentar.");
      return;
    }

    setLastCompletedAmount(amountToRecord);
    setLastCylinderReceived(wasCylinderReceived);
    setShowModal(false);
    setCompleted(true);
  };

  // customers.phone ya se guarda con el DDI 55 (es el JID de WhatsApp), así que
  // anteponerlo otra vez generaba números inexistentes tipo 555541999990001.
  const customerPhoneDigits = () => {
    const digits = (order()?.customer?.phone || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
  };

  // La dirección de ESTE pedido manda; la ficha del cliente sólo sirve de respaldo
  // porque puede haber cambiado después del pedido.
  const deliveryAddress = () => order() && (order().delivery_address || order().customer?.address_line);

  const mapsUrl = () => deliveryAddress()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryAddress() + ', Pinheirinho, Curitiba')}`
    : '#';

  const wazeUrl = () => deliveryAddress()
    ? `https://waze.com/ul?q=${encodeURIComponent(deliveryAddress() + ', Pinheirinho, Curitiba')}&navigate=yes`
    : '#';

  const orderItemsText = () => {
    if (!order() || !order().items) return '';
    return order().items.map((i: any) => `${i.quantity}x ${i.product?.name || 'Gás P13'}`).join(', ');
  };

  return (
    <div class="space-y-4">
      {/* 1. Login para Entregadores */}
      <Show when={!session()}>
        <div class="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200 mt-6">
          <div class="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto mb-4">
            <IconMotorcycle class="w-7 h-7 text-orange-600" />
          </div>
          <h2 class="text-2xl font-black text-slate-900 mb-1 text-center tracking-tight">Acesso do Entregador</h2>
          <p class="text-xs text-slate-500 font-medium text-center mb-6">Entre com suas credenciais para visualizar suas rotas</p>
          
          <form onSubmit={handleLogin} class="space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">E-mail Operacional</label>
              <div class="relative flex items-center">
                <span class="absolute left-3.5 text-slate-400">
                  <IconMail class="w-5 h-5" />
                </span>
                <input 
                  type="email" 
                  required 
                  placeholder="entregador@centergas.com.br"
                  value={email()} 
                  onInput={(e) => setEmail(e.currentTarget.value)} 
                  class="w-full pl-11 pr-4 py-3.5 min-h-[48px] bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-600 focus:border-orange-600 outline-none text-base transition-colors" 
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Senha de Acesso</label>
              <div class="relative flex items-center">
                <span class="absolute left-3.5 text-slate-400">
                  <IconLock class="w-5 h-5" />
                </span>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={password()} 
                  onInput={(e) => setPassword(e.currentTarget.value)} 
                  class="w-full pl-11 pr-4 py-3.5 min-h-[48px] bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-orange-600 focus:border-orange-600 outline-none text-base transition-colors" 
                />
              </div>
            </div>

            <Show when={authError()}>
              <div class="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-3.5 rounded-xl flex items-start gap-2">
                <IconAlertTriangle class="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError()}</span>
              </div>
            </Show>

            <button 
              type="submit" 
              disabled={loadingAuth()} 
              class="w-full min-h-[52px] bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-black text-base py-4 rounded-xl shadow-md active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Show when={loadingAuth()} fallback={<span>ENTRAR NO SISTEMA</span>}>
                <IconRotateCw class="w-5 h-5 animate-spin motion-reduce:animate-none" />
                <span>Autenticando...</span>
              </Show>
            </button>
          </form>
        </div>
      </Show>

      {/* 2. Área Logada do Entregador */}
      <Show when={session()}>
        {/* Barra superior de sessão */}
        <div class="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs mb-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span class="text-xs font-bold text-slate-700 truncate">{session()?.user?.email || 'Entregador'}</span>
          </div>
          <button 
            type="button"
            onClick={handleLogout} 
            class="text-xs font-bold text-slate-500 hover:text-slate-800 active:text-slate-950 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>

        {/* Loading inicial */}
        <Show when={loadingOrder()}>
          <div class="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-xs">
            <IconRotateCw class="w-8 h-8 text-orange-600 animate-spin motion-reduce:animate-none mx-auto mb-3" />
            <p class="text-sm font-bold text-slate-700">Verificando entregas ativas...</p>
          </div>
        </Show>

        {/* Sem pedidos ativos */}
        <Show when={!loadingOrder() && !order() && !completed()}>
          <div class="bg-white p-8 rounded-2xl text-center border-2 border-dashed border-slate-300 shadow-xs">
            <div class="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <IconMotorcycle class="w-8 h-8 text-slate-600" />
            </div>
            <h2 class="text-lg font-black text-slate-800 tracking-tight">Nenhuma entrega atribuída</h2>
            <p class="text-xs font-medium text-slate-500 mt-1 max-w-xs mx-auto">
              Você não possui pedidos ativos no momento. Quando a central atribuir uma entrega ao seu perfil, ela aparecerá aqui em tempo real.
            </p>
            <button 
              type="button"
              onClick={() => fetchActiveOrder(session().user.id)} 
              class="mt-5 min-h-[48px] px-6 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <IconRotateCw class="w-4 h-4" />
              <span>Verificar novamente</span>
            </button>
          </div>
        </Show>

        {/* Tela de Sucesso de Entrega Concluída */}
        <Show when={completed()}>
          <div class="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 text-center shadow-md">
            <div class="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
              <IconCheck class="w-8 h-8 text-white" />
            </div>
            <h2 class="text-xl font-black text-emerald-950 tracking-tight">ENTREGA FINALIZADA!</h2>
            <p class="text-xs font-bold text-emerald-800 uppercase tracking-wider mt-1">Status registrado no sistema</p>
            
            <div class="bg-white p-4 rounded-xl border border-emerald-200 mt-4 shadow-xs">
              <span class="text-xs font-medium text-slate-500 block">Total Recebido</span>
              <span class="text-3xl font-black text-emerald-700 block mt-0.5">R$ {lastCompletedAmount().toFixed(2)}</span>
              <span class="inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-md" classList={{
                'bg-emerald-100 text-emerald-800': lastCylinderReceived() === true,
                'bg-amber-100 text-amber-900': lastCylinderReceived() === false
              }}>
                {lastCylinderReceived() === true ? 'Vasilhame vazio recolhido' : 'Taxa de vasilhame incluída'}
              </span>
            </div>

            <button 
              type="button"
              onClick={() => { setCompleted(false); fetchActiveOrder(session().user.id); }} 
              class="mt-6 w-full min-h-[52px] bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-sm py-4 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              BUSCAR PRÓXIMO PEDIDO
            </button>
          </div>
        </Show>

        {/* Card XL do Pedido Ativo */}
        <Show when={order() && !completed()}>
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header da Card */}
            <div class="bg-slate-900 text-white px-4 py-3 flex flex-wrap gap-2 justify-between items-center border-b border-slate-800">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Pedido</span>
                <span class="font-black text-white text-xl tracking-tight">#{order().display_id}</span>
              </div>
              <span class="font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shrink-0" classList={{
                'bg-amber-500/20 text-amber-300 border border-amber-500/40': order().status === 'asignado',
                'bg-orange-500/20 text-orange-300 border border-orange-500/40': order().status === 'en_camino'
              }}>
                {order().status === 'asignado' ? 'Atribuído / Aguardando' : 'Em Rota de Entrega'}
              </span>
            </div>
            
            <div class="p-4 sm:p-5 space-y-4">
              {/* Seção Cliente */}
              <div>
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block">Cliente</span>
                <h3 class="text-xl font-black text-slate-900 tracking-tight mt-0.5">{order().customer?.name || 'Cliente'}</h3>
                
                <div class="grid grid-cols-2 gap-2 mt-2.5">
                  <a 
                    href={`https://wa.me/${customerPhoneDigits()}?text=${encodeURIComponent(`Olá ${order().customer?.name || ''}! Sou o entregador da Center Gás com seu pedido #${order().display_id}.`)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="min-h-[48px] bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-2 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <IconWhatsApp class="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                  <a 
                    href={`tel:+${customerPhoneDigits()}`} 
                    class="min-h-[48px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 font-bold text-xs px-3 py-2 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <IconPhone class="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Ligar</span>
                  </a>
                </div>
              </div>
              
              {/* Seção Endereço de Entrega (Alto Contraste Outdoor) */}
              <div class="bg-slate-100 p-4 rounded-2xl border-2 border-slate-300 shadow-xs">
                <div class="flex items-center gap-1.5 mb-1.5">
                  <IconMapPin class="w-4 h-4 text-orange-600 shrink-0" />
                  <span class="text-xs font-black text-slate-700 uppercase tracking-wider">Endereço de Entrega</span>
                </div>
                <p class="text-lg font-black text-slate-950 leading-snug mb-3.5 select-all">
                  {deliveryAddress()}
                </p>
                
                <div class="grid grid-cols-2 gap-2">
                  <a 
                    href={mapsUrl()}
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="min-h-[48px] flex items-center justify-center gap-2 px-3 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition-colors shadow-xs text-xs sm:text-sm"
                  >
                    <IconMap class="w-4 h-4 shrink-0" />
                    <span>Google Maps</span>
                  </a>
                  <a 
                    href={wazeUrl()}
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="min-h-[48px] flex items-center justify-center gap-2 px-3 py-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold rounded-xl transition-colors shadow-xs text-xs sm:text-sm"
                  >
                    <IconNavigation class="w-4 h-4 shrink-0" />
                    <span>Waze</span>
                  </a>
                </div>
              </div>

              {/* Detalhes dos Itens */}
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-600 uppercase">Itens a entregar:</span>
                  <span class="font-extrabold text-slate-900 text-sm">{orderItemsText()}</span>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span class="text-xs font-bold text-slate-600 uppercase">Total do Pedido:</span>
                  <span class="font-black text-orange-700 text-xl">R$ {Number(order().total_amount).toFixed(2)}</span>
                </div>
              </div>

              {/* Informação de Pagamento e Troco */}
              <Show when={order().payment_method === 'cash'}>
                <div class="bg-amber-50 border-2 border-amber-400 rounded-xl p-3.5 text-center">
                  <span class="uppercase font-black text-amber-900 text-xs tracking-wider block">
                    Pagamento em Dinheiro no Local
                  </span>
                  <Show when={changeFor() > 0} fallback={
                    <span class="text-xs font-bold text-amber-800 mt-1 block">
                      Cliente informou valor exato (Sem troco solicitado)
                    </span>
                  }>
                    <div class="mt-2 space-y-1">
                      <p class="text-xs font-medium text-amber-800">
                        Cliente vai pagar com: <strong class="font-black text-amber-950 text-sm">R$ {changeFor().toFixed(2)}</strong>
                      </p>
                      <div class="bg-amber-200/80 border border-amber-300 py-1.5 px-3 rounded-lg inline-block">
                        <span class="text-xs font-black text-amber-950">
                          Troco a devolver: R$ {changeToGive().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Show>
                </div>
              </Show>
              
              <Show when={order().payment_method === 'pix'}>
                <div class="bg-blue-50 border-2 border-blue-400 rounded-xl p-3.5 text-center">
                  <span class="font-black text-blue-900 text-sm block">PAGAMENTO VIA PIX</span>
                  <span class="text-xs font-medium text-blue-700 mt-0.5 block">
                    Conferir comprovante de transferência ou receber na entrega
                  </span>
                </div>
              </Show>

              <Show when={order().payment_method === 'card'}>
                <div class="bg-slate-100 border border-slate-300 rounded-xl p-3 text-center">
                  <span class="font-black text-slate-800 text-sm block">PAGAMENTO NA MAQUININHA</span>
                  <span class="text-xs font-medium text-slate-600 block">Cobrar no cartão de débito/crédito</span>
                </div>
              </Show>

              {/* Alerta de erro de ação */}
              <Show when={actionError()}>
                <div class="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                  <IconAlertTriangle class="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionError()}</span>
                </div>
              </Show>

              {/* Botões de Ação do Fluxo de Entrega */}
              <div class="pt-2 space-y-2.5">
                {/* Se estiver no estado 'asignado', motoboy pode clicar em 'A CAMINHO' */}
                <Show when={order().status === 'asignado'}>
                  <button 
                    type="button"
                    onClick={handleStartRoute}
                    disabled={isUpdatingStatus()}
                    class="w-full min-h-[50px] bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-base tracking-wide rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Show when={isUpdatingStatus()} fallback={
                      <>
                        <IconMotorcycle class="w-5 h-5 text-white" />
                        <span>INICIAR ROTA (SAIR DA BASE)</span>
                      </>
                    }>
                      <IconRotateCw class="w-5 h-5 animate-spin motion-reduce:animate-none" />
                      <span>Atualizando status...</span>
                    </Show>
                  </button>
                </Show>

                {/* Botão de Finalização / Vasilhame */}
                <button 
                  type="button"
                  onClick={() => { setShowModal(true); setCylinderReceived(null); setModalError(null); }}
                  class="w-full min-h-[54px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-lg tracking-wide rounded-xl shadow-md active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <IconCheck class="w-6 h-6 text-white" />
                  <span>FINALIZAR ENTREGA</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal de Validação de Vasilhame (Regra BR-002) */}
          <Show when={showModal()}>
            <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
              <div class="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 class="text-xl font-black text-slate-900 tracking-tight">Retorno de Vasilhame</h3>
                  <button 
                    type="button"
                    onClick={() => { setShowModal(false); setModalError(null); }}
                    class="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                    aria-label="Fechar modal"
                  >
                    <IconX class="w-5 h-5" />
                  </button>
                </div>

                <p class="text-sm font-semibold text-slate-700 mb-4">
                  O cliente entregou o botijão de gás vazio (casco) para reposição?
                </p>
                
                <div class="space-y-3 mb-6">
                  <button 
                    type="button"
                    onClick={() => setCylinderReceived(true)}
                    class="w-full min-h-[60px] p-4 rounded-xl border-2 text-left font-bold text-base transition-colors flex items-center justify-between cursor-pointer"
                    classList={{
                      'border-emerald-600 bg-emerald-50 text-emerald-950': cylinderReceived() === true,
                      'border-slate-200 text-slate-800 active:bg-slate-50': cylinderReceived() !== true
                    }}
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0" classList={{
                        'bg-emerald-600 text-white': cylinderReceived() === true,
                        'border-2 border-slate-300 text-transparent': cylinderReceived() !== true
                      }}>
                        <IconCheck class="w-4 h-4" />
                      </div>
                      <div>
                        <span class="block leading-tight">Sim, recolhi o botijão vazio</span>
                        <span class="text-xs font-medium text-emerald-800">Troca regular de refil (sem taxa)</span>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setCylinderReceived(false)}
                    class="w-full min-h-[60px] p-4 rounded-xl border-2 text-left font-bold text-base transition-colors flex items-center justify-between cursor-pointer"
                    classList={{
                      'border-rose-500 bg-rose-50 text-rose-950': cylinderReceived() === false,
                      'border-slate-200 text-slate-800 active:bg-slate-50': cylinderReceived() !== false
                    }}
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0" classList={{
                        'bg-rose-600 text-white': cylinderReceived() === false,
                        'border-2 border-slate-300 text-transparent': cylinderReceived() !== false
                      }}>
                        <IconX class="w-4 h-4" />
                      </div>
                      <div>
                        <span class="block leading-tight">Não entregou o vazio</span>
                        <span class="text-xs font-semibold text-rose-700">Adicionar taxa de casco: R$ {penaltyFee().toFixed(2)}</span>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Cálculo recalculado se não entregou o casco */}
                <Show when={cylinderReceived() === false}>
                  <div class="bg-rose-50 p-4 rounded-xl border border-rose-200 mb-5">
                    <div class="flex justify-between items-center text-xs font-semibold text-rose-800">
                      <span>Valor do Pedido:</span>
                      <span>R$ {Number(order().total_amount).toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs font-semibold text-rose-800 mt-1">
                      <span>+ Taxa Vasilhame:</span>
                      <span>R$ {penaltyFee().toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between items-center pt-2 mt-2 border-t border-rose-200">
                      <span class="text-xs font-black uppercase text-rose-950">Novo Total a Cobrar:</span>
                      <span class="text-2xl font-black text-rose-700">R$ {finalTotal().toFixed(2)}</span>
                    </div>
                    <Show when={order().payment_method === 'cash' && changeFor() > 0}>
                      <div class="mt-2 pt-2 border-t border-rose-200 text-xs font-bold text-rose-900">
                        Novo troco para R$ {changeFor().toFixed(2)}: R$ {changeToGive().toFixed(2)}
                      </div>
                    </Show>
                  </div>
                </Show>

                <Show when={modalError()}>
                  <div class="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold p-3 rounded-xl mb-4 flex items-center gap-2">
                    <IconAlertTriangle class="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{modalError()}</span>
                  </div>
                </Show>

                <div class="space-y-2">
                  <button 
                    type="button"
                    onClick={handleFinish}
                    disabled={cylinderReceived() === null || isFinishing()}
                    class="w-full min-h-[52px] text-base font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl disabled:bg-slate-300 disabled:text-slate-500 active:bg-black transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Show when={isFinishing()} fallback={<span>CONFIRMAR E FINALIZAR</span>}>
                      <IconRotateCw class="w-5 h-5 animate-spin motion-reduce:animate-none" />
                      <span>Registrando no banco...</span>
                    </Show>
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setShowModal(false); setModalError(null); }}
                    disabled={isFinishing()}
                    class="w-full min-h-[44px] text-xs font-bold text-slate-600 hover:text-slate-900 active:text-slate-950 rounded-xl transition-colors cursor-pointer"
                  >
                    Voltar ao Pedido
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
