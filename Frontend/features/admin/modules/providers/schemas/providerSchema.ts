// schemas/proveedorSchema.ts
import { z } from "zod";

export const providerSchema = z.object({
  commercialName: z
    .string()
    .min(1, "El nombre comercial es requerido")
    .max(100, "El nombre comercial no puede exceder 100 caracteres")
    .trim(),

  businessName: z
    .string()
    .min(1, "La razón social es requerida")
    .max(150, "La razón social no puede exceder 150 caracteres")
    .trim(),

  rfc: z
    .string()
    .min(1, "El RFC es requerido")
    .min(10, "El RFC debe tener al menos 10 caracteres")
    .max(13, "El RFC no puede exceder 13 caracteres")
    .regex(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, "El RFC debe tener un formato válido")
    .trim()
    .toUpperCase(),

  contactName: z
    .string()
    .min(1, "El nombre de contacto es requerido")
    .min(2, "El nombre de contacto debe tener al menos 2 caracteres")
    .max(100, "El nombre de contacto no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras y espacios")
    .trim(),

  countryId: z
    .string()
    .min(24, "ID de país inválido")
    .max(24, "ID de país inválido"),

  stateId: z
    .string()
    .min(24, "ID de estado inválido")
    .max(24, "ID de estado inválido"),

  municipalityId: z
    .string()
    .min(24, "ID de municipio inválido")
    .max(24, "ID de municipio inválido"),

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
    .regex(/^[\d\s\-\+\(\)]*$/, "El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +")
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
    .optional()
    .nullable()
    .transform(val => val === null ? undefined : val),

  isActive: z.boolean().default(true),
});

export const updateProviderSchema = providerSchema.partial().extend({
  _id: z.string().min(24, "ID inválido").max(24, "ID inválido")
});

export type ProviderFormData = z.infer<typeof providerSchema>;
export type UpdateProviderFormData = z.infer<typeof updateProviderSchema>;