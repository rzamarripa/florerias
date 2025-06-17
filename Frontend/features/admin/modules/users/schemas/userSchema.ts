// userSchema.ts - Esquema Unificado
import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  fullName: z.string().min(1, "El nombre completo es requerido"),
  estatus: z.boolean().default(true).optional(),
});

export const userFormSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  profile: profileSchema,
  department: z.string().optional(),
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

export type CreateUserData = Required<Pick<UserFormData, 'username' | 'password' | 'profile' | 'role'>> & 
  Pick<UserFormData, 'department' | 'confirmPassword'>;

export type UpdateUserData = Required<Pick<UserFormData, 'username' | 'profile' | 'role'>> & 
  Pick<UserFormData, 'department'>;