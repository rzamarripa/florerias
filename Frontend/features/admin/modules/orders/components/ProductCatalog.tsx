"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, AlertTriangle, Warehouse, Loader2 } from "lucide-react";
import { productListsService } from "@/features/admin/modules/product-lists/services/productLists";
import { EmbeddedProductWithStock } from "@/features/admin/modules/product-lists/types";
import { OrderItem } from "../types";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Storage } from "@/features/admin/modules/storage/types";

interface ProductInsumo {
  nombre: string;
  cantidad: number;
  importeVenta: number;
}

interface Product {
  _id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  productCategory: string | null;
  insumos?: ProductInsumo[];
}

interface ProductCatalogProps {
  onAddProduct: (product: Product, cantidad: number) => void;
  branchId: string;
  itemsInOrder: OrderItem[];
  storage: Storage | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onAddProduct,
  branchId,
  itemsInOrder,
  storage,
  searchTerm,
  onSearchChange,
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<EmbeddedProductWithStock[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar productos de la lista de productos de la sucursal
  useEffect(() => {
    if (branchId) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [branchId]);

  const fetchProducts = async () => {
    if (!branchId) return;

    setLoading(true);
    try {
      const response = await productListsService.getProductListByBranch(
        branchId
      );
      setProducts(response.data.products);
      console.log("Productos cargados:", response.data.products);
    } catch (error: any) {
      console.error("Error al cargar productos:", error);
      if (
        error.message !==
        "No se encontró una lista de productos para esta sucursal"
      ) {
        toast.error("Error al cargar los productos de la sucursal");
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para obtener el stock disponible de un producto
  const getAvailableStock = (product: EmbeddedProductWithStock): number => {
    // Si no hay storage, todos los productos tienen stock 0
    if (!storage) {
      return 0;
    }

    // Si hay un storage disponible, usar el stock del storage
    const productInStorage = storage.products.find(
      (p: any) => p.productId._id === product.productId
    );

    if (productInStorage) {
      return productInStorage.quantity;
    }

    return 0;
  };


  // Función para calcular el precio de venta final
  const calculateFinalPrice = (product: EmbeddedProductWithStock) => {
    // El precio ya está calculado en totalVenta
    return product.totalVenta;
  };

  // Función para formatear números con separación de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAddToOrder = (product: EmbeddedProductWithStock) => {
    const precio = calculateFinalPrice(product);

    // Mapear los insumos del producto
    const insumos: ProductInsumo[] = product.insumos?.map((insumo) => ({
      nombre: insumo.nombre,
      cantidad: insumo.cantidad,
      importeVenta: insumo.importeVenta,
    })) || [];

    const productToAdd: Product = {
      _id: product.productId,
      nombre: product.nombre,
      precio,
      imagen: product.imagen,
      productCategory: product.productCategory ?? null,
      insumos,
    };

    // Siempre agregar 1 unidad por click
    onAddProduct(productToAdd, 1);
  };

  const handleManageStock = (product: EmbeddedProductWithStock) => {
    // Redirigir a StoragePage con parámetros
    const params = new URLSearchParams({
      fromOrder: "true",
      productId: product.productId,
      branchId: branchId,
      hasStock: product.availableQuantity > 0 ? "false" : "true", // false si cantidad=0, true si no existe
    });
    router.push(`/sucursal/almacenes?${params.toString()}`);
  };

  return (
    <div className="product-catalog sticky top-0">
      {!storage && branchId && (
        <Alert variant="default" className="mb-3 border-blue-200 bg-blue-50">
          <AlertTriangle size={16} className="text-blue-500" />
          <AlertTitle className="font-semibold">Sin almacén disponible</AlertTitle>
          <AlertDescription className="text-sm mt-1">
            No hay almacén asignado a esta sucursal. Todos los productos se
            muestran con stock en 0.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="animate-spin text-primary mb-3 mx-auto" size={32} />
          <p className="text-muted-foreground mb-0">Cargando productos...</p>
        </div>
      ) : !branchId ? (
        <div className="text-center py-10">
          <Package size={64} className="text-muted-foreground opacity-25 mb-3 mx-auto" />
          <p className="text-muted-foreground mb-0">
            Selecciona una sucursal para ver productos
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-10">
          <Package size={64} className="text-muted-foreground opacity-25 mb-3 mx-auto" />
          <p className="text-muted-foreground mb-0">
            {searchTerm
              ? "No se encontraron productos"
              : "No hay productos disponibles para esta sucursal"}
          </p>
          {searchTerm && (
            <small className="text-muted-foreground">
              Intenta con otro término de búsqueda
            </small>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
          {filteredProducts.map((product) => {
            const precio = calculateFinalPrice(product);
            const availableStock = getAvailableStock(product);
            const isOutOfStock = availableStock <= 0;

            return (
              <Card
                key={product.productId}
                className={`shadow-sm overflow-hidden h-full border-[#a8c5e8] ${
                  isOutOfStock ? "cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
                } transition-all duration-200`}
                onClick={() => {
                  if (!isOutOfStock) {
                    handleAddToOrder(product);
                  }
                }}
              >
                <div className="relative">
                  {product.imagen ? (
                    <img
                      src={product.imagen}
                      alt={product.nombre}
                      className="w-full h-[100px] object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex items-center justify-center w-full h-[100px]">
                      <Package size={28} className="text-muted-foreground" />
                    </div>
                  )}
                  {/* Badge de stock tipo banderín */}
                  <div
                    className={`absolute top-0 right-0 text-white font-bold text-xs px-3 py-1 rounded-bl-lg shadow-md min-w-[28px] text-center ${
                      isOutOfStock
                        ? "bg-red-500"
                        : availableStock < 5
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  >
                    {availableStock}
                  </div>
                </div>
                <CardContent className="p-2 flex flex-col">
                  <h6
                    className="font-bold mb-1 text-foreground text-xs leading-tight overflow-hidden text-ellipsis"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      minHeight: "1.8rem"
                    }}
                  >
                    {product.nombre}
                  </h6>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-bold text-sm">
                      ${formatNumber(precio)}
                    </span>
                  </div>
                </CardContent>
                {isOutOfStock && (
                  <Button
                    variant="default"
                    className="rounded-none w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManageStock(product);
                    }}
                  >
                    <Warehouse size={14} className="mr-1" />
                    Sin stock
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .product-catalog {
          position: sticky;
          top: 0;
        }
      `}</style>
    </div>
  );
};

export default ProductCatalog;
