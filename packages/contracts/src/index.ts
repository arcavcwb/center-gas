import { z } from "zod";

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  name: z.string().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;
