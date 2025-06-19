import { z } from "zod";

export const departmentSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede tener más de 100 caracteres"),
  brandId: z.string().min(1, "La marca es requerida"),
});

export type DepartmentFormData = z.infer<typeof departmentSchema>; 