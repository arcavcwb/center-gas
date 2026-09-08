import { createSignal, createMemo, Show } from 'solid-js';
import { formatBRL, t, type SupportedLang } from '@center-gas/contracts';

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  type: string;
  price: number;
  desc: string;
  includes_cylinder: boolean;
}

export interface ProductFamily {
  id: string;
  category: 'gas' | 'water';
  title: string;
  subtitle: string;
  brand?: string;
  refillVariant?: ProductVariant;
  fullVariant?: ProductVariant;
}

interface ProductFamilyCardProps {
  family: ProductFamily;
  cart: Record<string, number>;
  onUpdateQty: (id: string, delta: number) => void;
  lang: SupportedLang;
}

export default function ProductFamilyCard(props: ProductFamilyCardProps) {
  // Inicializar con 'refill' si existe, de lo contrario 'full'
  const initialOption = props.family.refillVariant ? 'refill' : 'full';
  const [selectedOption, setSelectedOption] = createSignal<'refill' | 'full'>(initialOption);

  const currentVariant = createMemo(() => {
    if (selectedOption() === 'refill') {
      return props.family.refillVariant || props.family.fullVariant;
    }
    return props.family.fullVariant || props.family.refillVariant;
  });

  const refillQty = createMemo(() => {
    const v = props.family.refillVariant;
    return v ? (props.cart[v.id] || 0) : 0;
  });

  const fullQty = createMemo(() => {
    const v = props.family.fullVariant;
    return v ? (props.cart[v.id] || 0) : 0;
  });

  const currentQty = createMemo(() => {
    const v = currentVariant();
    return v ? (props.cart[v.id] || 0) : 0;
  });

  const otherQty = createMemo(() => {
    return selectedOption() === 'refill' ? fullQty() : refillQty();
  });

  const isGas = () => props.family.category === 'gas';

  return (
    <article 
      class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow space-y-3.5"
      aria-labelledby={`family-title-${props.family.id}`}
    >
      {/* ----------------- CABECERA DE LA TARJETA ----------------- */}
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          {/* Avatar temático SVG */}
          <div 
            class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
            classList={{
              'bg-orange-50 border-orange-200 text-orange-600': isGas(),
              'bg-blue-50 border-blue-200 text-blue-600': !isGas()
            }}
            aria-hidden="true"
          >
            <Show 
              when={isGas()}
              fallback={
                /* Icono SVG Gota de Agua */
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a8 8 0 11-14.856 0 9.043 9.043 0 011.026-1.528L12 3l6.402 10.9a9.043 9.043 0 011.026 1.528z" />
                </svg>
              }
            >
              {/* Icono SVG Llama de Gas */}
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 012.344 5.657c0 2.12-.837 4.14-2.343 5.657z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.001 11c-.753 1.657-1.372 2.657-2.122 5.121z" />
              </svg>
            </Show>
          </div>

          <div class="min-w-0">
            <h3 
              id={`family-title-${props.family.id}`} 
              class="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight"
            >
              {props.family.title}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5 leading-normal">
              {props.family.subtitle}
            </p>
          </div>
        </div>

        {/* Badge de categoría */}
        <span 
          class="text-2xs font-extrabold uppercase px-2.5 py-1 rounded-lg tracking-wider shrink-0 border"
          classList={{
            'bg-orange-100 text-orange-800 border-orange-200': isGas(),
            'bg-blue-100 text-blue-800 border-blue-200': !isGas()
          }}
        >
          {isGas() ? 'GLP P13' : 'Mineral'}
        </span>
      </div>

      {/* ----------------- PILL SWITCH: Já tenho o vazio vs Comprar vasilhame novo ----------------- */}
      <Show when={props.family.refillVariant && props.family.fullVariant}>
        <div 
          class="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/80"
          role="group"
          aria-label="Opção de vasilhame"
        >
          {/* Opción Recarga */}
          <button
            type="button"
            onClick={() => setSelectedOption('refill')}
            aria-pressed={selectedOption() === 'refill'}
            class="flex-1 py-2.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer"
            classList={{
              'bg-white text-slate-900 shadow-xs border border-slate-200': selectedOption() === 'refill',
              'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent': selectedOption() !== 'refill'
            }}
          >
            <div class="text-center leading-tight">
              <span class="block">{t('optionWithExchange', props.lang)}</span>
              <Show when={props.family.refillVariant}>
                <span class="text-2xs font-mono font-semibold text-slate-500">
                  {formatBRL(props.family.refillVariant!.price)}
                </span>
              </Show>
            </div>
            {/* Badge de cantidad en carrito si hay unidades de recarga */}
            <Show when={refillQty() > 0}>
              <span 
                class="w-5 h-5 rounded-full text-white text-2xs flex items-center justify-center font-black shadow-xs shrink-0"
                classList={{
                  'bg-orange-600': isGas(),
                  'bg-blue-600': !isGas()
                }}
                aria-label={`${refillQty()} itens no carrinho`}
              >
                {refillQty()}
              </span>
            </Show>
          </button>

          {/* Opción Completo / Vasilhame Novo */}
          <button
            type="button"
            onClick={() => setSelectedOption('full')}
            aria-pressed={selectedOption() === 'full'}
            class="flex-1 py-2.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[48px] cursor-pointer"
            classList={{
              'bg-white text-slate-900 shadow-xs border border-slate-200': selectedOption() === 'full',
              'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent': selectedOption() !== 'full'
            }}
          >
            <div class="text-center leading-tight">
              <span class="block">{t('optionWithCylinder', props.lang)}</span>
              <Show when={props.family.fullVariant}>
                <span class="text-2xs font-mono font-semibold text-slate-500">
                  {formatBRL(props.family.fullVariant!.price)}
                </span>
              </Show>
            </div>
            {/* Badge de cantidad en carrito si hay unidades completas */}
            <Show when={fullQty() > 0}>
              <span 
                class="w-5 h-5 rounded-full text-white text-2xs flex items-center justify-center font-black shadow-xs shrink-0"
                classList={{
                  'bg-orange-600': isGas(),
                  'bg-blue-600': !isGas()
                }}
                aria-label={`${fullQty()} itens no carrinho`}
              >
                {fullQty()}
              </span>
            </Show>
          </button>
        </div>
      </Show>

      {/* ----------------- NOTA EXPLICATIVA CONTEXTUAL ----------------- */}
      <div 
        class="rounded-xl p-3 text-xs flex items-center gap-2.5 border transition-colors shadow-2xs"
        classList={{
          'bg-amber-50/80 border-amber-200/90 text-amber-950': selectedOption() === 'refill',
          'bg-blue-50/80 border-blue-200/90 text-blue-950': selectedOption() === 'full'
        }}
      >
        <Show 
          when={selectedOption() === 'refill'}
          fallback={
            <>
              {/* Icono de Vasilhame Nuevo (Caja / Cilindro) */}
              <svg class="w-4 h-4 text-blue-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span class="font-medium leading-snug">{t('tipNewCylinderIncluded', props.lang)}</span>
            </>
          }
        >
          {/* Icono de Intercambio / Retorno */}
          <svg class="w-4 h-4 text-amber-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="font-medium leading-snug">{t('tipExchangeRequired', props.lang)}</span>
        </Show>
      </div>

      {/* ----------------- PRECIO & CONTROLES DE CANTIDAD (TOUCH TARGETS >= 48px) ----------------- */}
      <div class="flex items-center justify-between pt-2 border-t border-slate-100">
        <div>
          <p class="text-2xs uppercase tracking-wider font-extrabold text-slate-500">
            {selectedOption() === 'refill' 
              ? (props.lang === 'pt' ? 'Preço da Recarga' : 'Precio de Recarga')
              : (props.lang === 'pt' ? 'Preço Vasilhame Novo' : 'Precio Envase Nuevo')}
          </p>
          <p 
            class="text-2xl sm:text-3xl font-black tracking-tight tabular-nums"
            classList={{
              'text-orange-700': isGas(),
              'text-blue-700': !isGas()
            }}
          >
            {currentVariant() ? formatBRL(currentVariant()!.price) : '---'}
          </p>
        </div>

        {/* Controles de Cantidad */}
        <div class="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-full border border-slate-200">
          <button 
            type="button"
            disabled={!currentVariant() || currentQty() === 0}
            onClick={() => currentVariant() && props.onUpdateQty(currentVariant()!.id, -1)}
            aria-label={`Diminuir quantidade de ${props.family.title}`}
            class="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 font-black text-xl shadow-xs transition-transform duration-100 ease-out active:scale-90 motion-reduce:active:scale-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            −
          </button>
          <span class="font-black text-slate-900 w-7 text-center text-lg select-none tabular-nums">
            {currentQty()}
          </span>
          <button 
            type="button"
            disabled={!currentVariant()}
            onClick={() => currentVariant() && props.onUpdateQty(currentVariant()!.id, 1)}
            aria-label={`Aumentar quantidade de ${props.family.title}`}
            class="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full text-white font-black text-xl shadow-xs transition-transform duration-100 ease-out active:scale-90 motion-reduce:active:scale-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            classList={{
              'bg-orange-600 hover:bg-orange-700 active:bg-orange-800': isGas(),
              'bg-blue-600 hover:bg-blue-700 active:bg-blue-800': !isGas()
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* ----------------- HINT SI TIENE UNIDADES DE LA OTRA VARIANTE ----------------- */}
      <Show when={otherQty() > 0}>
        <div class="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
          <div class="flex items-center gap-2 min-w-0">
            <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p class="truncate font-medium">
              {selectedOption() === 'refill'
                ? (props.lang === 'pt' ? `Você também tem ${otherQty()} vasilhame(s) novo(s) no carrinho` : `También tienes ${otherQty()} envase(s) nuevo(s) en el carrito`)
                : (props.lang === 'pt' ? `Você também tem ${otherQty()} recarga(s) no carrinho` : `También tienes ${otherQty()} recarga(s) en el carrito`)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedOption(selectedOption() === 'refill' ? 'full' : 'refill')}
            class="text-xs font-bold text-orange-600 hover:text-orange-800 underline ml-2 shrink-0 cursor-pointer"
          >
            {props.lang === 'pt' ? 'Alternar' : 'Cambiar'}
          </button>
        </div>
      </Show>
    </article>
  );
}
