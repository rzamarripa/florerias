import { z } from "zod";

export const cashPaymentSchema = z.object({
    importeAPagar: z
        .number({ invalid_type_error: "El importe es obligatorio" })
        .min(0.01, "El importe debe ser mayor a 0"),
    expenseConcept: z
        .string()
        .min(1, "Debe seleccionar un concepto de gasto"),
    description: z
        .string()
        .max(500, "La descripción no puede exceder 500 caracteres")
        .optional(),
});

export type CashPaymentFormData = z.infer<typeof cashPaymentSchema>; 