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
import ProductFamilyCard, { type ProductFamily } from './ProductFamilyCard';

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
  const pathToken = typeof window !== 'undefined' ? window.location.pathname.replace(/^\/+/, '').split('/')[0] : '';
  const isPathToken = /^[a-zA-Z0-9]{6,64}$/.test(pathToken) && pathToken !== 'driver';
  const urlToken = isPathToken ? pathToken : (urlParams?.get('token') || null);
  // El token se borra de la barra de direcciones en cuanto se resuelve (URL Stripping),
  // así que un simple F5 lo perdía. Sin él check_customer_exists ya no devuelve los datos
  // del cliente y create_b2c_order rechaza el pedido con 42501. Se conserva en
  // sessionStorage: sobrevive a la recarga y muere al cerrar la pestaña.
  const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('center_gas_session_token') : null;
  const hasTokenFromUrl = !!urlToken;

  // Reactivo, no constante: el alta de un cliente nuevo (register_b2c_customer) emite
  // su propia sesión y devuelve el token a mitad de flujo. Si esto fuera un valor fijo
  // leído al montar, el checkout inmediatamente posterior seguiría enviando null y la
  // primera compra del cliente orgánico se rechazaría con 42501.
  const [sessionToken, setSessionToken] = createSignal<string | null>(urlToken || storedToken);

  const rememberSessionToken = (newToken: string | null | undefined) => {
    if (!newToken) return;
    setSessionToken(newToken);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('center_gas_session_token', newToken);
    }
  };
  
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

  const savedPhone = typeof window !== 'undefined' ? localStorage.getItem('center_gas_customer_phone') : null;
  const [step, setStep] = createSignal<'loading' | 'phone' | 'register' | 'catalog'>((hasTokenFromUrl || savedPhone) ? 'loading' : 'phone');
  const [customerName, setCustomerName] = createSignal('');
  
  const [products, setProducts] = createSignal<Product[]>([]);
  const [neighborhoods, setNeighborhoods] = createSignal<Neighborhood[]>([]);
  const [cart, setCart] = createSignal<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = createSignal<'all' | 'gas' | 'water'>('all');

  const productFamilies = createMemo<ProductFamily[]>(() => {
    const prods = products();
    if (prods.length === 0) return [];

    const familyMap = new Map<string, ProductFamily>();

    for (const p of prods) {
      const skuLower = p.sku.toLowerCase();
      const nameLower = p.name.toLowerCase();

      const isGas = skuLower.includes('p13') || skuLower.includes('gas') || nameLower.includes('gás') || nameLower.includes('gas');
      const isWater = skuLower.includes('water') || skuLower.includes('agua') || nameLower.includes('água') || nameLower.includes('agua');

      let familyId = p.id;
      let category: 'gas' | 'water' = isGas ? 'gas' : 'water';
      let defaultTitle = p.name;
      let defaultSubtitle = p.desc;

      if (isGas) {
        familyId = 'gas_p13';
        category = 'gas';
        defaultTitle = lang() === 'pt' ? 'Gás GLP 13kg' : 'Gas GLP 13kg';
        defaultSubtitle = lang() === 'pt' ? 'Botijão padrão residencial (Ultragaz / Nacional)' : 'Cilindro estándar residencial';
      } else if (isWater) {
        familyId = 'water_20l';
        category = 'water';
        defaultTitle = lang() === 'pt' ? 'Água Mineral 20L' : 'Agua Mineral 20L';
        defaultSubtitle = lang() === 'pt' ? 'Galão retornável padrão 20 litros' : 'Bidón retornable estándar 20 litros';
      }

      if (!familyMap.has(familyId)) {
        familyMap.set(familyId, {
          id: familyId,
          category,
          title: defaultTitle,
          subtitle: defaultSubtitle,
        });
      }

      const fam = familyMap.get(familyId)!;
      if (p.includes_cylinder) {
        fam.fullVariant = p;
      } else {
        fam.refillVariant = p;
      }
    }

    return Array.from(familyMap.values());
  });

  const filteredFamilies = createMemo(() => {
    const cat = selectedCategory();
    const fams = productFamilies();
    if (cat === 'all') return fams;
    return fams.filter(f => f.category === cat);
  });
  
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
  const [createdDisplayId, setCreatedDisplayId] = createSignal('');
  const [submitError, setSubmitError] = createSignal<string | null>(null);
  const [isOnline, setIsOnline] = createSignal(true);
  const [now, setNow] = createSignal(new Date());

  onMount(() => {
    setNow(new Date());
    const clockInterval = setInterval(() => setNow(new Date()), 60000);
    onCleanup(() => clearInterval(clockInterval));

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      if (typeof navigator.onLine === 'boolean') {
        setIsOnline(navigator.onLine);
      }
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
    
    // Check URL for token (WhatsApp flow: /xxxxxx or ?token=...)
    if (urlToken && (step() === 'phone' || step() === 'loading')) {
      setToken(urlToken);
      handleTokenCheck(urlToken);
    } else if (!hasTokenFromUrl && savedPhone && step() === 'loading') {
      handleSavedCustomerCheck(savedPhone);
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

  const deliverySlot = createMemo(() => getNextDeliverySlot(now()));
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

  const handleSavedCustomerCheck = async (saved: string) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const { data, error } = await supabase.rpc('check_customer_exists', {
      p_phone: saved,
      p_session_token: sessionToken()
    });
    setIsSubmitting(false);

    if (!error && data && data.exists) {
      setPhone(data.phone || saved);
      // check_customer_exists sólo devuelve los datos personales cuando hay una
      // sesión de catálogo vigente que prueba la posesión del teléfono (el enlace
      // llegó por WhatsApp al número real). Sin esa prueba responde { exists, phone }
      // y hay que pedir los datos de entrega en lugar de saltar al catálogo con la
      // dirección en blanco. Ver supabase/migrations/20260909000000_security_containment.sql
      if (!data.name) {
        setStep('register');
        return;
      }
      setCustomerName(data.name);
      setAddress(data.address_line || '');
      setNeighborhoodId(data.neighborhood_id || '');
      setStep('catalog');
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('center_gas_customer_phone');
      }
      setStep('phone');
    }
  };

  const handleResetCustomer = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('center_gas_customer_phone');
      // El token pertenece al teléfono anterior: no debe viajar con el nuevo.
      sessionStorage.removeItem('center_gas_session_token');
    }
    // También en memoria: el signal es ahora la fuente que leen las RPC.
    setSessionToken(null);
    setPhone('');
    setName('');
    setCustomerName('');
    setAddress('');
    setCart({});
    setStep('phone');
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
    
    // Limpieza silenciosa de URL (URL Stripping): oculta token y limpia barra de direcciones
    if (typeof window !== 'undefined' && (isPathToken || urlParams?.has('token'))) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.pathname = '/';
      cleanUrl.searchParams.delete('token');
      window.history.replaceState({}, '', cleanUrl.toString());
    }

    if (data && data.valid) {
      // El token sigue siendo válido: se guarda para que las RPC posteriores
      // puedan probar la posesión del teléfono aunque la URL ya esté limpia.
      rememberSessionToken(checkToken);
      setPhone(data.phone || '');
      if (data.exists) {
        setCustomerName(data.name || '');
        setAddress(data.address_line || '');
        setNeighborhoodId(data.neighborhood_id || '');
        if (typeof window !== 'undefined' && data.phone) {
          localStorage.setItem('center_gas_customer_phone', data.phone);
        }
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
    const { data, error } = await supabase.rpc('check_customer_exists', {
      p_phone: normalized,
      p_session_token: sessionToken()
    });
    setIsSubmitting(false);
    
    if (error) {
      setSubmitError(t('connectionError', lang()));
      return;
    }
    
    if (data && data.exists) {
      setPhone(data.phone || normalized);
      if (typeof window !== 'undefined') {
        localStorage.setItem('center_gas_customer_phone', data.phone || normalized);
      }
      // Sin prueba de posesión del teléfono la RPC no devuelve name/address_line:
      // se pide el alta en vez de entrar al catálogo sin dirección de entrega.
      if (!data.name) {
        setStep('register');
        return;
      }
      setCustomerName(data.name);
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
    const { data, error } = await supabase.rpc('register_b2c_customer', {
      p_phone: normalized,
      p_name: name(),
      p_neighborhood_id: neighborhoodId(),
      p_address_line: address(),
      p_session_token: sessionToken()
    });
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    // La RPC ya no devuelve un UUID sino JSONB { customer_id, applied, created }.
    // `applied: false` significa que la ficha NO se tocó: el teléfono ya está
    // registrado y no se presentó el token de la sesión de WhatsApp. Seguir al
    // catálogo aquí dejaría el barrio sin guardar, y el pedido saldría con taxa
    // de entrega 0,00 y sin barrio en el Kanban. Ver la migración
    // supabase/migrations/20260909120000_hardening_auditoria_integral.sql
    if (!data || (data as any).applied !== true) {
      setSubmitError(t('registerLinkRequiredError', lang()));
      return;
    }

    // Cuando el alta CREA al cliente, la RPC emite la sesión de ese cliente nuevo y
    // devuelve su token. Hay que guardarlo: es lo que le permite completar su primera
    // compra al cliente orgánico, que nunca recibió un enlace por WhatsApp.
    rememberSessionToken((data as any).session_token);

    setCustomerName(name());
    if (typeof window !== 'undefined') {
      localStorage.setItem('center_gas_customer_phone', normalized);
    }
    setStep('catalog');
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

    const { data, error } = await supabase.rpc('create_b2c_order', {
      p_phone: normalized,
      p_address_line: address(),
      p_items,
      p_payment_method: paymentMethod(),
      p_cash_change_for: changeFor(),
      p_is_scheduled: isScheduled(),
      p_scheduled_for: isScheduled() ? deliverySlot().scheduledDate.toISOString() : null,
      // El barrio elegido decide la taxa de entrega: el servidor la lee de la base
      // para ESE barrio, así que sin este parámetro el total mostrado y el cobrado
      // pueden diferir.
      p_neighborhood_id: neighborhoodId() || null,
      p_session_token: sessionToken()
    });

    setIsSubmitting(false);

    if (error) {
      console.error("Error creating order:", error);
      // ERRCODE 42501: el teléfono ya está registrado y la RPC exige la prueba de
      // posesión (el token del enlace de WhatsApp). Volcar el error crudo dejaba al
      // cliente sin saber qué hacer.
      const needsWhatsAppLink =
        (error as any).code === '42501' || /whatsapp/i.test(error.message || '');
      setSubmitError(
        needsWhatsAppLink
          ? t('orderLinkRequiredError', lang())
          : (error.message || JSON.stringify(error))
      );
    } else {
      if (typeof window !== 'undefined' && phone()) {
        localStorage.setItem('center_gas_customer_phone', phone());
      }
      if (data && typeof data === 'object' && (data as any).display_id) {
        setCreatedDisplayId((data as any).display_id);
      }
      setOrderSuccess(true);
    }
  };

  return (
    <div class="space-y-5">

      {/* ----------------- ALERTA OFFLINE (Resiliencia / Harden) ----------------- */}
      <Show when={!isOnline()}>
        <div role="alert" class="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-center gap-3 text-xs font-semibold shadow-xs">
          <svg class="w-5 h-5 text-amber-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <p class="leading-snug">{t('offlineBanner', lang())}</p>
        </div>
      </Show>

      {/* ----------------- BANNER DE ATENDIMENTO & SELECTOR DE IDIOMA ----------------- */}
      <Show 
        when={isScheduled()}
        fallback={
          <div class="bg-gradient-to-r from-orange-600 via-primary to-orange-500 text-white p-4 rounded-2xl shadow-sm space-y-2.5">
            {/* Fila Superior: Título + Selector de Idioma */}
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2 min-w-0">
                <svg class="w-5 h-5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h4" />
                </svg>
                <p class="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-tight">
                  {t('bannerTitle', lang())}
                </p>
              </div>
              <LanguageToggle lang={lang()} onToggle={setLang} />
            </div>

            {/* Descripción / Promesa */}
            <p class="text-xs text-orange-100 font-medium leading-relaxed">
              {t('bannerDesc', lang())}
            </p>

            {/* Badge de Localización Pinheirinho */}
            <div class="pt-0.5">
              <span class="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs border border-white/20 text-xs font-semibold px-3 py-1 rounded-xl text-orange-100 shadow-xs">
                <svg class="w-3.5 h-3.5 text-orange-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{t('brandSubtitle', lang())}</span>
              </span>
            </div>
          </div>
        }
      >
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-md border border-indigo-500/30 space-y-3">
          {/* Fila Superior: Título + Selector de Idioma */}
          <div class="flex items-center justify-between gap-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <svg class="w-5 h-5 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <p class="text-xs sm:text-sm font-extrabold tracking-tight text-amber-300">
                {t('scheduledBannerTitle', lang())}
              </p>
            </div>
            <LanguageToggle lang={lang()} onToggle={setLang} />
          </div>

          {/* Descripción del horario */}
          <p class="text-xs text-indigo-200 font-medium leading-relaxed">
            {t('scheduledBannerDesc', lang())}
          </p>

          {/* Badge de Horario de Entrega */}
          <div class="pt-0.5">
            <span class="inline-flex items-center gap-1.5 bg-indigo-900/90 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1.5 rounded-xl shadow-inner">
              <svg class="w-3.5 h-3.5 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{lang() === 'pt' ? deliverySlot().formattedPT : deliverySlot().formattedES}</span>
            </span>
          </div>
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
              <svg class="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
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
          <p class="text-sm text-gray-500 mb-4">{t('registerDesc', lang())}</p>

          {/* Badge de Teléfono Verificado (sin re-escritura) */}
          <Show when={phone()}>
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs mb-5">
              <div class="flex items-center gap-2.5 min-w-0">
                <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div class="truncate">
                  <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">{t('verifiedPhoneBadge', lang())}</p>
                  <p class="text-sm font-mono font-bold text-slate-800 tracking-wide">+{phone()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('phone')}
                class="text-xs text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer shrink-0 ml-2"
              >
                {t('changePhone', lang())}
              </button>
            </div>
          </Show>
          
          <Show when={submitError()}>
            <div data-testid="submit-error" class="bg-red-50/80 border border-red-200 p-3.5 rounded-xl text-red-700 text-sm font-medium shadow-xs mb-4 flex items-start gap-2.5">
              <svg class="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
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
            <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="space-y-2">
              <h3 class="text-xl font-black text-slate-900">{t('successTitle', lang())}</h3>
              <Show when={createdDisplayId()}>
                <div class="inline-flex items-center gap-1.5 px-3.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold rounded-lg text-sm tracking-wide shadow-2xs">
                  <span>Pedido #{createdDisplayId()}</span>
                </div>
              </Show>
              <p class="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                {isScheduled() ? t('scheduledSuccessMessage', lang()) : t('successMessage', lang())}
              </p>
            </div>
            <div class="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-xl text-emerald-800 text-xs font-medium max-w-sm mx-auto flex items-center gap-2.5 text-left">
              <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p class="leading-snug">{t('orderTrackingHint', lang())}</p>
            </div>
          </div>
        </Show>

        <Show when={!orderSuccess()}>
          <div class="space-y-4">
            {/* Banner de bienvenida para clientes recurrentes */}
            <Show when={customerName()}>
              <div class="bg-orange-50/70 border border-orange-200 p-4 rounded-xl shadow-xs flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-base font-bold text-slate-800 truncate">
                    {t('welcomeBack', lang(), { name: customerName() })}
                  </p>
                  <p class="text-xs sm:text-sm text-slate-600 mt-0.5 line-clamp-2">
                    {t('yourAddress', lang(), { address: address() })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetCustomer}
                  class="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  {t('changeAccount', lang())}
                </button>
              </div>
            </Show>

            <Show when={submitError()}>
              <div data-testid="submit-error" class="bg-red-50/80 border border-red-200 p-3.5 rounded-xl text-red-700 text-sm font-medium shadow-xs mb-4 flex items-start gap-2.5">
                <svg class="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p class="leading-snug">{submitError()}</p>
              </div>
            </Show>
            {/* ----------------- SELECTOR DE CATEGORÍAS CIRCULAR ----------------- */}
            <div class="space-y-2 pt-1 pb-1">
              <div class="flex items-center justify-between px-1">
                <span class="text-xs font-black uppercase tracking-wider text-slate-500">
                  {lang() === 'pt' ? 'Categorias' : 'Categorías'}
                </span>
                <span class="text-2xs font-semibold text-slate-500">
                  {selectedCategory() === 'all' 
                    ? (lang() === 'pt' ? 'Exibindo tudo' : 'Mostrando todo')
                    : selectedCategory() === 'gas' 
                      ? (lang() === 'pt' ? 'Filtrado por Gás' : 'Filtrado por Gas')
                      : (lang() === 'pt' ? 'Filtrado por Água' : 'Filtrado por Agua')}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2.5 sm:gap-3.5" role="tablist" aria-label="Categorias de produtos">
                {/* Botón: Todos */}
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory() === 'all'}
                  onClick={() => setSelectedCategory('all')}
                  class="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl border transition-all duration-150 cursor-pointer min-h-[76px]"
                  classList={{
                    'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20': selectedCategory() === 'all',
                    'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs': selectedCategory() !== 'all'
                  }}
                >
                  <div 
                    class="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                    classList={{
                      'bg-white/20 text-white': selectedCategory() === 'all',
                      'bg-slate-100 text-slate-700': selectedCategory() !== 'all'
                    }}
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <span class="text-xs font-black leading-tight">
                    {t('categoryAll', lang())}
                  </span>
                </button>

                {/* Botón: Gás P13 */}
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory() === 'gas'}
                  onClick={() => setSelectedCategory('gas')}
                  class="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl border transition-all duration-150 cursor-pointer min-h-[76px]"
                  classList={{
                    'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-600/20': selectedCategory() === 'gas',
                    'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs': selectedCategory() !== 'gas'
                  }}
                >
                  <div 
                    class="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                    classList={{
                      'bg-white/20 text-white': selectedCategory() === 'gas',
                      'bg-orange-50 text-orange-600': selectedCategory() !== 'gas'
                    }}
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 012.344 5.657c0 2.12-.837 4.14-2.343 5.657z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.001 11c-.753 1.657-1.372 2.657-2.122 5.121z" />
                    </svg>
                  </div>
                  <span class="text-xs font-black leading-tight">
                    {t('categoryGas', lang())}
                  </span>
                </button>

                {/* Botón: Água Mineral */}
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory() === 'water'}
                  onClick={() => setSelectedCategory('water')}
                  class="flex flex-col items-center gap-1.5 p-2 sm:p-2.5 rounded-2xl border transition-all duration-150 cursor-pointer min-h-[76px]"
                  classList={{
                    'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20': selectedCategory() === 'water',
                    'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs': selectedCategory() !== 'water'
                  }}
                >
                  <div 
                    class="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                    classList={{
                      'bg-white/20 text-white': selectedCategory() === 'water',
                      'bg-blue-50 text-blue-600': selectedCategory() !== 'water'
                    }}
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a8 8 0 11-14.856 0 9.043 9.043 0 011.026-1.528L12 3l6.402 10.9a9.043 9.043 0 011.026 1.528z" />
                    </svg>
                  </div>
                  <span class="text-xs font-black leading-tight">
                    {t('categoryWater', lang())}
                  </span>
                </button>
              </div>
            </div>

            {/* Skeleton Loading */}
            <Show when={products().length === 0}>
              <div class="space-y-3" aria-label={t('loadingCatalog', lang())} aria-busy="true">
                <div class="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex justify-between items-center animate-pulse motion-reduce:animate-none">
                  <div class="space-y-2.5 flex-1 pr-4">
                    <div class="h-5 bg-slate-200 rounded-md w-3/5"></div>
                    <div class="h-3.5 bg-slate-100 rounded-md w-4/5"></div>
                    <div class="h-8 bg-slate-100 rounded-xl w-full max-w-[200px]"></div>
                    <div class="h-6 bg-slate-200 rounded-md w-24"></div>
                  </div>
                  <div class="w-28 h-12 bg-slate-100 rounded-full"></div>
                </div>
                <div class="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex justify-between items-center animate-pulse motion-reduce:animate-none">
                  <div class="space-y-2.5 flex-1 pr-4">
                    <div class="h-5 bg-slate-200 rounded-md w-2/4"></div>
                    <div class="h-3.5 bg-slate-100 rounded-md w-3/4"></div>
                    <div class="h-8 bg-slate-100 rounded-xl w-full max-w-[200px]"></div>
                    <div class="h-6 bg-slate-200 rounded-md w-20"></div>
                  </div>
                  <div class="w-28 h-12 bg-slate-100 rounded-full"></div>
                </div>
              </div>
            </Show>

            {/* Listado de Tarjetas Maestras Unificadas */}
            <For each={filteredFamilies()}>
              {(family) => (
                <ProductFamilyCard
                  family={family}
                  cart={cart()}
                  onUpdateQty={updateQty}
                  lang={lang()}
                />
              )}
            </For>

            {/* Fallback si el filtro no tiene productos */}
            <Show when={products().length > 0 && filteredFamilies().length === 0}>
              <div class="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2 shadow-2xs">
                <p class="text-sm font-bold text-slate-700">
                  {lang() === 'pt' ? 'Nenhum produto encontrado nesta categoria.' : 'Ningún producto encontrado en esta categoría.'}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  class="text-xs font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
                >
                  {lang() === 'pt' ? 'Ver todos os produtos' : 'Ver todos los productos'}
                </button>
              </div>
            </Show>
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
                        <svg class="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a8 8 0 11-14.856 0 9.043 9.043 0 011.026-1.528L12 3l6.402 10.9a9.043 9.043 0 011.026 1.528z" />
                        </svg>
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
                      class="px-4 py-2 bg-secondary text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95 cursor-pointer"
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
                <svg class="w-5 h-5 text-indigo-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
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
                      <p class="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>
                          {lang() === 'pt' 
                            ? `Troco a receber: ${formatBRL(changeFor()! - total())}` 
                            : `Cambio a recibir: ${formatBRL(changeFor()! - total())}`}
                        </span>
                      </p>
                    </Show>
                    <Show when={changeFor() && changeFor()! <= total()}>
                      <p class="text-xs font-semibold text-amber-700 mt-1.5 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>
                          {lang() === 'pt' 
                            ? `O valor precisa ser maior que o total (${formatBRL(total())})` 
                            : `El monto debe ser mayor al total (${formatBRL(total())})`}
                        </span>
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
              <svg class="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </aside>
      </Show>
    </div>
  );
}
