import { z } from "zod";

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  full_name: z.string().optional(),
  address: z.string().optional(),
  loyalty_points: z.number().int().min(0).optional(),
  available_free_cylinders: z.number().int().min(0).optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const OrderStatusEnum = z.enum(['nuevo', 'confirmado', 'asignado', 'en_camino', 'entregado', 'cancelado']);

export const OrderSchema = z.object({
  id: z.string().uuid(),
  display_id: z.string(),
  customer_id: z.string().uuid(),
  driver_id: z.string().uuid().nullable().optional(),
  status: OrderStatusEnum,
  payment_method: z.enum(['pix', 'cash']),
  cash_change_for: z.number().nullable().optional(),
  cylinder_returned: z.boolean().nullable().optional(),
  total_amount: z.number(),
  created_at: z.string(),
  // Campos opcionales si hacemos JOIN
  customers: CustomerSchema.optional(),
  driver_name: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['gas_refill', 'gas_full', 'water']),
  price: z.number(),
  image_url: z.string().url().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const CartItemSchema = z.object({
  product: ProductSchema,
  quantity: z.number().int().positive(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
