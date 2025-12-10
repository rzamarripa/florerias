import { z } from "zod";

export const branchAddressSchema = z.object({
  street: z.string().min(1, "La calle es requerida"),
  externalNumber: z.string().min(1, "El número exterior es requerido"),
  internalNumber: z.string().optional(),
  neighborhood: z.string().min(1, "La colonia es requerida"),
  city: z.string().min(1, "La ciudad es requerida"),
  state: z.string().min(1, "El estado es requerido"),
  postalCode: z
    .string()
    .min(5, "El código postal debe tener 5 dígitos")
    .max(5, "El código postal debe tener 5 dígitos")
    .regex(/^\d{5}$/, "El código postal debe contener solo números"),
});

export const createBranchSchema = z.object({
  branchName: z.string().min(1, "El nombre de la sucursal es requerido"),
  branchCode: z.string().optional(),
  rfc: z
    .string()
    .min(1, "El RFC es requerido")
    .regex(
      /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/,
      "El formato del RFC no es válido"
    ),
  companyId: z.string().min(1, "Debe seleccionar una empresa"),
  address: branchAddressSchema,
  manager: z.string().min(1, "Debe seleccionar un gerente"),
  contactPhone: z.string().min(1, "El teléfono principal es requerido"),
  contactEmail: z.string().email("Email inválido"),
  employees: z.array(z.string()).optional(),
});

export type CreateBranchFormData = z.infer<typeof createBranchSchema>;
