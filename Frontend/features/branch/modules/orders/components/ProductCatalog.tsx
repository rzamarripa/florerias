"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { Package, AlertTriangle, Warehouse } from "lucide-react";
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
      console.log("🔍 Productos cargados:", response.data.products);
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
    <div className="product-catalog">
          {!storage && branchId && (
            <Alert variant="info" className="mb-3">
              <AlertTriangle size={16} className="me-2" />
              <strong>Sin almacén disponible</strong>
              <p className="mb-0 small mt-1">
                No hay almacén asignado a esta sucursal. Todos los productos se
                muestran con stock en 0.
              </p>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="text-muted mb-0">Cargando productos...</p>
            </div>
          ) : !branchId ? (
            <div className="text-center py-5">
              <Package size={64} className="text-muted opacity-25 mb-3" />
              <p className="text-muted mb-0">
                Selecciona una sucursal para ver productos
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-5">
              <Package size={64} className="text-muted opacity-25 mb-3" />
              <p className="text-muted mb-0">
                {searchTerm
                  ? "No se encontraron productos"
                  : "No hay productos disponibles para esta sucursal"}
              </p>
              {searchTerm && (
                <small className="text-muted">
                  Intenta con otro término de búsqueda
                </small>
              )}
            </div>
          ) : (
            <div className="row g-2">
              {filteredProducts.map((product) => {
                const precio = calculateFinalPrice(product);
                const availableStock = getAvailableStock(product);
                const isOutOfStock = availableStock <= 0;

                return (
                  <div key={product.productId} className="col-6 col-xl-4">
                    <Card
                      className="shadow-sm product-card h-100 overflow-hidden"
                      style={{
                        border: "1px solid #a8c5e8",
                        cursor: isOutOfStock ? "not-allowed" : "pointer"
                      }}
                      onClick={() => {
                        if (!isOutOfStock) {
                          handleAddToOrder(product);
                        }
                      }}
                    >
                      <div className="position-relative">
                        {product.imagen ? (
                          <img
                            src={product.imagen}
                            alt={product.nombre}
                            className="card-img-top"
                            style={{
                              width: "100%",
                              height: "100px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            className="bg-light d-flex align-items-center justify-content-center"
                            style={{ width: "100%", height: "100px" }}
                          >
                            <Package size={28} className="text-muted" />
                          </div>
                        )}
                        {/* Badge de stock tipo banderín */}
                        <div
                          className={`stock-ribbon ${
                            isOutOfStock
                              ? "bg-danger"
                              : availableStock < 5
                              ? "bg-warning"
                              : "bg-success"
                          }`}
                        >
                          {availableStock}
                        </div>
                      </div>
                      <Card.Body className="p-2 d-flex flex-column">
                        <h6
                          className="fw-bold mb-1 text-dark"
                          style={{
                            fontSize: "0.8rem",
                            lineHeight: "1.15",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            minHeight: "1.8rem"
                          }}
                        >
                          {product.nombre}
                        </h6>
                        <div className="d-flex justify-content-between align-items-center">
                          <span
                            className="text-success fw-bold"
                            style={{ fontSize: "0.95rem" }}
                          >
                            ${formatNumber(precio)}
                          </span>
                        </div>
                      </Card.Body>
                      {isOutOfStock && (
                        <Button
                          variant="warning"
                          className="rounded-0 border-0 w-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManageStock(product);
                          }}
                          style={{ padding: "6px 8px", fontSize: "0.8rem" }}
                        >
                          <Warehouse size={14} className="me-1" />
                          Sin stock
                        </Button>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          )}

      <style jsx>{`
        .product-catalog {
          position: sticky;
          top: 0;
        }

        .product-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }

        .stock-ribbon {
          position: absolute;
          top: 0;
          right: 0;
          color: white;
          font-weight: bold;
          font-size: 0.75rem;
          padding: 4px 12px 4px 8px;
          border-radius: 0 0 0 8px;
          box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.2);
          min-width: 28px;
          text-align: center;
        }

        .overflow-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .overflow-auto::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .overflow-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default ProductCatalog;
