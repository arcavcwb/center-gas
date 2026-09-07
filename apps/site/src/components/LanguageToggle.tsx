import type { SupportedLang } from '@center-gas/contracts';

interface LanguageToggleProps {
  lang: SupportedLang;
  onToggle: (lang: SupportedLang) => void;
}

export default function LanguageToggle(props: LanguageToggleProps) {
  return (
    <div class="inline-flex items-center bg-black/30 backdrop-blur-sm rounded-full p-1 border border-white/20 shadow-inner shrink-0">
      <button
        type="button"
        onClick={() => props.onToggle('pt')}
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer"
        classList={{
          'bg-white text-gray-900 shadow-md transform scale-[1.02]': props.lang === 'pt',
          'text-white/80 hover:text-white': props.lang !== 'pt'
        }}
        aria-label="Mudar para Português"
      >
        <span>🇧🇷</span>
        <span>PT</span>
      </button>
      <button
        type="button"
        onClick={() => props.onToggle('es')}
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer"
        classList={{
          'bg-white text-gray-900 shadow-md transform scale-[1.02]': props.lang === 'es',
          'text-white/80 hover:text-white': props.lang !== 'es'
        }}
        aria-label="Cambiar a Español"
      >
        <span>🇪🇸</span>
        <span>ES</span>
      </button>
    </div>
  );
}
