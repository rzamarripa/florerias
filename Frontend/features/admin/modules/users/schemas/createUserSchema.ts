import { z } from "zod";

export const createUserSchema = z
  .object({
    username: z
      .string()
      .min(1, "El nombre de usuario es requerido")
      .min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    profile: z.object({
      nombre: z.string().optional(),
      nombreCompleto: z.string().min(1, "El nombre completo es requerido"),
      estatus: z.boolean(),
    }),
    department: z.string().optional(),
    role: z.string().min(1, "Selecciona un rol"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type CreateUserFormData = z.infer<typeof createUserSchema>;
