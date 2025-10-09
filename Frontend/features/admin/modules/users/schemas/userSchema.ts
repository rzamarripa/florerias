// userSchema.ts - Esquema Unificado
import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  fullName: z.string().optional(),
  estatus: z.boolean().default(true).optional(),
});

export const userFormSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  email: z.string().email("El email debe ser válido").min(1, "El email es requerido"),
  phone: z.string().min(1, "El teléfono es requerido"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  profile: profileSchema,
  role: z.string().min(1, "El rol es requerido"),
})
  .superRefine((data, ctx) => {
    const isCreating = data.password !== undefined && data.password !== "";

    if (isCreating) {
      if (!data.password || data.password.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La contraseña debe tener al menos 6 caracteres",
          path: ["password"],
        });
      }

      if (!data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Confirma la contraseña",
          path: ["confirmPassword"],
        });
      }

      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Las contraseñas no coinciden",
          path: ["confirmPassword"],
        });
      }
    }
  });

export type UserFormData = z.infer<typeof userFormSchema>;

export type CreateUserData = Required<Pick<UserFormData, 'username' | 'email' | 'phone' | 'password' | 'profile' | 'role'>> &
  Pick<UserFormData, 'confirmPassword'>;

export type UpdateUserData = Required<Pick<UserFormData, 'username' | 'email' | 'phone' | 'profile' | 'role'>>;