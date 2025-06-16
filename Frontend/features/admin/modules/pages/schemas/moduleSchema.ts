import { z } from "zod";

export const moduleSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre del módulo es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres"),
});

export type ModuleFormData = z.infer<typeof moduleSchema>;
