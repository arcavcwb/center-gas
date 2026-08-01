import { createSignal, createMemo, For, Show } from 'solid-js';

// Mocked products matching the PRD and SQL Migration
const PRODUCTS = [
  { id: '1', name: 'Gás P13 (Recarga)', type: 'gas_refill', price: 100.00, desc: 'Debes entregar envase vacío' },
  { id: '2', name: 'Gás P13 COMPLETO', type: 'gas_full', price: 300.00, desc: 'Incluye Casco Nuevo' },
  { id: '3', name: 'Água 20L', type: 'water', price: 15.00, desc: 'Galón retornable' },
];

export default function Catalog() {
  const [cart, setCart] = createSignal<Record<string, number>>({});
  const [phone, setPhone] = createSignal('');
  const [address, setAddress] = createSignal('');
  const [paymentMethod, setPaymentMethod] = createSignal<'cash' | 'pix'>('cash');
  const [changeFor, setChangeFor] = createSignal<number | null>(null);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [orderSuccess, setOrderSuccess] = createSignal(false);

  const total = createMemo(() => {
    return Object.entries(cart()).reduce((acc, [id, qty]) => {
      const product = PRODUCTS.find(p => p.id === id);
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

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (total() === 0) return alert('El carrito está vacío');
    if (!phone() || !address()) return alert('Por favor ingresa tu teléfono y dirección');

    setIsSubmitting(true);

    // MOCK: Simular latencia de red hacia Supabase
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Aquí iría el insert real a Supabase `orders`
    console.log("Order payload:", {
      phone: phone(),
      address: address(),
      cart: cart(),
      total: total(),
      paymentMethod: paymentMethod(),
      changeFor: changeFor()
    });

    setIsSubmitting(false);
    setOrderSuccess(true);
  };

  return (
    <div class="space-y-6">
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
          <For each={PRODUCTS}>
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

        <form onSubmit={handleSubmit} class="mt-8 space-y-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-gray-800 border-b pb-2">Datos de Entrega</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input 
                type="tel" 
                value={phone()} 
                onInput={(e) => setPhone(e.currentTarget.value)}
                placeholder="(41) 99999-9999"
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dirección Exacta</label>
              <textarea 
                value={address()} 
                onInput={(e) => setAddress(e.currentTarget.value)}
                placeholder="Rua, Número, Barrio, Referencia..."
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border"
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
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border"
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
    </div>
  );
}
