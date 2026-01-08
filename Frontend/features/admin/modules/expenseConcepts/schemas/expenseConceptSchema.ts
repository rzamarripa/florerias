import { z } from "zod";

// Schema principal para crear/editar concepto de gasto
export const expenseConceptSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  department: z.enum(
    ["sales", "administration", "operations", "marketing", "finance", "human_resources", "other"],
    {
      errorMap: () => ({ message: "Selecciona un departamento válido" }),
    }
  ),
  branch: z.string().optional(), // La sucursal se determina automáticamente según el rol
});

export type ExpenseConceptFormData = z.infer<typeof expenseConceptSchema>;
