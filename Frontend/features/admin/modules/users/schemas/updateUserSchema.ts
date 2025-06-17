import z from "zod";
import { profileSchema } from "./createUserSchema";

export const updateUserSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  profile: profileSchema,
  department: z.string().optional(),
  role: z.string().min(1, "El rol es requerido"),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;