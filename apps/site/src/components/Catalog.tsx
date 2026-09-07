import { createSignal, createMemo, createEffect, onMount, onCleanup, For, Show } from 'solid-js';
import { supabase } from '../lib/supabase';
import {
  calculateComboDiscount,
  validateCashChange,
  normalizeWhatsAppPhone,
  formatBRL,
  isWithinBusinessHours,
  getNextDeliverySlot,
  t,
  type CartItemLike,
  type SupportedLang
} from '@center-gas/contracts';
import LanguageToggle from './LanguageToggle';

interface Product {
  id: string;
  name: string;
  sku: string;
  type: string;
  price: number;
  desc: string;
  includes_cylinder: boolean;
}

interface Neighborhood {
  id: string;
  name: string;
  delivery_fee?: number;
}

export default function Catalog() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const hasTokenFromUrl = !!urlParams?.get('token');
  
  // Idioma inicial (Português PT-BR por defecto, o persistido)
  const getInitialLang = (): SupportedLang => {
    if (typeof window !== 'undefined') {
      const urlLang = urlParams?.get('lang');
      if (urlLang === 'es' || urlLang === 'pt') return urlLang;
      const saved = localStorage.getItem('center_gas_lang');
      if (saved === 'es' || saved === 'pt') return saved;
    }
    return 'pt';
  };

  const [lang, setLangState] = createSignal<SupportedLang>(getInitialLang());

  const setLang = (newLang: SupportedLang) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('center_gas_lang', newLang);
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLang);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const [step, setStep] = createSignal<'loading' | 'phone' | 'register' | 'catalog'>(hasTokenFromUrl ? 'loading' : 'phone');
  const [customerName, setCustomerName] = createSignal('');
  
  const [products, setProducts] = createSignal<Product[]>([]);
  const [neighborhoods, setNeighborhoods] = createSignal<Neighborhood[]>([]);
  const [cart, setCart] = createSignal<Record<string, number>>({});
  
  const [phone, setPhone] = createSignal('');
  const [name, setName] = createSignal('');
  const [cep, setCep] = createSignal('');
  const [address, setAddress] = createSignal('');
  const [neighborhoodId, setNeighborhoodId] = createSignal('');
  
  const [paymentMethod, setPaymentMethod] = createSignal<'cash' | 'pix'>('cash');
  const [changeFor, setChangeFor] = createSignal<number | null>(null);
  const [isCustomChange, setIsCustomChange] = createSignal(false);
  const [customChangeInput, setCustomChangeInput] = createSignal('');
  const [token, setToken] = createSignal<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [orderSuccess, setOrderSuccess] = createSignal(false);
  const [submitError, setSubmitError] = createSignal<string | null>(null);
  const [isOnline, setIsOnline] = createSignal(typeof navigator !== 'undefined' ? navigator.onLine : true);

  onMount(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      onCleanup(() => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      });
    }
  });

  // Fetch real products and neighborhoods on mount
  createEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).then(({ data }) => {
      if (data) {
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          type: p.sku,
          price: Number(p.price),
          desc: p.includes_cylinder 
            ? t('descFull', lang()) 
            : t('descRefill', lang()),
          includes_cylinder: p.includes_cylinder || false
        })));
      }
    });

    supabase.from('neighborhoods').select('id, name, delivery_fee').eq('is_active', true).then(({ data }) => {
      if (data) {
        const list = data.map(n => ({
          id: n.id,
          name: n.name,
          delivery_fee: Number(n.delivery_fee || 0)
        }));
        setNeighborhoods(list);

        // Preselección de Pinheirinho como barrio principal
        if (!neighborhoodId()) {
          const pinheirinho = list.find(n => n.name.toLowerCase().includes('pinheirinho'));
          if (pinheirinho) setNeighborhoodId(pinheirinho.id);
        }
      }
    });
    
    // Check URL for token (WhatsApp flow)
    const urlToken = urlParams?.get('token');
    if (urlToken && (step() === 'phone' || step() === 'loading')) {
      setToken(urlToken);
      handleTokenCheck(urlToken);
    }
  });

  const subtotal = createMemo(() => {
    return Object.entries(cart()).reduce((acc, [id, qty]) => {
      const product = products().find(p => p.id === id);
      return acc + (product ? product.price * qty : 0);
    }, 0);
  });

  const comboDiscount = createMemo(() => {
    const items: CartItemLike[] = Object.entries(cart()).map(([id, qty]) => {
      const p = products().find(prod => prod.id === id);
      return {
        sku: p?.sku || '',
        price: p?.price || 0,
        quantity: qty,
        includes_cylinder: p?.includes_cylinder
      };
    });
    return calculateComboDiscount(items);
  });

  const deliveryFee = createMemo(() => {
    const n = neighborhoods().find(item => item.id === neighborhoodId());
    return n?.delivery_fee || 0;
  });

  const total = createMemo(() => {
    return Math.max(0, subtotal() + deliveryFee() - comboDiscount());
  });

  const suggestedCashOptions = createMemo(() => {
    const currentTotal = total();
    if (currentTotal <= 0) return [];
    const opt50 = Math.ceil(currentTotal / 50) * 50;
    const opt100 = Math.ceil(currentTotal / 100) * 100;
    const set = new Set<number>();
    set.add(opt50 > currentTotal ? opt50 : opt50 + 50);
    set.add(opt100 > currentTotal ? opt100 : opt100 + 100);
    return Array.from(set).sort((a, b) => a - b);
  });

  const deliverySlot = createMemo(() => getNextDeliverySlot(new Date()));
  const isScheduled = createMemo(() => deliverySlot().isScheduled);

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

  const handleTokenCheck = async (checkToken: string) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const { data, error } = await supabase.rpc('resolve_catalog_session', { p_token: checkToken });
    setIsSubmitting(false);
    
    if (error) {
      setSubmitError(t('connectionError', lang()));
      setStep('phone');
      return;
    }
    
    if (data && data.valid) {
      setPhone(data.phone || '');
      if (data.exists) {
        setCustomerName(data.name || '');
        setAddress(data.address_line || '');
        setNeighborhoodId(data.neighborhood_id || '');
        setStep('catalog');
      } else {
        setStep('register');
      }
    } else {
      setSubmitError(data?.message || t('expiredSession', lang()));
      setStep('phone');
    }
  };

  const handlePhoneCheck = async (checkPhone: string) => {
    const normalized = normalizeWhatsAppPhone(checkPhone);
    if (!normalized) {
      setSubmitError(t('phoneError', lang()));
      return;
    }
    setPhone(normalized);
    setIsSubmitting(true);
    setSubmitError(null);
    const { data, error } = await supabase.rpc('check_customer_exists', { p_phone: normalized });
    setIsSubmitting(false);
    
    if (error) {
      setSubmitError(t('connectionError', lang()));
      return;
    }
    
    if (data && data.exists) {
      setCustomerName(data.name || '');
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

  const handleCepChange = async (e: Event) => {
    const val = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '');
    setCep(val);
    if (val.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setAddress(`${data.logradouro}, , ${data.bairro}, ${data.localidade} - ${data.uf}`);
          const matched = neighborhoods().find(n => n.name.toLowerCase() === data.bairro.toLowerCase());
          if (matched) setNeighborhoodId(matched.id);
        }
      } catch (err) {
        console.error("ViaCEP error", err);
      }
    }
  };

  const submitRegister = async (e: Event) => {
    e.preventDefault();
    if (!name() || !neighborhoodId() || !address()) {
      setSubmitError(t('fillAllFields', lang()));
      return;
    }
    const normalized = normalizeWhatsAppPhone(phone());
    setIsSubmitting(true);
    setSubmitError(null);
    const { error } = await supabase.rpc('register_b2c_customer', {
      p_phone: normalized,
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
      setSubmitError(t('emptyCartError', lang()));
      return;
    }
    if (!phone() || !address()) {
      setSubmitError(t('verifyPhoneAddressError', lang()));
      return;
    }

    if (paymentMethod() === 'cash' && changeFor() !== null) {
      const validation = validateCashChange(total(), changeFor(), lang());
      if (!validation.isValid) {
        setSubmitError(validation.error || t('trocoTitle', lang()));
        return;
      }
    }

    const normalized = normalizeWhatsAppPhone(phone());
    setIsSubmitting(true);

    const p_items = Object.entries(cart()).map(([id, qty]) => ({
      product_id: id,
      quantity: qty
    }));

    const { error } = await supabase.rpc('create_b2c_order', {
      p_phone: normalized,
      p_address_line: address(),
      p_items,
      p_payment_method: paymentMethod(),
      p_cash_change_for: changeFor(),
      p_is_scheduled: isScheduled(),
      p_scheduled_for: isScheduled() ? deliverySlot().scheduledDate.toISOString() : null
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
    <div class="space-y-5">

      {/* ----------------- ALERTA OFFLINE (Resiliencia / Harden) ----------------- */}
      <Show when={!isOnline()}>
        <div role="alert" class="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-xs">
          <span class="text-lg select-none">📡</span>
          <p class="leading-snug">{t('offlineBanner', lang())}</p>
        </div>
      </Show>

      {/* ----------------- BANNER DE ATENDIMENTO & SELECTOR DE IDIOMA ----------------- */}
      <Show when={isScheduled()}>
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3 sm:p-4 rounded-2xl shadow-md border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 text-center sm:text-left">
            <span class="text-2xl">🌙</span>
            <div>
              <p class="text-xs sm:text-sm font-extrabold tracking-tight text-amber-300">
                {t('scheduledBannerTitle', lang())}
              </p>
              <p class="text-xs text-indigo-200 font-medium">
                {t('scheduledBannerDesc', lang())}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="bg-indigo-900/90 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-inner">
              📅 {lang() === 'pt' ? deliverySlot().formattedPT : deliverySlot().formattedES}
            </span>
            <LanguageToggle lang={lang()} onToggle={setLang} />
          </div>
        </div>
      </Show>

      <Show when={!isScheduled()}>
        <div class="bg-gradient-to-r from-orange-600 via-primary to-orange-500 text-white p-3 sm:p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-center gap-2 text-center sm:text-left">
            <span class="text-xl">🚚</span>
            <div>
              <p class="text-xs sm:text-sm font-extrabold tracking-tight">{t('banner', lang())}</p>
              <p class="text-xs text-orange-100 font-medium">{t('brandSubtitle', lang())}</p>
            </div>
          </div>
          <LanguageToggle lang={lang()} onToggle={setLang} />
        </div>
      </Show>

      {/* ----------------- STEP 0: LOADING (WhatsApp flow) ----------------- */}
      <Show when={step() === 'loading'}>
        <div class="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[200px]">
          <div class="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
          <p class="text-lg font-bold text-gray-800">{t('loadingTitle', lang())}</p>
          <p class="text-sm text-gray-500 mt-1">{t('loadingSubtitle', lang())}</p>
        </div>
      </Show>
      
      {/* ----------------- STEP 1: PHONE (Acceso sin WhatsApp token) ----------------- */}
      <Show when={step() === 'phone'}>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 class="text-xl font-bold text-gray-800 mb-2">{t('phoneTitle', lang())}</h2>
          <p class="text-sm text-gray-500 mb-6">{t('phoneDesc', lang())}</p>
          
          <Show when={submitError()}>
            <div data-testid="submit-error" class="bg-red-50/80 border border-red-200 p-3.5 rounded-xl text-red-700 text-sm font-medium shadow-xs mb-4 flex items-start gap-2.5">
              <span class="text-base leading-none select-none">⚠️</span>
              <p class="leading-snug">{submitError()}</p>
            </div>
          </Show>

          <form onSubmit={submitPhone} class="space-y-4">
            <div>
              <input 
                type="tel" 
                value={phone()} 
                onInput={(e) => setPhone(e.currentTarget.value)}
                placeholder={t('phonePlaceholder', lang())}
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-3 px-4 border outline-none text-lg"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting()}
              class="w-full py-3.5 px-6 border border-transparent rounded-xl shadow-md text-base font-extrabold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting() ? t('phoneVerifying', lang()) : t('phoneBtn', lang())}
            </button>
          </form>
        </div>
      </Show>

      {/* ----------------- STEP 2: REGISTER ----------------- */}
      <Show when={step() === 'register'}>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 class="text-xl font-bold text-gray-800 mb-2">{t('registerTitle', lang())}</h2>
          <p class="text-sm text-gray-500 mb-6">{t('registerDesc', lang())}</p>
          
          <Show when={submitError()}>
            <div data-testid="submit-error" class="bg-red-50/80 border border-red-200 p-3.5 rounded-xl text-red-700 text-sm font-medium shadow-xs mb-4 flex items-start gap-2.5">
              <span class="text-base leading-none select-none">⚠️</span>
              <p class="leading-snug">{submitError()}</p>
            </div>
          </Show>

          <form onSubmit={submitRegister} class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{t('registerName', lang())}</label>
              <input 
                type="text" 
                value={name()} 
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder={t('registerNamePlaceholder', lang())}
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{t('registerCep', lang())}</label>
              <input 
                type="text" 
                value={cep()} 
                onInput={handleCepChange}
                placeholder="00000-000"
                maxLength="9"
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{t('registerNeighborhood', lang())}</label>
              <select 
                value={neighborhoodId()} 
                onChange={(e) => setNeighborhoodId(e.currentTarget.value)}
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border outline-none bg-white"
                required
              >
                <option value="" disabled>{t('registerNeighborhoodSelect', lang())}</option>
                <For each={neighborhoods()}>
                  {(n) => (
                    <option value={n.id}>
                      {n.name} {n.delivery_fee ? `(+ ${formatBRL(n.delivery_fee)})` : ''}
                    </option>
                  )}
                </For>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{t('registerAddress', lang())}</label>
              <textarea 
                value={address()} 
                onInput={(e) => setAddress(e.currentTarget.value)}
                placeholder={t('registerAddressPlaceholder', lang())}
                class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border outline-none"
                rows="2"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting()}
              class="w-full py-3.5 px-6 mt-4 border border-transparent rounded-xl shadow-md text-base font-extrabold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting() ? t('registerBtnLoading', lang()) : t('registerBtn', lang())}
            </button>
          </form>
        </div>
      </Show>

      {/* ----------------- STEP 3: CATALOG & CHECKOUT ----------------- */}
      <Show when={step() === 'catalog'}>
        <Show when={orderSuccess()}>
          <div class="bg-white border border-emerald-200 p-6 sm:p-8 rounded-2xl shadow-sm text-center space-y-4">
            <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner text-3xl">
              ✅
            </div>
            <div>
              <h3 class="text-xl font-black text-slate-900">{t('successTitle', lang())}</h3>
              <p class="mt-2 text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                {isScheduled() ? t('scheduledSuccessMessage', lang()) : t('successMessage', lang())}
              </p>
            </div>
            <div class="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-xl text-emerald-800 text-xs font-medium max-w-sm mx-auto flex items-center gap-2.5 text-left">
              <span class="text-base select-none">💬</span>
              <p class="leading-snug">{t('orderTrackingHint', lang())}</p>
            </div>
          </div>
        </Show>

        <Show when={!orderSuccess()}>
          <div class="space-y-4">
            {/* Banner de bienvenida para clientes recurrentes */}
            <Show when={customerName()}>
              <div class="bg-orange-50/70 border border-orange-200 p-4 rounded-xl shadow-xs">
                <p class="text-base font-bold text-slate-800">
                  {t('welcomeBack', lang(), { name: customerName() })}
                </p>
                <p class="text-sm text-slate-600 mt-0.5">
                  {t('yourAddress', lang(), { address: address() })}
                </p>
              </div>
            </Show>

            <Show when={submitError()}>
              <div data-testid="submit-error" class="bg-red-50/80 border border-red-200 p-3.5 rounded-xl text-red-700 text-sm font-medium shadow-xs mb-4 flex items-start gap-2.5">
                <span class="text-base leading-none select-none">⚠️</span>
                <p class="leading-snug">{submitError()}</p>
              </div>
            </Show>
            <Show when={products().length === 0}>
              <div class="space-y-3" aria-label={t('loadingCatalog', lang())} aria-busy="true">
                <div class="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex justify-between items-center animate-pulse motion-reduce:animate-none">
                  <div class="space-y-2.5 flex-1 pr-4">
                    <div class="h-5 bg-slate-200 rounded-md w-3/5"></div>
                    <div class="h-3.5 bg-slate-100 rounded-md w-4/5"></div>
                    <div class="h-6 bg-slate-200 rounded-md w-24"></div>
                  </div>
                  <div class="w-28 h-12 bg-slate-100 rounded-full"></div>
                </div>
                <div class="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex justify-between items-center animate-pulse motion-reduce:animate-none">
                  <div class="space-y-2.5 flex-1 pr-4">
                    <div class="h-5 bg-slate-200 rounded-md w-2/4"></div>
                    <div class="h-3.5 bg-slate-100 rounded-md w-3/4"></div>
                    <div class="h-6 bg-slate-200 rounded-md w-20"></div>
                  </div>
                  <div class="w-28 h-12 bg-slate-100 rounded-full"></div>
                </div>
              </div>
            </Show>
            <For each={products()}>
              {(product) => (
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:shadow-md">
                  <div>
                    <h3 class="font-bold text-gray-900 flex items-center gap-2">
                      {product.name}
                    </h3>
                    <Show when={product.includes_cylinder}>
                      <span class="inline-block mt-1 mb-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-extrabold rounded-full tracking-wide">
                        {t('badgeIncludesCylinder', lang())}
                      </span>
                    </Show>
                    <Show when={!product.includes_cylinder && (product.sku.toLowerCase().includes('p13') || product.sku.toLowerCase().includes('gas'))}>
                      <p class="text-xs text-amber-700 font-medium mt-0.5 flex items-center gap-1">
                        <span>🔄</span>
                        <span>{t('cylinderExchangeTip', lang())}</span>
                      </p>
                    </Show>
                    <p class="text-xs text-gray-500 mt-1 leading-tight">
                      {product.includes_cylinder ? t('descFull', lang()) : t('descRefill', lang())}
                    </p>
                    <p class="text-orange-700 font-extrabold mt-1.5 text-lg">{formatBRL(product.price)}</p>
                  </div>
                  <div class="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-full border border-slate-200">
                    <button 
                      type="button"
                      onClick={() => updateQty(product.id, -1)}
                      aria-label={`Diminuir quantidade de ${product.name}`}
                      class="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 font-extrabold text-lg shadow-xs transition-transform duration-100 ease-out active:scale-90 motion-reduce:active:scale-100 cursor-pointer"
                    >
                      −
                    </button>
                    <span class="font-bold text-slate-900 w-6 text-center text-base select-none tabular-nums">
                      {cart()[product.id] || 0}
                    </span>
                    <button 
                      type="button"
                      onClick={() => updateQty(product.id, 1)}
                      aria-label={`Aumentar quantidade de ${product.name}`}
                      class="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-lg shadow-xs transition-transform duration-100 ease-out active:scale-90 motion-reduce:active:scale-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>

          <form id="checkout-form" onSubmit={handleSubmitOrder} class="mt-6 space-y-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 scroll-mt-20">
            {/* ----------------- CROSS-SELLING (Water) ----------------- */}
            <Show when={products().find(p => (p.sku.toLowerCase().includes('water') || p.sku.toLowerCase().includes('agua')) && !cart()[p.id])}>
              {() => {
                const waterProduct = products().find(p => (p.sku.toLowerCase().includes('water') || p.sku.toLowerCase().includes('agua')) && !cart()[p.id])!;
                const hasGas = Object.entries(cart()).some(([id, qty]) => {
                  const prod = products().find(p => p.id === id);
                  return prod && (prod.sku.toLowerCase().includes('p13') || prod.sku.toLowerCase().includes('gas')) && qty > 0;
                });
                return (
                  <div class="bg-blue-50/70 border border-blue-200 p-4 rounded-xl mb-4 flex items-center justify-between shadow-sm">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-base">💧</span>
                        <h4 class="font-bold text-gray-800 text-sm">{t('crossSellTitle', lang())}</h4>
                      </div>
                      <p class="text-xs text-gray-600 mt-0.5">
                        {t('crossSellSubtitle', lang(), { product: waterProduct.name, price: formatBRL(waterProduct.price) })}
                      </p>
                      <Show when={hasGas}>
                        <span class="inline-block mt-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {t('crossSellComboBadge', lang())}
                        </span>
                      </Show>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateQty(waterProduct.id, 1)}
                      class="px-4 py-2 bg-secondary text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
                    >
                      {t('crossSellAdd', lang())}
                    </button>
                  </div>
                );
              }}
            </Show>

            <h3 class="font-bold text-gray-800 border-b pb-2">{t('deliveryDataTitle', lang())}</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">{t('registerAddress', lang())}</label>
                <textarea 
                  value={address()} 
                  onInput={(e) => setAddress(e.currentTarget.value)}
                  placeholder={t('registerAddressPlaceholder', lang())}
                  class="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary py-2 px-3 border outline-none"
                  rows="2"
                  required
                />
              </div>
            </div>

            {/* Resumen Financiero */}
            <div class="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
              <div class="flex justify-between text-sm text-gray-600">
                <span>{t('subtotalLabel', lang())}</span>
                <span>{formatBRL(subtotal())}</span>
              </div>
              <Show when={comboDiscount() > 0}>
                <div class="flex justify-between text-sm font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                  <span>{t('comboDiscountLabel', lang())}</span>
                  <span>-{formatBRL(comboDiscount())}</span>
                </div>
              </Show>
              <Show when={deliveryFee() > 0}>
                <div class="flex justify-between items-start text-sm text-gray-600">
                  <div>
                    <span>{t('deliveryFeeLabel', lang())}</span>
                    <p class="text-xs text-slate-500 font-normal">{t('deliveryNeighborhoodTip', lang())}</p>
                  </div>
                  <span class="font-medium">{formatBRL(deliveryFee())}</span>
                </div>
              </Show>
              <div class="flex justify-between text-base font-extrabold text-gray-900 border-t border-gray-200 pt-2">
                <span>{t('totalLabel', lang())}</span>
                <span class="text-orange-700 text-2xl font-black">{formatBRL(total())}</span>
              </div>
            </div>

            <Show when={isScheduled()}>
              <div class="bg-indigo-50 border border-indigo-200 text-indigo-950 p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-sm mt-4">
                <span class="text-lg">🌙</span>
                <div>
                  <p class="font-bold text-indigo-900">{t('scheduledOrderNotice', lang())}</p>
                  <p class="text-indigo-700 text-xs mt-0.5">
                    {lang() === 'pt' ? deliverySlot().formattedPT : deliverySlot().formattedES}
                  </p>
                </div>
              </div>
            </Show>

            <h3 class="font-bold text-gray-800 border-b pb-2 mt-6">{t('paymentTitle', lang())}</h3>
            
            <div class="space-y-3">
              <label class="flex items-center p-3.5 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" classList={{'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20': paymentMethod() === 'cash'}}>
                <input type="radio" name="payment" value="cash" checked={paymentMethod() === 'cash'} onChange={() => setPaymentMethod('cash')} class="text-orange-600 focus:ring-orange-500 w-4 h-4" />
                <span class="ml-3 font-semibold text-gray-900 text-sm">{t('paymentCash', lang())}</span>
              </label>
              <label class="flex items-center p-3.5 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" classList={{'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20': paymentMethod() === 'pix'}}>
                <input type="radio" name="payment" value="pix" checked={paymentMethod() === 'pix'} onChange={() => {setPaymentMethod('pix'); setChangeFor(null); setIsCustomChange(false);}} class="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                <span class="ml-3 font-semibold text-gray-900 text-sm">{t('paymentPix', lang())}</span>
              </label>
            </div>

            <Show when={paymentMethod() === 'cash'}>
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-3 space-y-3">
                <label class="block text-sm font-semibold text-slate-800">{t('trocoTitle', lang())}</label>
                <select 
                  class="w-full border-slate-300 rounded-lg shadow-xs focus:border-orange-600 focus:ring-orange-600 py-2.5 px-3 border outline-none bg-white text-sm font-medium text-slate-800 cursor-pointer"
                  onChange={(e) => {
                    const val = e.currentTarget.value;
                    if (val === 'custom') {
                      setIsCustomChange(true);
                      const num = Number(customChangeInput());
                      setChangeFor(num > 0 ? num : null);
                    } else if (val === '') {
                      setIsCustomChange(false);
                      setChangeFor(null);
                    } else {
                      setIsCustomChange(false);
                      setChangeFor(Number(val));
                    }
                  }}
                >
                  <option value="">{t('trocoExact', lang(), { amount: formatBRL(total()) })}</option>
                  <For each={suggestedCashOptions()}>
                    {(opt) => (
                      <option value={opt}>
                        {t('trocoOption', lang(), { amount: formatBRL(opt), change: formatBRL(opt - total()) })}
                      </option>
                    )}
                  </For>
                  <option value="custom">
                    {lang() === 'pt' ? 'Outro valor (digitar troco)...' : 'Otro monto (escribir cambio)...'}
                  </option>
                </select>

                <Show when={isCustomChange()}>
                  <div class="pt-1">
                    <label class="block text-xs font-medium text-slate-600 mb-1">
                      {lang() === 'pt' ? 'Pagar com nota de quanto? (R$)' : '¿Pagar con billete de cuánto? (R$)'}
                    </label>
                    <input 
                      type="number" 
                      step="1"
                      min={total()}
                      placeholder="Ex: 150"
                      value={customChangeInput()}
                      onInput={(e) => {
                        setCustomChangeInput(e.currentTarget.value);
                        const val = Number(e.currentTarget.value);
                        setChangeFor(val > 0 ? val : null);
                      }}
                      class="w-full border-slate-300 rounded-lg shadow-xs focus:border-orange-600 focus:ring-orange-600 py-2.5 px-3 border outline-none bg-white text-sm font-semibold"
                    />
                    <Show when={changeFor() && changeFor()! > total()}>
                      <p class="text-xs font-semibold text-emerald-700 mt-1.5">
                        {lang() === 'pt' 
                          ? `✅ Troco a receber: ${formatBRL(changeFor()! - total())}` 
                          : `✅ Cambio a recibir: ${formatBRL(changeFor()! - total())}`}
                      </p>
                    </Show>
                    <Show when={changeFor() && changeFor()! <= total()}>
                      <p class="text-xs font-semibold text-amber-700 mt-1.5">
                        {lang() === 'pt' 
                          ? `⚠️ O valor precisa ser maior que o total (${formatBRL(total())})` 
                          : `⚠️ El monto debe ser mayor al total (${formatBRL(total())})`}
                      </p>
                    </Show>
                  </div>
                </Show>
              </div>
            </Show>

            <button 
              type="submit" 
              disabled={total() === 0 || isSubmitting()}
              class="w-full py-4 px-6 border border-transparent rounded-xl shadow-md hover:shadow-lg text-lg font-extrabold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting() ? t('submittingOrder', lang()) : t('submitOrderBtn', lang(), { amount: formatBRL(total()) })}
            </button>
          </form>
        </Show>
      </Show>

      {/* ----------------- BARRA FLOTANTE DE CHECKOUT RÁPIDO MOBILE ----------------- */}
      <Show when={step() === 'catalog' && total() > 0 && !orderSuccess()}>
        <aside 
          aria-label="Resumo do pedido" 
          class="fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md shadow-2xl border-t border-slate-200 z-40 transition-transform duration-300 ease-out motion-reduce:transition-none"
        >
          <div class="max-w-md mx-auto flex items-center justify-between gap-3">
            <div>
              <p class="text-xs text-slate-500 font-medium leading-none">Total com entrega:</p>
              <p class="text-xl font-black text-slate-900 leading-tight mt-0.5">{formatBRL(total())}</p>
              <Show when={comboDiscount() > 0}>
                <span class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-block mt-0.5">
                  Desconto combo aplicado
                </span>
              </Show>
            </div>
            <a
              href="#checkout-form"
              class="bg-orange-600 hover:bg-orange-700 active:scale-95 motion-reduce:active:scale-100 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span>{lang() === 'pt' ? 'Finalizar Pedido' : 'Finalizar Pedido'}</span>
              <span>👉</span>
            </a>
          </div>
        </aside>
      </Show>
    </div>
  );
}
