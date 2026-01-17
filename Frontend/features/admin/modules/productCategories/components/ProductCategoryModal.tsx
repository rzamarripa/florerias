"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { productCategorySchema, ProductCategoryFormData } from "../schemas/productCategorySchema";
import { productCategoriesService } from "../services/productCategories";
import { ProductCategory } from "../types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductCategoryModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  category?: ProductCategory | null;
}

const ProductCategoryModal: React.FC<ProductCategoryModalProps> = ({
  show,
  onHide,
  onSuccess,
  category,
}) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductCategoryFormData>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (show) {
      if (category) {
        reset({
          name: category.name,
          description: category.description || "",
        });
      } else {
        reset({
          name: "",
          description: "",
        });
      }
    }
  }, [show, category, reset]);

  const onSubmit = async (data: ProductCategoryFormData) => {
    try {
      setLoading(true);

      if (category) {
        await productCategoriesService.updateProductCategory(category._id, data);
        toast.success("Categoría actualizada exitosamente");
      } else {
        await productCategoriesService.createProductCategory(data);
        toast.success("Categoría creada exitosamente");
      }

      onSuccess();
      onHide();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la categoría");
      console.error("Error saving category:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {category ? "Editar Categoría de Producto" : "Nueva Categoría de Producto"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Actualiza la información de la categoría"
              : "Completa los datos de la nueva categoría"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre de la Categoría <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    type="text"
                    placeholder="Ej: Flores Naturales, Arreglos Florales, Plantas"
                    className={errors.name ? "border-destructive" : ""}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="description"
                    placeholder="Describe la categoría de productos..."
                    rows={3}
                    className={errors.description ? "border-destructive" : ""}
                  />
                )}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onHide}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : category ? (
                "Actualizar Categoría"
              ) : (
                "Crear Categoría"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCategoryModal;
