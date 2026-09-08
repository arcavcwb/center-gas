import { describe, it, expect } from 'vitest';
import { translations, t, validateCashChange } from './index';

describe('i18n Localization & Pinheirinho Consistency', () => {
  it('should have complete parity between PT and ES dictionaries', () => {
    const ptKeys = Object.keys(translations.pt).sort();
    const esKeys = Object.keys(translations.es).sort();

    expect(ptKeys).toEqual(esKeys);
    expect(ptKeys.length).toBeGreaterThan(30);
  });

  it('should not contain empty strings in any language', () => {
    for (const [lang, dict] of Object.entries(translations)) {
      for (const [key, val] of Object.entries(dict)) {
        expect(val.trim().length, `Key "${key}" in "${lang}" is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('CRITICAL: must NOT contain "entrega grátis" or "entrega gratis" in any translation', () => {
    for (const [lang, dict] of Object.entries(translations)) {
      for (const [key, val] of Object.entries(dict)) {
        const lower = val.toLowerCase();
        expect(lower).not.toContain('entrega grátis');
        expect(lower).not.toContain('entrega gratis');
      }
    }
  });

  it('should emphasize Pinheirinho and fast delivery in headers and banners', () => {
    expect(translations.pt.banner).toContain('Pinheirinho');
    expect(translations.pt.banner).toContain('Entrega Rápida');
    expect(translations.es.banner).toContain('Pinheirinho');
    expect(translations.es.banner).toContain('Entrega Rápida');
  });

  it('should correctly interpolate params with helper t()', () => {
    const ptGreeting = t('welcomeBack', 'pt', { name: 'Carlos' });
    expect(ptGreeting).toBe('Olá, Carlos!');

    const esGreeting = t('welcomeBack', 'es', { name: 'Maria' });
    expect(esGreeting).toBe('¡Hola, Maria!');

    const trocoOpt = t('trocoOption', 'pt', { amount: 'R$ 150,00', change: 'R$ 30,00' });
    expect(trocoOpt).toBe('Troco para R$ 150,00 (Volta: R$ 30,00)');
  });

  it('should provide localized validation errors in validateCashChange', () => {
    const ptRes = validateCashChange(120, 100, 'pt');
    expect(ptRes.isValid).toBe(false);
    expect(ptRes.error).toContain('O valor para troco (R$ 100.00) não pode ser menor que o total');

    const esRes = validateCashChange(120, 100, 'es');
    expect(esRes.isValid).toBe(false);
    expect(esRes.error).toContain('El valor para el cambio (R$ 100.00) no puede ser menor al total');
  });
});
