import { createSignal, Show } from 'solid-js';

// Mocked order data based on PRD UI/UX
const MOCK_ORDER = {
  id: 'PED-104',
  customer_name: 'Carlos Silva',
  address: 'Rua João Bley 633 - Pinheirinho',
  items: '1x Recarga P13',
  payment_method: 'Efectivo',
  total_to_collect: 100.00,
  change_for: 200.00, // Troco
  requires_empty_cylinder: true
};

const PENALTY_FEE = 200.00; // Costo del envase vacío si el cliente no lo entrega

export default function DriverApp() {
  const [showModal, setShowModal] = createSignal(false);
  const [cylinderReceived, setCylinderReceived] = createSignal<boolean | null>(null);
  const [isFinishing, setIsFinishing] = createSignal(false);
  const [completed, setCompleted] = createSignal(false);

  const finalTotal = () => {
    return MOCK_ORDER.total_to_collect + (cylinderReceived() === false ? PENALTY_FEE : 0);
  };

  const handleFinish = async () => {
    if (cylinderReceived() === null) return alert("Debes confirmar si recogiste el envase vacío.");
    
    setIsFinishing(true);
    // Simular API request a Supabase
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsFinishing(false);
    setShowModal(false);
    setCompleted(true);
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MOCK_ORDER.address)}`;

  return (
    <div class="space-y-4">
      <Show when={completed()}>
        <div class="bg-green-100 border-2 border-green-500 rounded-2xl p-6 text-center shadow-lg">
          <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 class="text-2xl font-black text-green-900 mb-2">ENTREGA EXITOSA</h2>
          <p class="text-green-800 font-medium text-lg">Total cobrado: R$ {finalTotal().toFixed(2)}</p>
          <button onClick={() => setCompleted(false)} class="mt-6 font-bold text-green-700 underline p-4 active:text-green-900">Volver a inicio</button>
        </div>
      </Show>

      <Show when={!completed()}>
        {/* Order Card */}
        <div class="bg-white rounded-3xl shadow-sm border-2 border-gray-100 overflow-hidden">
          <div class="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
            <span class="font-black text-gray-800 text-xl">#{MOCK_ORDER.id}</span>
            <span class="bg-yellow-100 text-yellow-800 font-bold px-3 py-1 rounded-lg text-sm">EN CAMINO</span>
          </div>
          
          <div class="p-5 space-y-5">
            <div>
              <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Cliente</p>
              <p class="text-xl font-bold text-gray-900">{MOCK_ORDER.customer_name}</p>
            </div>
            
            <div class="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <p class="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-1">Dirección</p>
              <p class="text-lg font-medium text-gray-900 leading-tight mb-4">{MOCK_ORDER.address}</p>
              
              <a 
                href={mapsUrl}
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
                  <span class="font-bold text-gray-900 text-lg">{MOCK_ORDER.items}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-700">Total:</span>
                  <span class="font-black text-primary text-2xl">R$ {MOCK_ORDER.total_to_collect.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Show when={MOCK_ORDER.payment_method === 'Efectivo'}>
              <div class="bg-orange-100 border-2 border-primary rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span class="uppercase font-bold text-orange-800 text-sm mb-1">¡Atención! Pago en Efectivo</span>
                <span class="font-black text-orange-900 text-2xl">Llevar Troco de: R$ {MOCK_ORDER.change_for.toFixed(2)}</span>
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
            <div class="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10">
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
