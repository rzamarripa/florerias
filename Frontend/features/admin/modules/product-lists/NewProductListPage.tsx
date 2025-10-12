"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Table, Badge, Alert } from "react-bootstrap";
import {
  Package,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  X,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { productListsService } from "./services/productLists";
import { CreateProductListData } from "./types";
import { productsService } from "../products/services/products";
import { Product } from "../products/types";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { companiesService } from "../companies/services/companies";

const NewProductListPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const productListId = params?.id as string;
  const isEditing = !!productListId;

  const { getUserId } = useUserSessionStore();
  const userId = getUserId();

  const [formData, setFormData] = useState<CreateProductListData>({
    name: "",
    products: [],
    company: "",
    expirationDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [userCompany, setUserCompany] = useState<any>(null);

  // Cargar productos disponibles
  useEffect(() => {
    loadProducts();
    loadUserCompany();
  }, []);

  // Cargar lista de productos si estamos editando
  useEffect(() => {
    if (isEditing) {
      loadProductList();
    }
  }, [productListId]);

  const loadProducts = async () => {
    try {
      const response = await productsService.getAllProducts({
        limit: 1000,
        estatus: true
      });
      setAvailableProducts(response.data);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar los productos");
    }
  };

  const loadUserCompany = async () => {
    try {
      if (!userId) return;

      const response = await companiesService.getAllCompanies({ limit: 1000 });

      // Buscar la empresa donde el usuario es el administrador
      const company = response.data.find(
        (comp: any) => comp.administrator && comp.administrator._id === userId
      );

      if (company) {
        setUserCompany(company);
        setFormData(prev => ({ ...prev, company: company._id }));
      }
    } catch (err: any) {
      console.error("Error al cargar empresa del usuario:", err);
      toast.error(err.message || "Error al cargar la empresa del usuario");
    }
  };

  const loadProductList = async () => {
    try {
      setLoading(true);
      const response = await productListsService.getProductListById(productListId);
      const productList = response.data;

      setFormData({
        name: productList.name,
        products: productList.products.map(p => p.productId),
        company: typeof productList.company === 'string' ? productList.company : productList.company._id,
        expirationDate: productList.expirationDate.split('T')[0], // Format for input[type="date"]
      });

      // Set selected products for display
      setSelectedProducts(
        productList.products.map(embeddedProduct => ({
          _id: embeddedProduct.productId,
          nombre: embeddedProduct.nombre,
          unidad: embeddedProduct.unidad,
          descripcion: embeddedProduct.descripcion,
          orden: embeddedProduct.orden,
          imagen: embeddedProduct.imagen,
          insumos: embeddedProduct.insumos,
          totalCosto: embeddedProduct.totalCosto,
          totalVenta: embeddedProduct.totalVenta,
          labour: embeddedProduct.labour,
          estatus: embeddedProduct.estatus,
          createdAt: '',
          updatedAt: ''
        }))
      );
    } catch (err: any) {
      toast.error(err.message || "Error al cargar la lista de productos");
      router.push("/catalogos/listas-productos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (productId: string) => {
    const product = availableProducts.find(p => p._id === productId);
    if (!product) return;

    // Check if already added
    if (formData.products.includes(productId)) {
      toast.warning("Este producto ya está agregado");
      return;
    }

    setFormData(prev => ({
      ...prev,
      products: [...prev.products, productId]
    }));

    setSelectedProducts(prev => [...prev, product]);
  };

  const handleRemoveProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(id => id !== productId)
    }));

    setSelectedProducts(prev => prev.filter(p => p._id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name || !formData.company || !formData.expirationDate) {
        throw new Error("El nombre, empresa y fecha de expiración son obligatorios");
      }

      if (formData.products.length === 0) {
        throw new Error("Debes agregar al menos un producto a la lista");
      }

      if (isEditing) {
        await productListsService.updateProductList(productListId, formData);
        toast.success("Lista de productos actualizada exitosamente");
      } else {
        await productListsService.createProductList(formData);
        toast.success("Lista de productos creada exitosamente");
      }

      router.push("/catalogos/listas-productos");
    } catch (err: any) {
      setError(err.message || "Error al guardar la lista de productos");
      toast.error(err.message || "Error al guardar la lista de productos");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalProducts = selectedProducts.length;
    let totalGastado = 0;
    let gananciasBrutas = 0;

    selectedProducts.forEach((product) => {
      totalGastado += product.totalCosto + product.labour;
      gananciasBrutas += product.totalVenta;
    });

    const gananciasNetas = gananciasBrutas - totalGastado;

    return {
      totalProducts,
      totalGastado,
      gananciasBrutas,
      gananciasNetas,
    };
  };

  const totals = calculateTotals();

  if (loading && isEditing) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="new-product-list-page">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Información Básica */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <Package size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Información de la Lista</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Nombre de la Lista <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre de la lista"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Fecha de Expiración <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expirationDate: e.target.value })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Empresa <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={userCompany?.tradeName || userCompany?.legalName || "Cargando..."}
                    disabled
                    readOnly
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    Empresa asignada a tu usuario
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Agregar Productos */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <Package size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Productos</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3 mb-3">
              <Col md={10}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Seleccionar Producto</Form.Label>
                  <Form.Select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddProduct(e.target.value);
                        e.target.value = ""; // Reset select
                      }
                    }}
                    className="py-2"
                  >
                    <option value="">-- Seleccionar un producto --</option>
                    {availableProducts.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.nombre} ({product.unidad})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Lista de Productos Seleccionados */}
            {selectedProducts.length > 0 && (
              <div className="table-responsive">
                <Table className="table table-hover table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Producto</th>
                      <th>Unidad</th>
                      <th className="text-end">Total Costo</th>
                      <th className="text-end">Labour</th>
                      <th className="text-end">Total Venta</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map((product) => (
                      <tr key={product._id}>
                        <td>{product.nombre}</td>
                        <td>
                          <Badge bg="secondary">{product.unidad}</Badge>
                        </td>
                        <td className="text-end text-danger">
                          ${product.totalCosto.toFixed(2)}
                        </td>
                        <td className="text-end text-warning">
                          ${product.labour.toFixed(2)}
                        </td>
                        <td className="text-end text-primary">
                          ${product.totalVenta.toFixed(2)}
                        </td>
                        <td className="text-center">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveProduct(product._id)}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light fw-bold">
                    <tr>
                      <td colSpan={2} className="text-end">
                        Totales ({totals.totalProducts} productos):
                      </td>
                      <td className="text-end text-danger">
                        ${totals.totalGastado.toFixed(2)}
                      </td>
                      <td></td>
                      <td className="text-end text-primary">
                        ${totals.gananciasBrutas.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="text-end">
                        Ganancias Netas:
                      </td>
                      <td className="text-center">
                        <Badge bg={totals.gananciasNetas >= 0 ? "success" : "danger"} className="fs-6">
                          ${totals.gananciasNetas.toFixed(2)}
                        </Badge>
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Botones */}
        <div className="d-flex justify-content-between gap-2 mb-4">
          <Button
            type="button"
            variant="outline-secondary"
            size="lg"
            onClick={() => router.back()}
            className="d-flex align-items-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="d-flex align-items-center gap-2 px-5"
          >
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default NewProductListPage;
