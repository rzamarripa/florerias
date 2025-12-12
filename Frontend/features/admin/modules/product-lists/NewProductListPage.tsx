"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Table,
  Badge,
  Alert,
} from "react-bootstrap";
import { Package, Plus, Trash2, Save, ArrowLeft, List } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { productListsService } from "./services/productLists";
import { CreateProductListData } from "./types";
import { productsService } from "../products/services/products";
import { Product } from "../products/types";
import { companiesService } from "../companies/services/companies";
import { materialsService } from "../materials/services/materials";
import { Material } from "../materials/types";
import DesgloseModal from "./components/DesgloseModal";
import { useActiveBranchStore } from "@/stores/activeBranchStore";

const NewProductListPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const productListId = params?.id as string;
  const isEditing = !!productListId;
  const { activeBranch } = useActiveBranchStore();

  const [formData, setFormData] = useState<CreateProductListData>({
    name: "",
    products: [],
    company: "",
    branch: "",
    expirationDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<
    (Product & { cantidad: number })[]
  >([]);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [currentProductId, setCurrentProductId] = useState<string>("");
  const [currentQuantity, setCurrentQuantity] = useState<number>(1);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showDesglose, setShowDesglose] = useState(false);
  const [desgloseProduct, setDesgloseProduct] = useState<
    (Product & { cantidad: number }) | null
  >(null);

  // Función para formatear números con separación de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Cargar productos disponibles y establecer sucursal activa
  useEffect(() => {
    loadProducts();
    loadUserCompany();
    loadMaterials();

    // Establecer la sucursal activa del store
    if (activeBranch) {
      setFormData((prev) => ({ ...prev, branch: activeBranch._id }));
    }
  }, [activeBranch]);

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
        estatus: true,
      });
      setAvailableProducts(response.data);
    } catch (err: any) {
      toast.error(err.message || "Error al cargar los productos");
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await materialsService.getAllMaterials({
        status: true,
        limit: 1000,
      });
      setMaterials(response.data);
    } catch (err: any) {
      console.error("Error al cargar materiales:", err);
    }
  };

  const loadUserCompany = async () => {
    try {
      // Usar el nuevo endpoint que soporta tanto Administrador como Gerente
      const response = await companiesService.getUserCompany();

      if (response.success && response.data) {
        setUserCompany(response.data);
        setFormData((prev) => ({ ...prev, company: response.data._id }));
      }
    } catch (err: any) {
      console.error("Error al cargar empresa del usuario:", err);
      // No mostrar error al usuario si es Super Admin u otro rol que no tiene empresa asignada
      if (!err.message?.includes("no tiene una empresa asignada")) {
        toast.error(err.message || "Error al cargar la empresa del usuario");
      }
    }
  };

  const loadProductList = async () => {
    try {
      setLoading(true);
      const response = await productListsService.getProductListById(
        productListId
      );
      const productList = response.data;

      setFormData({
        name: productList.name,
        products: productList.products.map((p) => ({
          productId: p.productId,
          cantidad: p.cantidad,
        })),
        company:
          typeof productList.company === "string"
            ? productList.company
            : productList.company._id,
        branch:
          typeof productList.branch === "string"
            ? productList.branch
            : productList.branch._id,
        expirationDate: productList.expirationDate.split("T")[0], // Format for input[type="date"]
      });

      // Set selected products for display
      setSelectedProducts(
        productList.products.map((embeddedProduct) => ({
          _id: embeddedProduct.productId,
          nombre: embeddedProduct.nombre,
          unidad: embeddedProduct.unidad,
          descripcion: embeddedProduct.descripcion,
          orden: embeddedProduct.orden,
          imagen: embeddedProduct.imagen,
          insumos: embeddedProduct.insumos,
          cantidad: embeddedProduct.cantidad,
          totalCosto: embeddedProduct.totalCosto,
          totalVenta: embeddedProduct.totalVenta,
          labour: embeddedProduct.labour,
          estatus: embeddedProduct.estatus,
          createdAt: "",
          updatedAt: "",
        }))
      );
    } catch (err: any) {
      toast.error(err.message || "Error al cargar la lista de productos");
      router.push("/catalogos/listas-productos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    if (!currentProductId) {
      toast.warning("Por favor selecciona un producto");
      return;
    }

    if (currentQuantity < 1) {
      toast.warning("La cantidad debe ser al menos 1");
      return;
    }

    const product = availableProducts.find((p) => p._id === currentProductId);
    if (!product) return;

    // Check if already added
    if (formData.products.some((p) => p.productId === currentProductId)) {
      toast.warning("Este producto ya está agregado");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productId: currentProductId, cantidad: currentQuantity },
      ],
    }));

    setSelectedProducts((prev) => [
      ...prev,
      { ...product, cantidad: currentQuantity },
    ]);

    // Reset
    setCurrentProductId("");
    setCurrentQuantity(1);
  };

  const handleRemoveProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.productId !== productId),
    }));

    setSelectedProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  const calculateLotes = (product: Product & { cantidad: number }) => {
    let totalLotes = 0;
    product.insumos.forEach((insumo) => {
      const material = materials.find((m) => m._id === insumo.materialId);
      if (material && material.piecesPerPackage > 0) {
        const lotes =
          (insumo.cantidad * product.cantidad) / material.piecesPerPackage;
        totalLotes += lotes;
      }
    });
    return totalLotes;
  };

  const handleShowDesglose = (product: Product & { cantidad: number }) => {
    setDesgloseProduct(product);
    setShowDesglose(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!activeBranch) {
        throw new Error(
          "No hay sucursal activa seleccionada. Por favor, selecciona una sucursal desde el selector de sucursales."
        );
      }

      if (
        !formData.name ||
        !formData.company ||
        !formData.branch ||
        !formData.expirationDate
      ) {
        throw new Error(
          "El nombre, empresa, sucursal y fecha de expiración son obligatorios"
        );
      }

      if (formData.products.length === 0) {
        throw new Error("Debes agregar al menos un producto a la lista");
      }

      if (isEditing) {
        await productListsService.updateProductList(productListId, formData);
        toast.success("Lista de productos actualizada exitosamente");
      } else {
        const response = await productListsService.createProductList(formData);
        if (response.data?.status === false) {
          toast.success(
            "Lista de productos creada exitosamente. Se creó como inactiva porque ya existe una lista activa para esta sucursal"
          );
        } else {
          toast.success("Lista de productos creada exitosamente y activada");
        }
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
      const cantidad = product.cantidad || 1;
      // totalCosto ya incluye labour
      totalGastado += product.totalCosto * cantidad;
      gananciasBrutas += product.totalVenta * cantidad;
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
      {!activeBranch && (
        <Alert variant="warning" className="mb-3">
          <strong>⚠️ Advertencia:</strong> No hay sucursal activa seleccionada.
          Por favor, selecciona una sucursal desde el selector de sucursales en
          la parte superior para poder crear una lista de productos.
        </Alert>
      )}

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
                      setFormData({
                        ...formData,
                        expirationDate: e.target.value,
                      })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Empresa <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      userCompany?.tradeName ||
                      userCompany?.legalName ||
                      "Cargando..."
                    }
                    disabled
                    readOnly
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    Empresa asignada a tu usuario
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Sucursal <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      activeBranch?.branchName || "No hay sucursal seleccionada"
                    }
                    disabled
                    readOnly
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    Sucursal activa actual. Puede haber múltiples listas por
                    sucursal, pero solo una estará activa
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
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Seleccionar Producto
                  </Form.Label>
                  <Form.Select
                    value={currentProductId}
                    onChange={(e) => setCurrentProductId(e.target.value)}
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

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Cantidad</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={currentQuantity}
                    onChange={(e) =>
                      setCurrentQuantity(parseInt(e.target.value) || 1)
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={2} className="d-flex align-items-end">
                <Button
                  variant="success"
                  onClick={handleAddProduct}
                  className="w-100 py-2"
                  disabled={!currentProductId}
                >
                  <Plus size={18} className="me-1" />
                  Agregar
                </Button>
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
                      <th className="text-center">Cantidad</th>
                      <th className="text-end">Total Costo</th>
                      <th className="text-end">Labour</th>
                      <th className="text-end">Total Venta</th>
                      <th className="text-center">Lotes</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.map((product) => {
                      const cantidad = product.cantidad || 1;
                      const lotes = calculateLotes(product);
                      return (
                        <tr key={product._id}>
                          <td>{product.nombre}</td>
                          <td>
                            <Badge bg="secondary">{product.unidad}</Badge>
                          </td>
                          <td className="text-center fw-bold">{cantidad}</td>
                          <td className="text-end text-danger">
                            ${formatNumber(product.totalCosto * cantidad)}
                          </td>
                          <td className="text-end text-warning">
                            ${formatNumber(product.labour * cantidad)}
                          </td>
                          <td className="text-end text-primary">
                            ${formatNumber(product.totalVenta * cantidad)}
                          </td>
                          <td className="text-center">
                            <Badge bg="info">{formatNumber(lotes)}</Badge>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleShowDesglose(product)}
                                title="Ver desglose"
                              >
                                <List size={14} />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveProduct(product._id)}
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="table-light fw-bold">
                    <tr>
                      <td colSpan={3} className="text-end">
                        Totales ({totals.totalProducts} productos):
                      </td>
                      <td className="text-end text-danger">
                        ${formatNumber(totals.totalGastado)}
                      </td>
                      <td></td>
                      <td className="text-end text-primary">
                        ${formatNumber(totals.gananciasBrutas)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr>
                      <td colSpan={7} className="text-end">
                        Ganancias Netas:
                      </td>
                      <td className="text-center">
                        <Badge
                          bg={totals.gananciasNetas >= 0 ? "success" : "danger"}
                          className="fs-6"
                        >
                          ${formatNumber(totals.gananciasNetas)}
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

      {/* Modal de Desglose */}
      <DesgloseModal
        show={showDesglose}
        onHide={() => setShowDesglose(false)}
        product={desgloseProduct}
        materials={materials}
      />
    </div>
  );
};

export default NewProductListPage;
