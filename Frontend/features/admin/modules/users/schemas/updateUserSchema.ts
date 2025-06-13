import { z } from "zod";

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(1, "El nombre de usuario es requerido")
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  profile: z.object({
    nombre: z.string().optional(),
    nombreCompleto: z.string().min(1, "El nombre completo es requerido"),
    estatus: z.boolean(),
  }),
  department: z.string().optional(),
  role: z.string().min(1, "Selecciona un rol"),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
