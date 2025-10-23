"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Spinner, Table, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { X, Package, Save } from "lucide-react";
import { storageService } from "../services/storage";
import { productsService } from "../../products/services/products";
import { Storage, Product } from "../types";

interface AddProductsModalProps {
  show: boolean;
  onHide: () => void;
  onProductsAdded: () => void;
  storage: Storage | null;
}

interface ProductWithQuantity extends Product {
  quantityToAdd: number;
}

const AddProductsModal: React.FC<AddProductsModalProps> = ({
  show,
  onHide,
  onProductsAdded,
  storage,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductWithQuantity[]>([]);

  useEffect(() => {
    if (show && storage) {
      loadProducts();
    }
  }, [show, storage]);

  const loadProducts = async () => {
    try {
      setLoadingData(true);
      const response = await productsService.getAllProducts({ limit: 1000, estatus: true });

      // Filtrar productos que NO están en el almacén
      const storageProductIds = storage?.products.map((p) =>
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

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    if (!productId) return;

    const product = availableProducts.find((p) => p._id === productId);
    if (!product) return;

    // Verificar que el producto no esté ya seleccionado
    if (selectedProducts.some((p) => p._id === productId)) {
      toast.warning("Este producto ya está en la lista");
      return;
    }

    // Agregar el producto a la lista de seleccionados
    setSelectedProducts([
      ...selectedProducts,
      { ...product, quantityToAdd: 1 },
    ]);

    // Resetear el select
    e.target.value = "";
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
        toast.error("No hay almacén seleccionado");
        return;
      }

      // Filtrar productos con cantidad mayor a 0
      const validProducts = selectedProducts.filter((p) => p.quantityToAdd > 0);

      if (validProducts.length === 0) {
        toast.error("Debes agregar al menos un producto con cantidad mayor a 0");
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

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header className="border-0 pb-0">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1 fw-bold">Agregar Productos al Almacén</h5>
              {storage && (
                <p className="text-muted mb-0 small">
                  {typeof storage.branch === "string"
                    ? storage.branch
                    : storage.branch.branchName}
                </p>
              )}
            </div>
            <Button variant="link" onClick={handleClose} className="text-muted p-0">
              <X size={24} />
            </Button>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        {loadingData ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-2">Cargando productos...</p>
          </div>
        ) : (
          <>
            {/* Select para agregar productos */}
            <div className="mb-4">
              <Form.Group>
                <Form.Label className="fw-semibold">Seleccionar Producto</Form.Label>
                <Form.Select onChange={handleProductSelect} disabled={availableProducts.length === 0}>
                  <option value="">
                    {availableProducts.length === 0
                      ? "No hay productos disponibles"
                      : "Seleccionar un producto para agregar..."}
                  </option>
                  {availableProducts.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.nombre} ({product.unidad})
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  {availableProducts.length === 0
                    ? "Todos los productos ya están en el almacén"
                    : `${availableProducts.length} producto(s) disponible(s)`}
                </Form.Text>
              </Form.Group>
            </div>

            {/* Tabla de productos seleccionados */}
            <div>
              <h6 className="mb-3 fw-semibold">Productos a Agregar</h6>
              {selectedProducts.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <Package size={48} className="mb-3 opacity-50" />
                  <p className="mb-0">No hay productos seleccionados</p>
                  <small>Selecciona productos del menú de arriba</small>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead style={{ background: "#f8f9fa" }}>
                      <tr>
                        <th className="px-3 py-2 fw-semibold text-muted">PRODUCTO</th>
                        <th className="px-3 py-2 fw-semibold text-muted">UNIDAD</th>
                        <th className="px-3 py-2 fw-semibold text-muted" style={{ width: "150px" }}>
                          CANTIDAD
                        </th>
                        <th
                          className="px-3 py-2 fw-semibold text-muted text-center"
                          style={{ width: "80px" }}
                        >
                          ACCIÓN
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map((product) => (
                        <tr key={product._id}>
                          <td className="px-3 py-2 fw-semibold">{product.nombre}</td>
                          <td className="px-3 py-2">
                            <Badge bg="secondary">{product.unidad}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Form.Control
                              type="number"
                              min="0"
                              value={product.quantityToAdd}
                              onChange={(e) =>
                                handleQuantityChange(product._id, parseInt(e.target.value) || 0)
                              }
                              size="sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleRemoveProduct(product._id)}
                              className="text-danger p-0"
                            >
                              <X size={18} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || loadingData || selectedProducts.length === 0}
          className="d-flex align-items-center gap-2"
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={18} />
              Guardar Productos
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddProductsModal;
