import { createSignal, createMemo, createEffect, For, Show } from 'solid-js';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  type: string;
  price: number;
  desc: string;
}

interface Neighborhood {
  id: string;
  name: string;
}

export default function Catalog() {
  const [step, setStep] = createSignal<'phone' | 'register' | 'catalog'>('phone');
  
  const [products, setProducts] = createSignal<Product[]>([]);
  const [neighborhoods, setNeighborhoods] = createSignal<Neighborhood[]>([]);
  const [cart, setCart] = createSignal<Record<string, number>>({});
  
  const [phone, setPhone] = createSignal('');
  const [name, setName] = createSignal('');
  const [address, setAddress] = createSignal('');
  const [neighborhoodId, setNeighborhoodId] = createSignal('');
  
  const [paymentMethod, setPaymentMethod] = createSignal<'cash' | 'pix'>('cash');
  const [changeFor, setChangeFor] = createSignal<number | null>(null);
  
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [orderSuccess, setOrderSuccess] = createSignal(false);
  const [submitError, setSubmitError] = createSignal<string | null>(null);

  // Fetch real products and neighborhoods on mount
  createEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).then(({ data }) => {
      if (data) {
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          type: p.sku,
          price: p.price,
          desc: p.includes_cylinder ? 'Incluye Casco Nuevo' : 'Recarga normal'
        })));
      }
    });

    supabase.from('neighborhoods').select('id, name').eq('is_active', true).then(({ data }) => {
      if (data) setNeighborhoods(data);
    });
    
    // Check URL for phone
    const urlParams = new URLSearchParams(window.location.search);
    const phoneParam = urlParams.get('phone');
    if (phoneParam && step() === 'phone') {
      setPhone(phoneParam);
      handlePhoneCheck(phoneParam);
    }
  });

  const total = createMemo(() => {
    return Object.entries(cart()).reduce((acc, [id, qty]) => {
      const product = products().find(p => p.id === id);
      return acc + (product ? product.price * qty : 0);
    }, 0);
  });

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const newCart = { ...prev };
      if (next === 0) delete newCart[id];
      else newCart[id] = next;
      return newCart;
    });
  };

  const handlePhoneCheck = async (checkPhone: string) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const { data, error } = await supabase.rpc('check_customer_exists', { p_phone: checkPhone });
    setIsSubmitting(false);
    console.log("RPC Response:", JSON.stringify({ data, error }));
    
    if (error) {
      setSubmitError('Error de conexión. Intenta de nuevo.');
      return;
    }
    
    if (data && data.exists) {
      setAddress(data.address_line || '');
      setNeighborhoodId(data.neighborhood_id || '');
      setStep('catalog');
    } else {
      setStep('register');
    }
  };

  const submitPhone = (e: Event) => {
    e.preventDefault();
    if (!phone()) return;
    handlePhoneCheck(phone());
  };

  const submitRegister = async (e: Event) => {
    e.preventDefault();
    if (!name() || !neighborhoodId() || !address()) {
      setSubmitError('Completa todos los campos');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    const { error } = await supabase.rpc('register_b2c_customer', {
      p_phone: phone(),
      p_name: name(),
      p_neighborhood_id: neighborhoodId(),
      p_address_line: address()
    });
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error.message);
    } else {
      setStep('catalog');
    }
  };

  const handleSubmitOrder = async (e: Event) => {
    e.preventDefault();
    setSubmitError(null);
    if (total() === 0) {
      setSubmitError('El carrito está vacío');
      return;
    }
    if (!phone() || !address()) {
      setSubmitError('Por favor verifica tu teléfono y dirección');
      return;
    }

    setIsSubmitting(true);

    const p_items = Object.entries(cart()).map(([id, qty]) => ({
      product_id: id,
      quantity: qty
    }));

    const { error } = await supabase.rpc('create_b2c_order', {
      p_phone: phone(),
      p_address_line: address(),
      p_items,
      p_payment_method: paymentMethod(),
      p_cash_change_for: changeFor()
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Error creating order:", error);
      setSubmitError(error.message || JSON.stringify(error));
    } else {
      setOrderSuccess(true);
    }
  };

  return (
    <div class="space-y-6">
      
      {/* ----------------- STEP 1: PHONE ----------------- */}
      <Show when={step() === 'phone'}>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 class="text-xl font-bold text-gray-800 mb-2">Ingresa tu WhatsApp</h2>
          <p class="text-sm text-gray-500 mb-6">Para continuar con tu pedido, necesitamos identificarte.</p>
          
          <Show when={submitError()}>
            <div data-testid="submit-error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm mb-4">
              <p class="text-sm text-red-700">{submitError()}</p>
            </div>
          </Show>

          <form onSubmit={submitPhone} class="space-y-4">
            <div>
              <input 
                type="tel" 
                value={phone()} 
                onInput={(e) => setPhone(e.currentTarget.value)}
                placeholder="(41) 99999-9999"
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-3 px-4 border outline-none text-lg"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting()}
              class="w-full py-3 px-6 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-primary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all"
            >
              {isSubmitting() ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        </div>
      </Show>

      {/* ----------------- STEP 2: REGISTER ----------------- */}
      <Show when={step() === 'register'}>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 class="text-xl font-bold text-gray-800 mb-2">¡Hola! Es tu primera vez</h2>
          <p class="text-sm text-gray-500 mb-6">Completa tus datos para crear tu cuenta y guardar tu dirección.</p>
          
          <Show when={submitError()}>
            <div data-testid="submit-error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm mb-4">
              <p class="text-sm text-red-700">{submitError()}</p>
            </div>
          </Show>

          <form onSubmit={submitRegister} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre o Apodo</label>
              <input 
                type="text" 
                value={name()} 
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder="Ej. João Silva"
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
              <select 
                value={neighborhoodId()} 
                onChange={(e) => setNeighborhoodId(e.currentTarget.value)}
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border outline-none bg-white"
                required
              >
                <option value="" disabled>Selecciona tu barrio...</option>
                <For each={neighborhoods()}>
                  {(n) => <option value={n.id}>{n.name}</option>}
                </For>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dirección Exacta</label>
              <textarea 
                value={address()} 
                onInput={(e) => setAddress(e.currentTarget.value)}
                placeholder="Rua, Número, Referencia..."
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border outline-none"
                rows="2"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting()}
              class="w-full py-3 px-6 mt-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-primary hover:bg-orange-600 focus:outline-none transition-all"
            >
              {isSubmitting() ? 'Registrando...' : 'Guardar y Ver Catálogo'}
            </button>
          </form>
        </div>
      </Show>

      {/* ----------------- STEP 3: CATALOG & CHECKOUT ----------------- */}
      <Show when={step() === 'catalog'}>
        <Show when={orderSuccess()}>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-sm">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">¡Pedido Confirmado!</h3>
                <p class="mt-2 text-sm text-green-700">Tu pedido ha sido recibido y está siendo procesado. Te contactaremos por WhatsApp.</p>
              </div>
            </div>
          </div>
        </Show>

        <Show when={!orderSuccess()}>
          <div class="space-y-4">
            <Show when={submitError()}>
              <div data-testid="submit-error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm mb-4">
                <p class="text-sm text-red-700">{submitError()}</p>
              </div>
            </Show>
            <Show when={products().length === 0}>
              <div class="text-center p-8 text-gray-500">Cargando catálogo...</div>
            </Show>
            <For each={products()}>
              {(product) => (
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:shadow-md">
                  <div>
                    <h3 class="font-bold text-gray-900">{product.name}</h3>
                    <p class="text-xs text-gray-500 mt-0.5">{product.desc}</p>
                    <p class="text-primary font-semibold mt-1">R$ {product.price.toFixed(2)}</p>
                  </div>
                  <div class="flex items-center space-x-3 bg-surface p-1 rounded-full border border-gray-100">
                    <button 
                      onClick={() => updateQty(product.id, -1)}
                      class="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-primary shadow-sm transition-colors"
                    >
                      -
                    </button>
                    <span class="font-medium text-gray-800 w-4 text-center">{cart()[product.id] || 0}</span>
                    <button 
                      onClick={() => updateQty(product.id, 1)}
                      class="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>

          <form onSubmit={handleSubmitOrder} class="mt-8 space-y-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="font-bold text-gray-800 border-b pb-2">Datos de Entrega</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input 
                  type="tel" 
                  value={phone()} 
                  class="w-full border-gray-300 rounded-lg shadow-sm bg-gray-50 text-gray-500 py-2 px-3 border outline-none cursor-not-allowed"
                  disabled
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Dirección Exacta</label>
                <textarea 
                  value={address()} 
                  onInput={(e) => setAddress(e.currentTarget.value)}
                  placeholder="Rua, Número, Barrio, Referencia..."
                  class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border outline-none"
                  rows="2"
                  required
                />
              </div>
            </div>

            <h3 class="font-bold text-gray-800 border-b pb-2 mt-6">Pago (Total: R$ {total().toFixed(2)})</h3>
            
            <div class="space-y-3">
              <label class="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" classList={{'border-primary bg-orange-50/30': paymentMethod() === 'cash'}}>
                <input type="radio" name="payment" value="cash" checked={paymentMethod() === 'cash'} onChange={() => setPaymentMethod('cash')} class="text-primary focus:ring-primary" />
                <span class="ml-3 font-medium text-gray-900">Efectivo al recibir</span>
              </label>
              <label class="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" classList={{'border-secondary bg-blue-50/30': paymentMethod() === 'pix'}}>
                <input type="radio" name="payment" value="pix" checked={paymentMethod() === 'pix'} onChange={() => {setPaymentMethod('pix'); setChangeFor(null);}} class="text-secondary focus:ring-secondary" />
                <span class="ml-3 font-medium text-gray-900">PIX en la entrega</span>
              </label>
            </div>

            <Show when={paymentMethod() === 'cash'}>
              <div class="bg-surface p-4 rounded-xl border border-gray-100 mt-3">
                <label class="block text-sm font-medium text-gray-700 mb-2">¿Necesitas vuelto (Troco)?</label>
                <select 
                  class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border outline-none"
                  onChange={(e) => setChangeFor(e.currentTarget.value ? Number(e.currentTarget.value) : null)}
                >
                  <option value="">No, pagaré el monto exacto</option>
                  <option value={Math.ceil(total() / 50) * 50}>Troco para R$ {Math.ceil(total() / 50) * 50}</option>
                  <option value={Math.ceil(total() / 100) * 100}>Troco para R$ {Math.ceil(total() / 100) * 100}</option>
                </select>
              </div>
            </Show>

            <button 
              type="submit" 
              disabled={total() === 0 || isSubmitting()}
              class="w-full py-4 px-6 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-primary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
            >
              {isSubmitting() ? 'Procesando...' : `PEDIR AHORA (R$ ${total().toFixed(2)})`}
            </button>
          </form>
        </Show>
      </Show>
    </div>
  );
}
