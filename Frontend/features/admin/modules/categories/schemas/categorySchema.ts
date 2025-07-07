import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .trim(),
  description: z
    .string()
    .max(200, "La descripción no puede exceder 200 caracteres")
    .optional(),
  hasRoutes: z.boolean().optional(),
});

export const categoryLegacySchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .trim(),
  status: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
export type CategoryLegacyFormData = z.infer<typeof categoryLegacySchema>;

export const categorySearchSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.string().optional(),
});

export type CategorySearchParams = z.infer<typeof categorySearchSchema>;