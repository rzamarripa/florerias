import { z } from "zod";

// Schema para validar el color RGB
const colorSchema = z.object({
  r: z.number().min(0).max(255),
  g: z.number().min(0).max(255),
  b: z.number().min(0).max(255),
  a: z.number().min(0).max(1).optional(),
});

// Schema principal para crear/editar etapa
export const stageCatalogSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  abreviation: z.string().min(1, "La abreviación es requerida"),
  stageNumber: z.number().min(1, "El número de etapa debe ser mayor a 0"),
  boardType: z.enum(["Produccion", "Envio"], {
    required_error: "El tipo de tablero es requerido",
    invalid_type_error: "El tipo de tablero debe ser 'Produccion' o 'Envio'",
  }),
  color: colorSchema,
  company: z.string().optional(), // Solo para Super Admin
});

export type StageCatalogFormData = z.infer<typeof stageCatalogSchema>;
