import { z } from "zod";

export const bankAccountSchema = z.object({
  company: z.string().min(1, "La razón social es obligatoria"),
  bank: z.string().min(1, "El banco es obligatorio"),
  accountNumber: z.string().min(1, "El número de cuenta es obligatorio"),
  clabe: z.string().min(1, "La clabe interbancaria es obligatoria"),
  branch: z.string().optional(),
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;
