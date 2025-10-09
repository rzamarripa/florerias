import { z } from "zod";

// Schema para dirección fiscal
export const fiscalAddressSchema = z.object({
  street: z.string().min(1, "La calle es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  state: z.string().min(1, "El estado es requerido"),
  postalCode: z.string().min(5, "El código postal debe tener al menos 5 caracteres"),
});

// Schema para contacto principal
export const primaryContactSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
});

// Schema para datos del distribuidor
export const distributorDataSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  profile: z.object({
    name: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
  }),
});

// Schema para edición de distribuidor (sin password requerido)
export const distributorDataEditSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  password: z.string().optional(),
  profile: z.object({
    name: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
  }),
});

// Formas legales válidas
export const legalForms = [
  "S.A. de C.V.",
  "S. de R.L. de C.V.",
  "S.C.",
  "A.C.",
  "S.A.P.I.",
  "S.A.S.",
  "Persona Física",
  "Otro",
] as const;

// Schema principal para crear empresa
export const createCompanySchema = z.object({
  legalName: z.string().min(1, "La razón social es requerida"),
  tradeName: z.string().optional(),
  rfc: z
    .string()
    .min(12, "El RFC debe tener al menos 12 caracteres")
    .max(13, "El RFC debe tener máximo 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "Formato de RFC inválido"),
  legalForm: z.enum(legalForms, {
    errorMap: () => ({ message: "Seleccione una forma legal válida" }),
  }),
  fiscalAddress: fiscalAddressSchema,
  primaryContact: primaryContactSchema,
  distributorId: z.string().optional(),
  distributorData: distributorDataSchema.optional(),
}).refine(
  (data) => {
    // Al menos uno de distributorId o distributorData debe estar presente
    return data.distributorId || data.distributorData;
  },
  {
    message: "Debe seleccionar un distribuidor existente o crear uno nuevo",
    path: ["distributorId"],
  }
);

// Schema para editar empresa
export const updateCompanySchema = z.object({
  legalName: z.string().min(1, "La razón social es requerida"),
  tradeName: z.string().optional(),
  rfc: z
    .string()
    .min(12, "El RFC debe tener al menos 12 caracteres")
    .max(13, "El RFC debe tener máximo 13 caracteres")
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "Formato de RFC inválido"),
  legalForm: z.enum(legalForms, {
    errorMap: () => ({ message: "Seleccione una forma legal válida" }),
  }),
  fiscalAddress: fiscalAddressSchema,
  primaryContact: primaryContactSchema,
  distributorId: z.string().optional().nullable(),
  distributorData: distributorDataEditSchema.optional(),
});

export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyFormData = z.infer<typeof updateCompanySchema>;
