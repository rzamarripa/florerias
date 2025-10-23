import { z } from "zod";

export const addressSchema = z.object({
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

export const productItemSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  quantity: z.number().min(0, "La cantidad no puede ser negativa"),
});

export const createStorageSchema = z.object({
  branch: z.string().min(1, "La sucursal es requerida"),
  warehouseManager: z.string().min(1, "El gerente de almacén es requerido"),
  products: z.array(productItemSchema).optional(),
  address: addressSchema,
});

export const updateStorageSchema = z.object({
  warehouseManager: z.string().optional(),
  address: addressSchema.optional(),
});

export const addProductsSchema = z.object({
  products: z.array(productItemSchema).min(1, "Debe agregar al menos un producto"),
});

export const removeProductsSchema = z.object({
  products: z.array(productItemSchema).min(1, "Debe seleccionar al menos un producto"),
});

export const updateProductQuantitySchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  quantity: z.number().min(0, "La cantidad no puede ser negativa"),
});

export type CreateStorageFormData = z.infer<typeof createStorageSchema>;
export type UpdateStorageFormData = z.infer<typeof updateStorageSchema>;
export type AddProductsFormData = z.infer<typeof addProductsSchema>;
export type RemoveProductsFormData = z.infer<typeof removeProductsSchema>;
export type UpdateProductQuantityFormData = z.infer<typeof updateProductQuantitySchema>;
