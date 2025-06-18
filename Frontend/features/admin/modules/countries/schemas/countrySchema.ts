import { z } from "zod";

export const countrySchema = z.object({
  name: z.string().min(1, "El nombre del país es requerido"),
});

export type CountryFormData = z.infer<typeof countrySchema>;
