import { z } from 'zod';
export const createPageSchema = z.object({
  name: z.string()
    .min(1, 'El nombre de la página es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  path: z.string()
    .min(1, 'La ruta de la página es requerida')
    .regex(/^\//, 'La ruta debe comenzar con /')
    .regex(/^[\/\w-]+$/, 'La ruta solo puede contener letras, números, guiones y barras'),
  description: z.string().optional(),
  modules: z.array(z.object({
    moduleId: z.string(),
    nombre: z.string().optional(),
    description: z.string().optional()
  })).optional()
});

export type CreatePageFormData = z.infer<typeof createPageSchema>;

export interface ModuleRow {
  id: string;
  nombre: string;
  description: string;
}

// Schema para validación
export const updatePageSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  path: z.string().min(1, 'La ruta es requerida'),
  description: z.string().optional()
});

export interface UpdatePageFormData {
  name: string;
  path: string;
  description: string;
}

export interface ModuleRow {
  id: string;
  nombre: string;
  description: string;
  isExisting?: boolean; // Para distinguir entre módulos existentes y nuevos
}