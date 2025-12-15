"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Badge,
  Alert,
} from "react-bootstrap";
import { Plus, Trash2 } from "lucide-react";
import { OrderItem } from "../types";
import { ProductCategory } from "@/features/admin/modules/productCategories/types";
import { Storage } from "@/features/admin/modules/storage/types";
import { productCategoriesService } from "@/features/admin/modules/productCategories/services/productCategories";
import { toast } from "react-toastify";

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
  // Estado interno para categorías de productos
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loadingProductCategories, setLoadingProductCategories] = useState(false);

  // Cargar categorías de productos al montar
  useEffect(() => {
    const fetchProductCategories = async () => {
      setLoadingProductCategories(true);
      try {
        const response = await productCategoriesService.getAllProductCategories({
          limit: 1000,
          isActive: true,
        });
        setProductCategories(response.data);
      } catch (err) {
        console.error("Error al cargar categorías de productos:", err);
        toast.error("Error al cargar las categorías de productos");
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
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>("");

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
      toast.error("Debes seleccionar una categoría para el producto");
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
    <Col xs={12} lg={4} style={{ height: "100%" }}>
      <Card className="border-0 shadow-sm h-100 d-flex flex-column">
        <Card.Header className="bg-white border-0 py-2 flex-shrink-0">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold">Carrito</span>
            <Badge bg="primary">{items.length}</Badge>
          </div>
        </Card.Header>
        <Card.Body className="flex-grow-1" style={{ overflow: "auto" }}>
          {/* Producto manual rápido */}
          <div className="mb-3">
            <div className="fw-semibold mb-2">Producto manual</div>
            <Row className="g-2">
              <Col xs={12}>
                <Form.Control
                  type="text"
                  placeholder="Nombre del producto"
                  value={currentProductName}
                  onChange={(e) => setCurrentProductName(e.target.value)}
                  className="py-2"
                />
              </Col>
              <Col xs={6}>
                <Form.Control
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
              </Col>
              <Col xs={6}>
                <Form.Control
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
              </Col>
              <Col xs={12}>
                <Form.Select
                  value={selectedProductCategory}
                  onChange={(e) => setSelectedProductCategory(e.target.value)}
                  className="py-2"
                  disabled={loadingProductCategories}
                >
                  <option value="">
                    {loadingProductCategories
                      ? "Cargando categorías..."
                      : "-- Categoría --"}
                  </option>
                  {productCategories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={12} className="d-grid">
                <Button variant="outline-primary" onClick={handleAddItem}>
                  <Plus size={16} className="me-2" />
                  Agregar (${calculateItemAmount().toFixed(2)})
                </Button>
              </Col>
            </Row>
          </div>

          {/* Lista de items */}
          {items.length === 0 ? (
            <Alert variant="light" className="mb-0">
              Aún no hay productos. Agrega desde el catálogo.
            </Alert>
          ) : (
            <div
              className="table-responsive"
              style={{ maxHeight: 340, overflow: "auto" }}
            >
              <table className="table table-sm align-middle">
                <tbody>
                  {items.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr>
                        <td>
                          <div className="fw-semibold">{item.productName}</div>
                          <div className="text-muted small">
                            {item.quantity} × ${item.unitPrice.toFixed(2)}{" "}
                            <Badge
                              bg={item.isProduct ? "success" : "secondary"}
                              className="ms-2"
                            >
                              {item.isProduct ? "Catálogo" : "Manual"}
                            </Badge>
                          </div>
                        </td>
                        <td className="text-end fw-bold">
                          ${item.amount.toFixed(2)}
                        </td>
                        <td className="text-end" style={{ width: 96 }}>
                          <div className="d-flex justify-content-end gap-1">
                            <Button
                              variant="outline-primary"
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
                              variant="outline-danger"
                              size="sm"
                              onClick={() => onRemoveItem(index)}
                              title="Eliminar"
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
                            className="border-0"
                          >
                            <td className="py-1 ps-4 border-0 text-muted small">
                              {insumo.cantidad} {insumo.nombre}
                              {insumo.isExtra && (
                                <Badge
                                  bg="info"
                                  className="ms-2 text-white"
                                  style={{ fontSize: "0.65rem" }}
                                >
                                  Extra
                                </Badge>
                              )}
                            </td>
                            <td className="py-1 border-0 text-end text-muted small">
                              {insumo.isExtra
                                ? `+$${insumo.importeVenta.toFixed(2)}`
                                : ""}
                            </td>
                            <td className="py-1 border-0"></td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <hr />

          {/* Totales */}
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Subtotal</span>
            <span className="fw-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted">Descuento</span>
            <span className="text-danger fw-semibold">
              -$
              {(discountType === "porcentaje"
                ? (subtotal * (discount || 0)) / 100
                : discount || 0
              ).toFixed(2)}
            </span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Envío</span>
            <span className="text-success fw-semibold">
              +${(deliveryPrice || 0).toFixed(2)}
            </span>
          </div>
          <div className="d-flex justify-content-between align-items-center border-top pt-2">
            <span className="fs-5 fw-bold">Total</span>
            <span className="fs-4 fw-bold text-primary">
              ${total.toFixed(2)}
            </span>
          </div>
        </Card.Body>
        <Card.Footer className="bg-white border-0 p-3 flex-shrink-0">
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              size="lg"
              disabled={items.length === 0}
              onClick={() => {
                if (items.length === 0) {
                  toast.error("Agrega al menos un producto para continuar");
                  return;
                }
                onContinueToCheckout();
              }}
            >
              Datos del pedido / Cobrar
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => window.history.back()}
            >
              Salir
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </Col>
  );
};

export default CartSection;
