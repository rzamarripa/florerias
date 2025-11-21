"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  InputGroup,
  Spinner,
  Badge,
  Alert,
} from "react-bootstrap";
import { Search, Plus, Package, AlertTriangle, Warehouse } from "lucide-react";
import { productListsService } from "@/features/admin/modules/product-lists/services/productLists";
import { EmbeddedProductWithStock } from "@/features/admin/modules/product-lists/types";
import { OrderItem } from "../types";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Storage } from "@/features/admin/modules/storage/types";

interface Product {
  _id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  categoria?: string;
}

interface ProductCatalogProps {
  onAddProduct: (product: Product, cantidad: number) => void;
  branchId: string;
  itemsInOrder: OrderItem[];
  storage: Storage | null;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onAddProduct,
  branchId,
  itemsInOrder,
  storage,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
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
      const response = await productListsService.getProductListByBranch(branchId);
      setProducts(response.data.products);
    } catch (error: any) {
      console.error("Error al cargar productos:", error);
      if (error.message !== "No se encontró una lista de productos para esta sucursal") {
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

  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities({
      ...quantities,
      [productId]: value > 0 ? value : 1,
    });
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
    const cantidad = quantities[product.productId] || 1;
    const precio = calculateFinalPrice(product);

    const productToAdd: Product = {
      _id: product.productId,
      nombre: product.nombre,
      precio,
      imagen: product.imagen,
    };

    onAddProduct(productToAdd, cantidad);
    // Reset quantity after adding
    setQuantities({
      ...quantities,
      [product.productId]: 1,
    });
  };

  const handleManageStock = (product: EmbeddedProductWithStock) => {
    // Redirigir a StoragePage con parámetros
    const params = new URLSearchParams({
      fromOrder: 'true',
      productId: product.productId,
      branchId: branchId,
      hasStock: product.availableQuantity > 0 ? 'false' : 'true', // false si cantidad=0, true si no existe
    });
    router.push(`/sucursal/almacenes?${params.toString()}`);
  };

  return (
    <div className="product-catalog h-100 d-flex flex-column">
      <Card className="border-0 shadow-sm h-100 d-flex flex-column">
        <Card.Header className="bg-white border-0 py-3 sticky-top">
          <div className="d-flex align-items-center gap-2 mb-3">
            <Package size={20} className="text-primary" />
            <h5 className="mb-0 fw-bold">Catálogo de Arreglos</h5>
          </div>
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0">
              <Search size={18} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0 ps-0"
            />
          </InputGroup>
        </Card.Header>

        <Card.Body
          className="flex-grow-1 overflow-auto p-3"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {!storage && branchId && (
            <Alert variant="info" className="mb-3">
              <AlertTriangle size={16} className="me-2" />
              <strong>Sin almacén disponible</strong>
              <p className="mb-0 small mt-1">
                No hay almacén asignado a esta sucursal. Todos los productos se muestran con stock en 0.
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
            <div className="d-flex flex-column gap-3">
              {filteredProducts.map((product) => {
                const precio = calculateFinalPrice(product);

                const availableStock = getAvailableStock(product);
                const isOutOfStock = availableStock <= 0;
                const currentQuantity = quantities[product.productId] || 1;

                return (
                  <Card
                    key={product.productId}
                    className="border shadow-sm product-card"
                  >
                    <div className="row g-0">
                      <div className="col-4">
                        {product.imagen ? (
                          <img
                            src={product.imagen}
                            alt={product.nombre}
                            className="rounded-start"
                            style={{
                              width: "100%",
                              height: "120px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            className="bg-light d-flex align-items-center justify-content-center rounded-start"
                            style={{ width: "100%", height: "120px" }}
                          >
                            <Package size={32} className="text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="col-8">
                        <Card.Body className="p-3">
                          <div className="d-flex flex-column h-100">
                            <div className="flex-grow-1">
                              <h6
                                className="fw-bold mb-1 text-primary"
                                style={{ fontSize: "0.95rem" }}
                              >
                                {product.nombre}
                              </h6>
                              {isOutOfStock && (
                                <Alert variant="danger" className="py-1 px-2 mb-2 small">
                                  <AlertTriangle size={14} className="me-1" />
                                  Sin stock en almacén
                                </Alert>
                              )}
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <p
                                  className="text-success fw-bold mb-0"
                                  style={{ fontSize: "1.1rem" }}
                                >
                                  ${formatNumber(precio)}
                                </p>
                                <Badge
                                  bg={
                                    isOutOfStock
                                      ? "danger"
                                      : availableStock < 5
                                      ? "warning"
                                      : "success"
                                  }
                                  className="text-white"
                                >
                                  Stock: {availableStock}
                                </Badge>
                              </div>
                            </div>
                            <div className="d-flex gap-2 align-items-center">
                              {!isOutOfStock ? (
                                <>
                                  <Form.Control
                                    type="number"
                                    min="1"
                                    max={availableStock}
                                    value={currentQuantity}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        product.productId,
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="form-control-sm"
                                    style={{ width: "70px" }}
                                  />
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex-grow-1"
                                    onClick={() => handleAddToOrder(product)}
                                    disabled={currentQuantity > availableStock}
                                  >
                                    <Plus size={16} className="me-1" />
                                    Agregar
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="warning"
                                  size="sm"
                                  className="w-100"
                                  onClick={() => handleManageStock(product)}
                                >
                                  <Warehouse size={16} className="me-1" />
                                  Gestionar Stock
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card.Body>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>

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
