import { z } from "zod";

// Schema para dirección
export const addressSchema = z.object({
  street: z.string().min(1, "La calle es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  state: z.string().min(1, "El estado es requerido"),
  postalCode: z.string().min(5, "El código postal debe tener al menos 5 caracteres").regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
});

// Schema principal para crear/editar proveedor
export const providerSchema = z.object({
  contactName: z.string().min(1, "El nombre de contacto es requerido"),
  tradeName: z.string().min(1, "El nombre comercial es requerido"),
  legalName: z.string().min(1, "El nombre fiscal es requerido"),
  rfc: z
    .string()
    .min(12, "El RFC debe tener al menos 12 caracteres")
    .max(13, "El RFC debe tener máximo 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "Formato de RFC inválido")
    .transform((val) => val.toUpperCase()),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  address: addressSchema,
  email: z.string().email("Email inválido"),
  company: z.string().min(1, "La empresa es requerida"),
});

export type ProviderFormData = z.infer<typeof providerSchema>;
