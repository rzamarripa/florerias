"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { X, Package, Save, ArrowLeft, Loader2 } from "lucide-react";
import { storageService } from "../services/storage";
import { productsService } from "../../products/services/products";
import { Storage, Product } from "../types";
import { useRouter } from "next/navigation";

interface AddProductsModalProps {
  show: boolean;
  onHide: () => void;
  onProductsAdded: () => void;
  storage: Storage | null;
  fromOrder?: boolean;
  targetProductId?: string;
}

interface ProductWithQuantity extends Product {
  quantityToAdd: number;
}

const AddProductsModal: React.FC<AddProductsModalProps> = ({
  show,
  onHide,
  onProductsAdded,
  storage,
  fromOrder = false,
  targetProductId = "",
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    ProductWithQuantity[]
  >([]);

  useEffect(() => {
    if (show && storage) {
      loadProducts();
    }
  }, [show, storage]);

  const loadProducts = async () => {
    try {
      setLoadingData(true);
      const response = await productsService.getAllProducts({
        limit: 1000,
        estatus: true,
      });

      // Filtrar productos que NO estan en el almacen
      const storageProductIds =
        storage?.products.map((p) =>
          typeof p.productId === "string" ? p.productId : p.productId._id
        ) || [];

      const available = response.data.filter(
        (product) => !storageProductIds.includes(product._id)
      );

      setAvailableProducts(available);
      setSelectedProducts([]);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar productos");
      console.error("Error loading products:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    if (!productId || productId === "placeholder") return;

    const product = availableProducts.find((p) => p._id === productId);
    if (!product) return;

    // Verificar que el producto no este ya seleccionado
    if (selectedProducts.some((p) => p._id === productId)) {
      toast.warning("Este producto ya esta en la lista");
      return;
    }

    // Agregar el producto a la lista de seleccionados
    setSelectedProducts([
      ...selectedProducts,
      { ...product, quantityToAdd: 1 },
    ]);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p._id === productId ? { ...p, quantityToAdd: Math.max(0, quantity) } : p
      )
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== productId));
  };

  const handleSubmit = async () => {
    try {
      if (!storage) {
        toast.error("No hay almacen seleccionado");
        return;
      }

      // Filtrar productos con cantidad mayor a 0
      const validProducts = selectedProducts.filter((p) => p.quantityToAdd > 0);

      if (validProducts.length === 0) {
        toast.error(
          "Debes agregar al menos un producto con cantidad mayor a 0"
        );
        return;
      }

      setLoading(true);

      await storageService.addProductsToStorage(storage._id, {
        products: validProducts.map((p) => ({
          productId: p._id,
          quantity: p.quantityToAdd,
        })),
      });

      toast.success("Productos agregados exitosamente");
      onProductsAdded();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Error al agregar productos");
      console.error("Error adding products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedProducts([]);
    onHide();
  };

  const handleBackToOrder = () => {
    handleClose();
    router.push("/sucursal/nueva-orden");
  };

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <div>
            <DialogTitle className="text-lg font-bold">Agregar Productos al Almacen</DialogTitle>
            {storage && (
              <p className="text-muted-foreground mb-0 text-sm">
                {typeof storage.branch === "string"
                  ? storage.branch
                  : storage.branch.branchName}
              </p>
            )}
          </div>
        </DialogHeader>

        <div className="py-4">
          {loadingData ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Cargando productos...</p>
            </div>
          ) : (
            <>
              {/* Select para agregar productos */}
              <div className="mb-4">
                <Label className="font-semibold mb-2 block">
                  Seleccionar Producto
                </Label>
                <Select
                  onValueChange={handleProductSelect}
                  disabled={availableProducts.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      availableProducts.length === 0
                        ? "No hay productos disponibles"
                        : "Seleccionar un producto para agregar..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.nombre} ({product.unidad})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm mt-1">
                  {availableProducts.length === 0
                    ? "Todos los productos ya estan en el almacen"
                    : `${availableProducts.length} producto(s) disponible(s)`}
                </p>
              </div>

              {/* Tabla de productos seleccionados */}
              <div>
                <h6 className="mb-3 font-semibold">Productos a Agregar</h6>
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package size={48} className="mb-3 opacity-50 mx-auto" />
                    <p className="mb-0">No hay productos seleccionados</p>
                    <small>Selecciona productos del menu de arriba</small>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="px-3 py-2 font-semibold text-muted-foreground">
                            PRODUCTO
                          </TableHead>
                          <TableHead className="px-3 py-2 font-semibold text-muted-foreground">
                            UNIDAD
                          </TableHead>
                          <TableHead className="px-3 py-2 font-semibold text-muted-foreground w-[150px]">
                            CANTIDAD
                          </TableHead>
                          <TableHead className="px-3 py-2 font-semibold text-muted-foreground text-center w-[80px]">
                            ACCION
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProducts.map((product) => (
                          <TableRow key={product._id}>
                            <TableCell className="px-3 py-2 font-semibold">
                              {product.nombre}
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <Badge variant="secondary">{product.unidad}</Badge>
                            </TableCell>
                            <TableCell className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                value={product.quantityToAdd}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    product._id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell className="px-3 py-2 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(product._id)}
                                className="text-destructive hover:text-destructive p-0 h-auto"
                              >
                                <X size={18} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <div className="flex justify-between w-full">
            <div>
              {fromOrder && (
                <Button
                  variant="outline"
                  onClick={handleBackToOrder}
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <ArrowLeft size={18} />
                  Regresar a Orden
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || loadingData || selectedProducts.length === 0}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Guardar Productos
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductsModal;
