"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { OrderItem } from "../types";
import { ProductCategory } from "@/features/admin/modules/productCategories/types";
import { Storage } from "@/features/admin/modules/storage/types";
import { productCategoriesService } from "@/features/admin/modules/productCategories/services/productCategories";
import { toast } from "react-toastify";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CartSectionProps {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountType: "porcentaje" | "cantidad";
  total: number;
  deliveryPrice: number;
  storage: Storage | null;
  onAddItem: (item: OrderItem) => void;
  onRemoveItem: (index: number) => void;
  onOpenExtrasModal: (index: number) => void;
  onContinueToCheckout: () => void;
}

const CartSection: React.FC<CartSectionProps> = ({
  items,
  subtotal,
  discount,
  discountType,
  total,
  deliveryPrice,
  storage,
  onAddItem,
  onRemoveItem,
  onOpenExtrasModal,
  onContinueToCheckout,
}) => {
  // Estado interno para categorias de productos
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    []
  );
  const [loadingProductCategories, setLoadingProductCategories] =
    useState(false);

  // Cargar categorias de productos al montar
  useEffect(() => {
    const fetchProductCategories = async () => {
      setLoadingProductCategories(true);
      try {
        const response = await productCategoriesService.getAllProductCategories(
          {
            limit: 1000,
            isActive: true,
          }
        );
        setProductCategories(response.data);
      } catch (err) {
        console.error("Error al cargar categorias de productos:", err);
        toast.error("Error al cargar las categorias de productos");
      } finally {
        setLoadingProductCategories(false);
      }
    };

    fetchProductCategories();
  }, []);
  // Estado local para el formulario de producto manual
  const [currentProductName, setCurrentProductName] = useState<string>("");
  const [currentItem, setCurrentItem] = useState<OrderItem>({
    isProduct: false,
    productName: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    productCategory: null,
  });
  const [selectedProductCategory, setSelectedProductCategory] =
    useState<string>("");

  // Calcular importe del item actual
  const calculateItemAmount = () => {
    return currentItem.quantity * currentItem.unitPrice;
  };

  // Agregar item a la lista
  const handleAddItem = () => {
    if (!currentProductName || currentItem.unitPrice <= 0) {
      toast.error("Por favor completa el nombre del producto y el precio");
      return;
    }

    if (!selectedProductCategory) {
      toast.error("Debes seleccionar una categoria para el producto");
      return;
    }

    const newItem: OrderItem = {
      ...currentItem,
      isProduct: false,
      productName: currentProductName,
      amount: calculateItemAmount(),
      productCategory: selectedProductCategory,
    };

    onAddItem(newItem);

    // Reset form
    setCurrentItem({
      isProduct: false,
      productName: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      productCategory: null,
    });
    setCurrentProductName("");
    setSelectedProductCategory("");
  };

  return (
    <div className="col-span-12 lg:col-span-4 h-full">
      <Card className="shadow-sm h-full flex flex-col">
        <CardHeader className="bg-white py-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold">Carrito</span>
            <Badge variant="default">{items.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
          {/* Producto manual rapido */}
          <div className="mb-3">
            <div className="font-semibold mb-2">Producto manual</div>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-12">
                <Input
                  type="text"
                  placeholder="Nombre del producto"
                  value={currentProductName}
                  onChange={(e) => setCurrentProductName(e.target.value)}
                  className="py-2"
                />
              </div>
              <div className="col-span-6">
                <Input
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="py-2 text-center"
                />
              </div>
              <div className="col-span-6">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Precio"
                  value={currentItem.unitPrice || ""}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      unitPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="py-2"
                />
              </div>
              <div className="col-span-12">
                <Select
                  value={selectedProductCategory}
                  onValueChange={setSelectedProductCategory}
                  disabled={loadingProductCategories}
                >
                  <SelectTrigger className="py-2">
                    <SelectValue
                      placeholder={
                        loadingProductCategories
                          ? "Cargando categorias..."
                          : "-- Categoria --"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-12">
                <Button
                  variant="outline"
                  onClick={handleAddItem}
                  className="w-full"
                >
                  <Plus size={16} className="mr-2" />
                  Agregar (${calculateItemAmount().toFixed(2)})
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de items */}
          {items.length === 0 ? (
            <Alert className="mb-0">
              <AlertDescription>
                Aun no hay productos. Agrega desde el catalogo.
              </AlertDescription>
            </Alert>
          ) : (
            <div
              className="overflow-auto"
              style={{ maxHeight: 340 }}
            >
              <table className="w-full text-sm">
                <tbody>
                  {items.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr className="border-b">
                        <td className="py-2">
                          <div className="font-semibold">{item.productName}</div>
                          <div className="text-muted-foreground text-sm">
                            {item.quantity} x ${item.unitPrice.toFixed(2)}{" "}
                            <Badge
                              variant={item.isProduct ? "default" : "secondary"}
                              className="ml-2"
                            >
                              {item.isProduct ? "Catalogo" : "Manual"}
                            </Badge>
                          </div>
                        </td>
                        <td className="text-right font-bold py-2">
                          ${item.amount.toFixed(2)}
                        </td>
                        <td className="text-right py-2" style={{ width: 96 }}>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenExtrasModal(index)}
                              title="Agregar extras"
                              disabled={
                                !storage ||
                                !storage.materials ||
                                storage.materials.length === 0
                              }
                            >
                              <Plus size={16} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRemoveItem(index)}
                              title="Eliminar"
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {item.insumos &&
                        item.insumos.length > 0 &&
                        item.insumos.map((insumo, idx) => (
                          <tr
                            key={`${index}-insumo-${idx}`}
                            className=""
                          >
                            <td className="py-1 pl-4 text-muted-foreground text-sm">
                              {insumo.cantidad} {insumo.nombre}
                              {insumo.isExtra && (
                                <Badge
                                  variant="secondary"
                                  className="ml-2 text-xs"
                                >
                                  Extra
                                </Badge>
                              )}
                            </td>
                            <td className="py-1 text-right text-muted-foreground text-sm">
                              {insumo.isExtra
                                ? `+$${insumo.importeVenta.toFixed(2)}`
                                : ""}
                            </td>
                            <td className="py-1"></td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <hr className="my-4" />

          {/* Totales */}
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Descuento</span>
            <span className="text-red-500 font-semibold">
              -$
              {(discountType === "porcentaje"
                ? (subtotal * (discount || 0)) / 100
                : discount || 0
              ).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Envio</span>
            <span className="text-green-600 font-semibold">
              +${(deliveryPrice || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center border-t pt-2">
            <span className="text-xl font-bold">Total</span>
            <span className="text-2xl font-bold text-blue-600">
              ${total.toFixed(2)}
            </span>
          </div>
        </CardContent>
        <CardFooter className="bg-white p-3 flex-shrink-0">
          <div className="grid gap-2 w-full">
            <Button
              size="lg"
              disabled={items.length === 0}
              onClick={() => {
                if (items.length === 0) {
                  toast.error("Agrega al menos un producto para continuar");
                  return;
                }
                onContinueToCheckout();
              }}
              className="w-full"
            >
              Datos del pedido / Cobrar
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Salir
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CartSection;
