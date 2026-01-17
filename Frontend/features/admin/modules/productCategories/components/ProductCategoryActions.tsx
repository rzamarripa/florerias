import React, { useState } from "react";
import { Edit2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { productCategoriesService } from "../services/productCategories";
import { ProductCategory } from "../types";

import { Button } from "@/components/ui/button";

interface ProductCategoryActionsProps {
  category: ProductCategory;
  onEdit: (category: ProductCategory) => void;
  onCategoryUpdated?: () => void;
}

const ProductCategoryActions: React.FC<ProductCategoryActionsProps> = ({
  category,
  onEdit,
  onCategoryUpdated,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const handleEdit = () => {
    onEdit(category);
  };

  const handleToggleStatus = async () => {
    try {
      setIsToggling(true);
      if (category.isActive) {
        await productCategoriesService.deactivateProductCategory(category._id);
        toast.success("Categoría desactivada correctamente");
      } else {
        await productCategoriesService.activateProductCategory(category._id);
        toast.success("Categoría activada correctamente");
      }
      onCategoryUpdated?.();
    } catch (error: any) {
      console.error("Error toggling category status:", error);
      const errorMessage =
        error.message ||
        `Error al ${category.isActive ? "desactivar" : "activar"} la categoría`;
      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex justify-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleEdit}
        title="Editar categoría"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={category.isActive ? "Desactivar categoría" : "Activar categoría"}
      >
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : category.isActive ? (
          <XCircle className="h-4 w-4 text-destructive" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </Button>
    </div>
  );
};

export default ProductCategoryActions;
