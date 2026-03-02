import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().optional(),
  unit_price: z.number().optional(),
  amount: z.number(),
});

export const extractedDataSchema = z.object({
  vendor: z.string().min(1, "Vendor is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3).default("USD"),
  invoice_id: z.string().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  line_items: z.array(lineItemSchema).optional(),
});

export type ExtractedDataInput = z.infer<typeof extractedDataSchema>;
