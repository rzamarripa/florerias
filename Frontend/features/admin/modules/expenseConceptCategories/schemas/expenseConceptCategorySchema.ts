import { z } from "zod";

export const expenseConceptCategorySchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .trim(),
});

export type ExpenseConceptCategoryFormData = z.infer<
  typeof expenseConceptCategorySchema
>;

export const expenseConceptCategorySearchSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  isActive: z.string().optional(),
});

export type ExpenseConceptCategorySearchParams = z.infer<
  typeof expenseConceptCategorySearchSchema
>;
