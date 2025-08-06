import { z } from "zod";

export const bankNumberSchema = z.object({
  bankDebited: z
    .string()
    .min(24, "ID de banco inválido")
    .max(24, "ID de banco inválido"),

  bankCredited: z
    .string()
    .min(1, "El banco de abono es requerido")
    .max(100, "El banco de abono no puede exceder 100 caracteres")
    .trim(),

  bankNumber: z
    .string()
    .min(1, "El número de banco es requerido")
    .length(5, "El número de banco debe tener exactamente 5 dígitos")
    .regex(/^[0-9]+$/, "El número de banco solo puede contener números")
    .trim(),
});

export const updateBankNumberSchema = bankNumberSchema.partial().extend({
  _id: z.string().min(24, "ID inválido").max(24, "ID inválido")
});

export type BankNumberFormData = z.infer<typeof bankNumberSchema>;
export type UpdateBankNumberFormData = z.infer<typeof updateBankNumberSchema>; 