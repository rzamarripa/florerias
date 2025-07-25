import { z } from "zod";

export const bankSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre del banco debe tener al menos 2 caracteres")
    .max(100, "El nombre del banco no debe exceder 100 caracteres"),
  bankNumber: z
    .number()
    .int("El número del banco debe ser un número entero")
    .refine((val) => val.toString().length === 3, {
      message: "El número del banco debe tener exactamente 3 dígitos"
    }),
});

export type BankFormData = z.infer<typeof bankSchema>;
