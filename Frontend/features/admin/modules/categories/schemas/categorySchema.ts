// schemas/categoriaSchema.ts
import { z } from "zod";

export const categorySchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-&]+$/, "El nombre solo puede contener letras, espacios, guiones y &")
    .trim(),
  
  status: z.boolean().default(true)
});

export const updateCategorySchema = categorySchema.partial().extend({
  _id: z.string().min(1, "ID es requerido")
});

export type CategoryFormData = z.infer<typeof categorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;