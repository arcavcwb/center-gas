import { translations, SupportedLang, TranslationSchema } from './dict';

export * from './dict';

/**
 * Función helper para obtener la traducción interpolada
 */
export function t(
  key: keyof TranslationSchema,
  lang: SupportedLang = 'pt',
  params?: Record<string, string | number>
): string {
  const dict = translations[lang] || translations.pt;
  let text = dict[key] || translations.pt[key] || '';

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    }
  }

  return text;
}
