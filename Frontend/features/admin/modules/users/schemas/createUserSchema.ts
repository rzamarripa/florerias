import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  fullName: z.string().min(1, "El nombre completo es requerido"),
  estatus: z.boolean().default(true).optional(),
});

export const createUserSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirma la contraseña"),
  profile: profileSchema,
  department: z.string().optional(),
  role: z.string().min(1, "El rol es requerido"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

