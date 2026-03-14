import { z } from "zod";

export const createCashRegisterSchema = z.object({
  name: z.string().min(1, "El nombre de la caja es requerido"),
  branchId: z.string().min(1, "Debe seleccionar una sucursal"),
  activeUser: z.string().optional().nullable(),
  managerId: z.string().min(1, "Debe seleccionar un gerente"),
  initialBalance: z.number().min(0, "El saldo inicial no puede ser negativo").optional(),
});

export type CreateCashRegisterFormData = z.infer<typeof createCashRegisterSchema>;
