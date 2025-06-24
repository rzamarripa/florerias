import { z } from "zod";

export const branchSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),

  companyId: z
    .string()
    .min(1, "La razón social es requerida")
    .max(150, "La razón social no puede exceder 150 caracteres")
    .trim(),

  rsBrands: z
    .array(z.string())
    .min(1, "Debe seleccionar al menos una marca")
    .optional(),

  countryId: z
    .string()
    .min(1, "El país es requerido")
    .max(50, "El país no puede exceder 50 caracteres")
    .trim(),

  stateId: z
    .string()
    .min(1, "El estado es requerido")
    .max(50, "El estado no puede exceder 50 caracteres")
    .trim(),

  municipalityId: z
    .string()
    .min(1, "La ciudad es requerida")
    .max(50, "La ciudad no puede exceder 50 caracteres")
    .trim(),

  address: z
    .string()
    .min(1, "La dirección es requerida")
    .min(10, "La dirección debe ser más específica (mínimo 10 caracteres)")
    .max(200, "La dirección no puede exceder 200 caracteres")
    .trim(),

  phone: z
    .string()
    .min(1, "El teléfono es requerido")
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede exceder 15 dígitos")
    .regex(
      /^[\d\s\-\+\(\)]*$/,
      "El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +"
    )
    .trim(),

  email: z
    .string()
    .min(1, "El correo es requerido")
    .email("Debe ser un correo electrónico válido")
    .max(100, "El correo no puede exceder 100 caracteres")
    .toLowerCase()
    .trim(),

  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .default("")
    .transform((val) => val?.trim() || "")
    .optional(),
});

export const updateBranchSchema = branchSchema.partial().extend({
  _id: z.string().min(1, "ID es requerido"),
});

export type BranchFormData = z.infer<typeof branchSchema>;
export type UpdateBranchFormData = z.infer<typeof updateBranchSchema>;
