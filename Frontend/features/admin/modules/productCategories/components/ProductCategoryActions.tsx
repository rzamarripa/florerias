import React, { useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { Edit2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { productCategoriesService } from "../services/productCategories";
import { ProductCategory } from "../types";

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
    <div className="d-flex justify-content-center gap-2">
      {/* Edit Button */}
      <Button
        variant="light"
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleEdit}
        title="Editar categoría"
      >
        <Edit2 size={16} />
      </Button>

      {/* Toggle Status Button */}
      <Button
        variant={category.isActive ? "light" : "light"}
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={category.isActive ? "Desactivar categoría" : "Activar categoría"}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : category.isActive ? (
          <XCircle size={16} className="text-danger" />
        ) : (
          <CheckCircle size={16} className="text-success" />
        )}
      </Button>
    </div>
  );
};

export default ProductCategoryActions;
