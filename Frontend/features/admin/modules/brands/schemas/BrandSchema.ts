import { z } from "zod";

export const brandSchema = z.object({
  logo: z.string().min(1, "El logo es requerido"),
  categoria: z.string().optional(),
  nombre: z.string().min(1, "El nombre es requerido"),
  razonesSociales: z.string().min(1, "Debe agregar al menos una razón social"),
  descripcion: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type BrandFormData = z.infer<typeof brandSchema>;