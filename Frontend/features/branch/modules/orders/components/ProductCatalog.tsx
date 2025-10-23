"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Button, InputGroup, Spinner, Badge } from "react-bootstrap";
import { Search, Plus, Package } from "lucide-react";
import { productsService } from "@/features/admin/modules/products/services/products";
import { Product as ProductType } from "@/features/admin/modules/products/types";
import { Storage } from "@/features/admin/modules/storage/types";
import { OrderItem } from "../types";

interface Product {
  _id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  categoria?: string;
}

interface ProductCatalogProps {
  onAddProduct: (product: Product, cantidad: number) => void;
  storage: Storage | null;
  itemsInOrder: OrderItem[];
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ onAddProduct, storage, itemsInOrder }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar productos solo cuando hay un storage seleccionado
  useEffect(() => {
    if (storage) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [storage]);

  const fetchProducts = async () => {
    if (!storage) return;

    setLoading(true);
    try {
      const response = await productsService.getAllProducts({
        limit: 1000,
        estatus: true,
      });

      // Filtrar productos que existen en el storage
      const storageProductIds = storage.products.map((p: any) => p.productId._id);
      const availableProducts = response.data.filter((product) =>
        storageProductIds.includes(product._id)
      );

      setProducts(availableProducts);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para obtener el stock disponible de un producto
  const getAvailableStock = (productId: string): number => {
    if (!storage) return 0;

    const productInStorage = storage.products.find(
      (p: any) => p.productId._id === productId
    );

    if (!productInStorage) return 0;

    // Restar cantidad ya agregada en la orden
    const quantityInOrder = itemsInOrder
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);

    return productInStorage.quantity - quantityInOrder;
  };

  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities({
      ...quantities,
      [productId]: value > 0 ? value : 1,
    });
  };

  const handleAddToOrder = (product: ProductType) => {
    const cantidad = quantities[product._id] || 1;
    // Calcular precio desde los insumos
    const precio =
      product.insumos?.reduce(
        (sum, insumo) => sum + (insumo.importeVenta || 0),
        0
      ) || 0;

    const productToAdd: Product = {
      _id: product._id,
      nombre: product.nombre,
      precio,
      imagen: product.imagen,
    };

    onAddProduct(productToAdd, cantidad);
    // Reset quantity after adding
    setQuantities({
      ...quantities,
      [product._id]: 1,
    });
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
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p className="text-muted mb-0">Cargando productos...</p>
            </div>
          ) : !storage ? (
            <div className="text-center py-5">
              <Package size={64} className="text-muted opacity-25 mb-3" />
              <p className="text-muted mb-0">
                Selecciona un almacén para ver productos
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-5">
              <Package size={64} className="text-muted opacity-25 mb-3" />
              <p className="text-muted mb-0">
                {searchTerm
                  ? "No se encontraron productos"
                  : "No hay productos disponibles en este almacén"}
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
                const precio =
                  product.insumos?.reduce(
                    (sum, insumo) => sum + (insumo.importeVenta || 0),
                    0
                  ) || 0;

                const availableStock = getAvailableStock(product._id);
                const isOutOfStock = availableStock <= 0;
                const currentQuantity = quantities[product._id] || 1;

                return (
                  <Card
                    key={product._id}
                    className={`border shadow-sm product-card ${isOutOfStock ? 'opacity-50' : ''}`}
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
                              objectFit: "cover"
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
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <p
                                  className="text-success fw-bold mb-0"
                                  style={{ fontSize: "1.1rem" }}
                                >
                                  ${precio.toFixed(2)}
                                </p>
                                <Badge
                                  bg={isOutOfStock ? "danger" : availableStock < 5 ? "warning" : "success"}
                                  className="text-white"
                                >
                                  Stock: {availableStock}
                                </Badge>
                              </div>
                            </div>
                            <div className="d-flex gap-2 align-items-center">
                              <Form.Control
                                type="number"
                                min="1"
                                max={availableStock}
                                value={currentQuantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    product._id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="form-control-sm"
                                style={{ width: "70px" }}
                                disabled={isOutOfStock}
                              />
                              <Button
                                variant="primary"
                                size="sm"
                                className="flex-grow-1"
                                onClick={() => handleAddToOrder(product)}
                                disabled={isOutOfStock || currentQuantity > availableStock}
                              >
                                <Plus size={16} className="me-1" />
                                {isOutOfStock ? "Sin stock" : "Agregar"}
                              </Button>
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
