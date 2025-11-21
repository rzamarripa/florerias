import { z } from "zod";

// Schema principal para crear/editar categoría de producto
export const productCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});

export type ProductCategoryFormData = z.infer<typeof productCategorySchema>;
