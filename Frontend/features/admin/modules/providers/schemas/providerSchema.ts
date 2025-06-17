// schemas/proveedorSchema.ts
import { z } from "zod";

export const proveedorSchema = z.object({
  nombreComercial: z
    .string()
    .min(1, "El nombre comercial es requerido")
    .max(100, "El nombre comercial no puede exceder 100 caracteres")
    .trim(),
  
  razonSocial: z
    .string()
    .min(1, "La razón social es requerida")
    .max(150, "La razón social no puede exceder 150 caracteres")
    .trim(),
  
  nombreContacto: z
    .string()
    .min(1, "El nombre de contacto es requerido")
    .min(2, "El nombre de contacto debe tener al menos 2 caracteres")
    .max(100, "El nombre de contacto no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras y espacios")
    .trim(),
  
  pais: z
    .string()
    .min(1, "El país es requerido")
    .max(50, "El país no puede exceder 50 caracteres")
    .trim(),
  
  estado: z
    .string()
    .min(1, "El estado es requerido")
    .max(50, "El estado no puede exceder 50 caracteres")
    .trim(),
  
  ciudad: z
    .string()
    .min(1, "La ciudad es requerida")
    .max(50, "La ciudad no puede exceder 50 caracteres")
    .trim(),
  
  direccion: z
    .string()
    .min(1, "La dirección es requerida")
    .min(10, "La dirección debe ser más específica (mínimo 10 caracteres)")
    .max(200, "La dirección no puede exceder 200 caracteres")
    .trim(),
  
  telefono: z
    .string()
    .min(1, "El teléfono es requerido")
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede exceder 15 dígitos")
    .regex(/^[\d\s\-\+\(\)]*$/, "El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +")
    .trim(),
  
  correo: z
    .string()
    .min(1, "El correo es requerido")
    .email("Debe ser un correo electrónico válido")
    .max(100, "El correo no puede exceder 100 caracteres")
    .toLowerCase()
    .trim(),
  
  descripcion: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .transform(val => val?.trim() || ""),
  
  status: z.boolean().default(true)
});

export const updateProveedorSchema = proveedorSchema.partial().extend({
  _id: z.string().min(1, "ID es requerido")
});

export type ProveedorFormData = z.infer<typeof proveedorSchema>;
export type UpdateProveedorFormData = z.infer<typeof updateProveedorSchema>;