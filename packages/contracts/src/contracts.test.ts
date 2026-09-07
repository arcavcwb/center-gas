import { describe, it, expect } from 'vitest';
import {
  CustomerSchema,
  OrderSchema,
  OrderStatusEnum,
  ProductSchema,
  CartItemSchema
} from './index';

describe('Contracts — Zod Schemas Unit Tests', () => {
  describe('CustomerSchema', () => {
    it('debe validar un cliente completo y válido', () => {
      const validCustomer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        phone: '41999998888',
        name: 'Maria da Silva',
        address_line: 'Rua das Flores 123, Apto 4',
        loyalty_points: 5,
        available_free_cylinders: 0
      };
      const result = CustomerSchema.safeParse(validCustomer);
      expect(result.success).toBe(true);
    });

    it('debe validar un cliente mínimo con sólo id y phone', () => {
      const minCustomer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        phone: '41999998888'
      };
      const result = CustomerSchema.safeParse(minCustomer);
      expect(result.success).toBe(true);
    });

    it('debe fallar si el ID no es un UUID válido', () => {
      const invalidCustomer = {
        id: 'not-a-uuid',
        phone: '41999998888'
      };
      const result = CustomerSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });

    it('debe rechazar puntos de lealtad negativos', () => {
      const invalidCustomer = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        phone: '41999998888',
        loyalty_points: -1
      };
      const result = CustomerSchema.safeParse(invalidCustomer);
      expect(result.success).toBe(false);
    });
  });

  describe('OrderSchema & OrderStatusEnum', () => {
    it('debe validar un pedido con todos los campos obligatorios', () => {
      const validOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        display_id: 'ORD-1001',
        customer_id: '223e4567-e89b-12d3-a456-426614174000',
        status: 'nuevo',
        payment_method: 'pix',
        total_amount: 110.00,
        created_at: '2026-09-07T12:00:00Z'
      };
      const result = OrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('debe aceptar todos los estados válidos de la máquina de estados', () => {
      const validStatuses = ['nuevo', 'confirmado', 'asignado', 'en_camino', 'entregado', 'cancelado'];
      for (const status of validStatuses) {
        expect(OrderStatusEnum.safeParse(status).success).toBe(true);
      }
    });

    it('debe rechazar estados no permitidos en la máquina de estados', () => {
      const invalidStatuses = ['pending', 'draft', 'shipped', 'done'];
      for (const status of invalidStatuses) {
        expect(OrderStatusEnum.safeParse(status).success).toBe(false);
      }
    });

    it('debe rechazar métodos de pago no soportados (solo pix y cash)', () => {
      const invalidOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        display_id: 'ORD-1002',
        customer_id: '223e4567-e89b-12d3-a456-426614174000',
        status: 'nuevo',
        payment_method: 'credit_card', // No permitido
        total_amount: 110.00,
        created_at: '2026-09-07T12:00:00Z'
      };
      const result = OrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });

  describe('ProductSchema & CartItemSchema', () => {
    it('debe validar un producto correctamente tipado', () => {
      const validProduct = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Gas P13 (Recarga)',
        sku: 'P13-REFILL',
        price: 110.00,
        includes_cylinder: false,
        is_active: true
      };
      const result = ProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('debe rechazar CartItem con cantidad negativa o cero', () => {
      const product = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Gas P13',
        sku: 'P13-REFILL',
        price: 110.00
      };
      
      const zeroQty = { product, quantity: 0 };
      expect(CartItemSchema.safeParse(zeroQty).success).toBe(false);

      const negativeQty = { product, quantity: -2 };
      expect(CartItemSchema.safeParse(negativeQty).success).toBe(false);

      const positiveQty = { product, quantity: 1 };
      expect(CartItemSchema.safeParse(positiveQty).success).toBe(true);
    });
  });
});
