import { z } from "zod";

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  name: z.string().optional(),
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
