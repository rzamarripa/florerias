import { z } from "zod";

export const expenseConceptSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  description: z
    .string()
    .min(1, "La descripción es obligatoria")
    .min(5, "La descripción debe tener al menos 5 caracteres")
    .max(500, "La descripción no puede exceder 500 caracteres")
    .trim(),
  categoryId: z
    .string()
    .min(1, "Debe seleccionar una categoría")
    .trim(),
});

export type ExpenseConceptFormData = z.infer<typeof expenseConceptSchema>; 