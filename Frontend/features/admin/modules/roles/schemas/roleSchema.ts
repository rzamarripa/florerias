import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  modules: z.array(z.string()).optional(),
  estatus: z.boolean().optional(),
});
