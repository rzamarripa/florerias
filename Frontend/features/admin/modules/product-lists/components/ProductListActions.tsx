import React, { useState } from "react";
import { Spinner, Button } from "react-bootstrap";
import { Eye, Edit2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { productListsService } from "../services/productLists";
import { ProductList } from "../types";

interface ProductListActionsProps {
  productList: ProductList;
  onStatusChange?: () => void;
}

const ProductListActions: React.FC<ProductListActionsProps> = ({
  productList,
  onStatusChange,
}) => {
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const router = useRouter();

  const handleToggleStatus = async () => {
    try {
      setIsToggling(true);
      await productListsService.updateProductListStatus(
        productList._id,
        !productList.status
      );
      toast.success(
        `Lista ${!productList.status ? "activada" : "desactivada"} correctamente`
      );
      onStatusChange?.();
    } catch (error: any) {
      console.error("Error toggling product list status:", error);
      const errorMessage =
        error.message ||
        `Error al ${productList.status ? "desactivar" : "activar"} la lista`;
      toast.error(errorMessage);
    } finally {
      setIsToggling(false);
    }
  };

  const handleViewDetails = () => {
    router.push(`/catalogos/listas-productos/${productList._id}`);
  };

  const handleEdit = () => {
    router.push(`/catalogos/listas-productos/${productList._id}/editar`);
  };

  return (
    <div className="d-flex justify-content-center gap-2">
      {/* View Details Button */}
      <Button
        variant="light"
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleViewDetails}
        title="Ver detalles"
      >
        <Eye size={16} className="text-primary" />
      </Button>

      {/* Edit Button */}
      <Button
        variant="light"
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleEdit}
        title="Editar lista"
      >
        <Edit2 size={16} className="text-info" />
      </Button>

      {/* Toggle Status Button */}
      <Button
        variant="light"
        size="sm"
        className="rounded-circle"
        style={{ width: "32px", height: "32px", padding: "0" }}
        onClick={handleToggleStatus}
        disabled={isToggling}
        title={productList.status ? "Desactivar lista" : "Activar lista"}
      >
        {isToggling ? (
          <Spinner
            animation="border"
            size="sm"
            style={{ width: "16px", height: "16px" }}
          />
        ) : productList.status ? (
          <XCircle size={16} className="text-danger" />
        ) : (
          <CheckCircle size={16} className="text-success" />
        )}
      </Button>
    </div>
  );
};

export default ProductListActions;
