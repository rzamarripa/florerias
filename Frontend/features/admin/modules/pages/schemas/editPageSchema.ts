import { z } from "zod";

export const updatePageSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  path: z
    .string()
    .min(1, "La ruta es requerida")
    .max(200, "La ruta no puede exceder 200 caracteres"),
  description: z.string().optional(),
});

export type UpdatePageFormData = z.infer<typeof updatePageSchema>;
