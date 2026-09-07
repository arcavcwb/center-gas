import { describe, it, expect } from 'vitest';
import {
  calculateComboDiscount,
  validateCashChange,
  normalizeWhatsAppPhone,
  formatBRL
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

  describe('BR-004: Formato BRL', () => {
    it('debe formatear números con coma decimal y prefijo R$', () => {
      expect(formatBRL(110)).toBe('R$ 110,00');
      expect(formatBRL(15.5)).toBe('R$ 15,50');
      expect(formatBRL(0)).toBe('R$ 0,00');
    });
  });
});
