import { describe, it, expect } from 'vitest';
import {
  calculateComboDiscount,
  validateCashChange,
  normalizeWhatsAppPhone,
  getPhoneVariants,
  arePhonesEquivalent,
  formatBRL,
  isWithinBusinessHours,
  getNextDeliverySlot
} from './business-rules';

describe('Business Rules Unit Tests (Center Gás)', () => {
  describe('BR-001: Descuento por Combo (Gas + Agua)', () => {
    it('debe otorgar R$ 5,00 de descuento cuando hay 1 Gas y 1 Agua', () => {
      const items = [
        { sku: 'P13-REFILL', price: 110.0, quantity: 1 },
        { sku: 'water_refill', price: 15.0, quantity: 1 }
      ];
      expect(calculateComboDiscount(items)).toBe(5.0);
    });

    it('debe otorgar R$ 10,00 de descuento cuando hay 2 Gases y 2 Aguas', () => {
      const items = [
        { sku: 'P13-REFILL', price: 110.0, quantity: 2 },
        { sku: 'water_full', price: 35.0, quantity: 2 }
      ];
      expect(calculateComboDiscount(items)).toBe(10.0);
    });

    it('debe limitar el descuento al mínimo de pares (ej: 2 Gases y 1 Agua = R$ 5,00)', () => {
      const items = [
        { sku: 'P13-FULL', price: 280.0, quantity: 2 },
        { sku: 'water_refill', price: 15.0, quantity: 1 }
      ];
      expect(calculateComboDiscount(items)).toBe(5.0);
    });

    it('debe devolver 0 cuando solo hay Gas sin Agua', () => {
      const items = [{ sku: 'P13-REFILL', price: 110.0, quantity: 2 }];
      expect(calculateComboDiscount(items)).toBe(0);
    });

    it('debe devolver 0 cuando solo hay Agua sin Gas', () => {
      const items = [{ sku: 'water', price: 15.0, quantity: 3 }];
      expect(calculateComboDiscount(items)).toBe(0);
    });

    it('debe devolver 0 para un carrito vacío', () => {
      expect(calculateComboDiscount([])).toBe(0);
    });
  });

  describe('BR-002: Validación de Pago en Efectivo y Troco', () => {
    it('debe validar cuando el cliente entrega valor exacto (sin troco)', () => {
      const res = validateCashChange(110.0, null);
      expect(res.isValid).toBe(true);
      expect(res.changeDue).toBe(0);
    });

    it('debe calcular el vuelto exacto cuando el cliente paga con billete mayor', () => {
      // Total R$ 110, paga con R$ 150 -> Vuelto R$ 40
      const res = validateCashChange(110.0, 150.0);
      expect(res.isValid).toBe(true);
      expect(res.changeDue).toBe(40.0);
    });

    it('debe fallar si el valor para el cambio es inferior al total del pedido', () => {
      // Total R$ 110, dice que tiene R$ 100
      const res = validateCashChange(110.0, 100.0);
      expect(res.isValid).toBe(false);
      expect(res.changeDue).toBe(0);
      expect(res.error).toBeDefined();
    });
  });

  describe('BR-003: Normalización de Teléfonos para WhatsApp Brasil', () => {
    it('debe normalizar número local de 11 dígitos agregando prefijo 55', () => {
      expect(normalizeWhatsAppPhone('41999998888')).toBe('5541999998888');
    });

    it('debe mantener número que ya cuenta con prefijo 55', () => {
      expect(normalizeWhatsAppPhone('5541999998888')).toBe('5541999998888');
    });

    it('debe limpiar caracteres especiales (paréntesis, guiones, espacios)', () => {
      expect(normalizeWhatsAppPhone('+55 (41) 99999-8888')).toBe('5541999998888');
      expect(normalizeWhatsAppPhone('(41) 98888-7777')).toBe('5541988887777');
    });

    it('debe manejar cadenas vacías correctamente', () => {
      expect(normalizeWhatsAppPhone('')).toBe('');
    });
  });

  describe('BR-003b: Variantes Canónicas y Tolerancia al 9° Dígito Móvil (Brasil)', () => {
    it('debe generar variante con 9° dígito cuando recibe 12 dígitos (55 + DDD + 8 dígitos)', () => {
      // Armando Castro WhatsApp format: 554198450477
      const variants = getPhoneVariants('554198450477');
      expect(variants).toHaveLength(2);
      expect(variants).toContain('554198450477');
      expect(variants).toContain('5541998450477');
    });

    it('debe generar variante sin 9° dígito cuando recibe 13 dígitos (55 + DDD + 9 + 8 dígitos)', () => {
      // Armando Castro customer format: 5541998450477
      const variants = getPhoneVariants('5541998450477');
      expect(variants).toHaveLength(2);
      expect(variants).toContain('5541998450477');
      expect(variants).toContain('554198450477');
    });

    it('debe anteponer 55 y generar variantes para formato local de 10 u 11 dígitos', () => {
      // Formato local 10 dígitos (DDD 41 + 8 dígitos)
      const variants10 = getPhoneVariants('4198450477');
      expect(variants10).toContain('554198450477');
      expect(variants10).toContain('5541998450477');

      // Formato local 11 dígitos (DDD 41 + 9 + 8 dígitos)
      const variants11 = getPhoneVariants('41998450477');
      expect(variants11).toContain('5541998450477');
      expect(variants11).toContain('554198450477');
    });

    it('debe retornar array vacío para inputs vacíos o nulos', () => {
      expect(getPhoneVariants('')).toEqual([]);
      expect(getPhoneVariants('   ')).toEqual([]);
    });

    it('debe comparar teléfonos equivalentes independientemente de la presencia del 9° dígito', () => {
      expect(arePhonesEquivalent('554198450477', '5541998450477')).toBe(true);
      expect(arePhonesEquivalent('5541998450477', '554198450477')).toBe(true);
      expect(arePhonesEquivalent('+55 (41) 9845-0477', '(41) 99845-0477')).toBe(true);
      expect(arePhonesEquivalent('554198450477', '5541912345678')).toBe(false);
    });
  });

  describe('BR-004: Formato BRL', () => {
    it('debe formatear números con coma decimal y prefijo R$', () => {
      expect(formatBRL(110)).toBe('R$ 110,00');
      expect(formatBRL(15.5)).toBe('R$ 15,50');
      expect(formatBRL(0)).toBe('R$ 0,00');
    });
  });

  describe('BR-005: Horarios Comerciales y Pedidos Programados (ISSUE-703)', () => {
    // Helper para generar fechas fijas en UTC
    // Para São Paulo (UTC-3):
    // 10:00 SP = 13:00 UTC
    // 07:00 SP = 10:00 UTC
    // 21:00 SP = 24:00 UTC (00:00 día siguiente)

    it('debe validar horario de atención activo (ej. Lunes 10:00 AM)', () => {
      // 2026-09-07 es un Lunes. 14:00 UTC = 11:00 AM en Curitiba (UTC-3)
      const dateMonday11am = new Date(Date.UTC(2026, 8, 7, 14, 0, 0));
      expect(isWithinBusinessHours(dateMonday11am)).toBe(true);
    });

    it('debe rechazar entrega inmediata antes de las 08:00 (ej. Lunes 07:15 AM)', () => {
      // 07:15 SP = 10:15 UTC
      const dateMonday7am = new Date(Date.UTC(2026, 8, 7, 10, 15, 0));
      expect(isWithinBusinessHours(dateMonday7am)).toBe(false);
    });

    it('debe rechazar entrega inmediata después de las 20:00 (ej. Lunes 21:30)', () => {
      // 21:30 SP = 00:30 UTC del día siguiente
      const dateMondayNight = new Date(Date.UTC(2026, 8, 8, 0, 30, 0));
      expect(isWithinBusinessHours(dateMondayNight)).toBe(false);
    });

    it('debe marcar fuera de horario los Domingos', () => {
      // 2026-09-06 fue Domingo. 15:00 UTC = 12:00 PM SP
      const dateSunday = new Date(Date.UTC(2026, 8, 6, 15, 0, 0));
      expect(isWithinBusinessHours(dateSunday)).toBe(false);
    });

    it('debe retornar entrega inmediata si está dentro del horario', () => {
      const dateMonday11am = new Date(Date.UTC(2026, 8, 7, 14, 0, 0));
      const slot = getNextDeliverySlot(dateMonday11am);
      expect(slot.isScheduled).toBe(false);
      expect(slot.timeSlot).toBe('imediato');
    });

    it('debe programar para hoy a las 08:30 si es de madrugada en día hábil (ej. Lunes 06:00 AM)', () => {
      // 06:00 SP = 09:00 UTC
      const dateMonday6am = new Date(Date.UTC(2026, 8, 7, 9, 0, 0));
      const slot = getNextDeliverySlot(dateMonday6am);
      expect(slot.isScheduled).toBe(true);
      expect(slot.timeSlot).toBe('08:30');
      expect(slot.formattedPT).toContain('Hoje');
      expect(slot.formattedES).toContain('Hoy');
    });

    it('debe programar para mañana a las 08:30 si es de noche en día hábil (ej. Lunes 22:00)', () => {
      // 22:00 SP = 01:00 UTC martes
      const dateMondayNight = new Date(Date.UTC(2026, 8, 8, 1, 0, 0));
      const slot = getNextDeliverySlot(dateMondayNight);
      expect(slot.isScheduled).toBe(true);
      expect(slot.timeSlot).toBe('08:30');
      expect(slot.formattedPT).toContain('Amanhã');
      expect(slot.formattedES).toContain('Mañana');
    });

    it('debe saltar el Domingo y programar para el Lunes si el pedido entra el Sábado en la noche', () => {
      // 2026-09-05 es Sábado. 21:30 SP = 00:30 UTC domingo (2026-09-06)
      const dateSaturdayNight = new Date(Date.UTC(2026, 8, 6, 0, 30, 0));
      const slot = getNextDeliverySlot(dateSaturdayNight);
      expect(slot.isScheduled).toBe(true);
      expect(slot.timeSlot).toBe('08:30');
      expect(slot.formattedPT).toContain('Segunda-feira');
      expect(slot.formattedES).toContain('Lunes');
    });
  });
});
