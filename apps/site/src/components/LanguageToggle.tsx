import type { SupportedLang } from '@center-gas/contracts';

interface LanguageToggleProps {
  lang: SupportedLang;
  onToggle: (lang: SupportedLang) => void;
}

const LANGUAGES = [
  { code: 'pt' as const, label: 'PT', title: 'Mudar para Português' },
  { code: 'es' as const, label: 'ES', title: 'Cambiar a Español' }
];

export default function LanguageToggle(props: LanguageToggleProps) {
  return (
    <div class="inline-flex items-center bg-black/30 backdrop-blur-sm rounded-full p-1 border border-white/20 shadow-inner shrink-0">
      {LANGUAGES.map((item) => (
        <button
          type="button"
          onClick={() => props.onToggle(item.code)}
          class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer"
          classList={{
            'bg-white text-slate-900 shadow-md transform scale-[1.02]': props.lang === item.code,
            'text-white/80 hover:text-white': props.lang !== item.code,
          }}
          aria-label={item.title}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
