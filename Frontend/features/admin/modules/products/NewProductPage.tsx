"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Table, Alert } from "react-bootstrap";
import {
  Package,
  Plus,
  Trash2,
  Upload,
  Save,
  ArrowLeft,
  Edit2,
  X,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { productsService } from "./services/products";
import { CreateProductData, Insumo, InsumoType, UnidadType } from "./types";
import { materialsService } from "../materials/services/materials";
import { Material } from "../materials/types";

const UNIDADES_OPTIONS: UnidadType[] = ["pieza", "paquete"];

const NewProductPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const isEditing = !!productId;

  const [formData, setFormData] = useState<CreateProductData>({
    nombre: "",
    unidad: "pieza",
    descripcion: "",
    orden: 0,
    imagen: "",
    insumos: [],
    labour: 0,
    estatus: true,
  });

  const [currentInsumo, setCurrentInsumo] = useState<Partial<Insumo>>({
    materialId: "",
    nombre: "",
    cantidad: 1,
    unidad: "pieza",
    importeCosto: 0,
    importeVenta: 0,
  });

  // Precios unitarios para el insumo actual
  const [unitCost, setUnitCost] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Precio de venta final editable
  const [precioVentaEditable, setPrecioVentaEditable] = useState<number>(0);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingInsumoIndex, setEditingInsumoIndex] = useState<number | null>(
    null
  );
  const [materials, setMaterials] = useState<Material[]>([]);
  const [labourType, setLabourType] = useState<"fixed" | "percentage">("fixed");
  const [labourPercentage, setLabourPercentage] = useState<number>(0);

  // Cargar materiales activos
  useEffect(() => {
    loadMaterials();
  }, []);

  // Cargar producto si estamos editando
  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
  }, [productId]);

  const loadMaterials = async () => {
    try {
      const response = await materialsService.getAllMaterials({
        status: true,
        limit: 1000,
      });
      setMaterials(response.data);

      // Si hay materiales, establecer el primero como valor por defecto
      if (response.data.length > 0) {
        const firstMaterial = response.data[0];
        setCurrentInsumo({
          materialId: firstMaterial._id,
          nombre: firstMaterial.name,
          cantidad: 1,
          unidad: firstMaterial.unit.abbreviation,
          importeCosto: firstMaterial.cost,
          importeVenta: firstMaterial.price,
        });
        setUnitCost(firstMaterial.cost);
        setUnitPrice(firstMaterial.price);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar los materiales");
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsService.getProductById(productId);
      const product = response.data;
      setFormData({
        nombre: product.nombre,
        unidad: product.unidad,
        descripcion: product.descripcion,
        orden: product.orden,
        imagen: product.imagen,
        insumos: product.insumos,
        labour: product.labour || 0,
        estatus: product.estatus,
      });

      // Cargar precio de venta final si existe
      if (product.precioVentaFinal) {
        setPrecioVentaEditable(product.precioVentaFinal);
      }

      // Establecer preview de imagen si existe
      if (product.imagen) {
        setImagePreview(product.imagen);
      }

      // Detectar si labour es porcentaje o fijo
      const totalVentaInsumos =
        product.insumos?.reduce(
          (sum, insumo) => sum + insumo.importeVenta,
          0
        ) || 0;
      if (totalVentaInsumos > 0 && product.labour > 0) {
        const calculatedPercentage = (product.labour / totalVentaInsumos) * 100;
        // Si el porcentaje es un número entero razonable (ej: 10%, 15%, 20%), asumimos que fue ingresado como porcentaje
        if (calculatedPercentage % 1 === 0 && calculatedPercentage <= 100) {
          setLabourType("percentage");
          setLabourPercentage(calculatedPercentage);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar el producto");
      router.push("/catalogos/productos");
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear números con separación de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calcular totales
  const calculateTotals = () => {
    const totalCosto =
      formData.insumos?.reduce((sum, insumo) => sum + insumo.importeCosto, 0) ||
      0;
    const totalVenta =
      formData.insumos?.reduce((sum, insumo) => sum + insumo.importeVenta, 0) ||
      0;
    const precioVentaCalculado = totalVenta + formData.labour;
    const precioVentaFinal =
      precioVentaEditable > 0 ? precioVentaEditable : precioVentaCalculado;
    return { totalCosto, totalVenta, precioVentaFinal, precioVentaCalculado };
  };

  // Cargar insumo para editar
  const handleEditInsumo = (index: number) => {
    const insumo = formData.insumos?.[index];
    if (insumo) {
      setCurrentInsumo({ ...insumo });
      // Calcular precios unitarios basados en los importes y cantidad
      const cantidad = insumo.cantidad || 1;
      setUnitCost(insumo.importeCosto / cantidad);
      setUnitPrice(insumo.importeVenta / cantidad);
      setEditingInsumoIndex(index);
    }
  };

  // Cancelar edición de insumo
  const handleCancelEditInsumo = () => {
    if (materials.length > 0) {
      const firstMaterial = materials[0];
      setCurrentInsumo({
        materialId: firstMaterial._id,
        nombre: firstMaterial.name,
        cantidad: 1,
        unidad: firstMaterial.unit.abbreviation,
        importeCosto: firstMaterial.cost,
        importeVenta: firstMaterial.price,
      });
      setUnitCost(firstMaterial.cost);
      setUnitPrice(firstMaterial.price);
    }
    setEditingInsumoIndex(null);
    setError(null);
  };

  // Agregar o actualizar insumo
  const handleAddInsumo = () => {
    if (
      !currentInsumo.materialId ||
      !currentInsumo.nombre ||
      (currentInsumo.cantidad || 0) <= 0
    ) {
      setError("Por favor completa todos los campos del insumo");
      return;
    }

    // Calcular importes basados en cantidad y precios unitarios
    const cantidad = currentInsumo.cantidad || 0;
    const importeCosto = cantidad * unitCost;
    const importeVenta = cantidad * unitPrice;

    const insumoToAdd = {
      ...currentInsumo,
      importeCosto,
      importeVenta,
    };

    if (editingInsumoIndex !== null) {
      // Actualizar insumo existente
      const newInsumos = [...(formData.insumos || [])];
      newInsumos[editingInsumoIndex] = insumoToAdd as Insumo;
      setFormData({ ...formData, insumos: newInsumos });
      setEditingInsumoIndex(null);
    } else {
      // Agregar nuevo insumo
      const newInsumos = [...(formData.insumos || []), insumoToAdd as Insumo];
      setFormData({ ...formData, insumos: newInsumos });
    }

    // Reset current insumo
    if (materials.length > 0) {
      const firstMaterial = materials[0];
      setCurrentInsumo({
        materialId: firstMaterial._id,
        nombre: firstMaterial.name,
        cantidad: 1,
        unidad: firstMaterial.unit.abbreviation,
        importeCosto: firstMaterial.cost,
        importeVenta: firstMaterial.price,
      });
      setUnitCost(firstMaterial.cost);
      setUnitPrice(firstMaterial.price);
    }
    setError(null);
  };

  // Eliminar insumo
  const handleRemoveInsumo = (index: number) => {
    const newInsumos = formData.insumos?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, insumos: newInsumos });

    // Si estamos eliminando el insumo que se está editando, cancelar edición
    if (editingInsumoIndex === index) {
      handleCancelEditInsumo();
    } else if (editingInsumoIndex !== null && editingInsumoIndex > index) {
      // Si el índice de edición es mayor, ajustarlo
      setEditingInsumoIndex(editingInsumoIndex - 1);
    }
  };

  // Manejar cambio de archivo de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Archivo seleccionado:", file.name, file.size);
      setImageFile(file);

      // Convertir a base64 y crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        console.log("Base64 generado, longitud:", base64String.length);
        setImagePreview(base64String);
        setFormData((prev) => {
          const updated = { ...prev, imagen: base64String };
          console.log(
            "FormData actualizado, imagen length:",
            updated.imagen?.length
          );
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Eliminar imagen
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData((prev) => ({ ...prev, imagen: "" }));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.nombre || !formData.unidad) {
        throw new Error("El nombre y la unidad son obligatorios");
      }

      // Los datos del producto con la imagen en base64
      const productData: CreateProductData = {
        ...formData,
        imagen: formData.imagen || "",
        precioVentaFinal: precioVentaEditable,
      };

      console.log("Datos a enviar:", productData);
      console.log("Imagen URL length:", formData.imagen?.length || 0);

      if (isEditing) {
        await productsService.updateProduct(productId, productData);
        toast.success("Producto actualizado exitosamente");
      } else {
        await productsService.createProduct(productData);
        toast.success("Producto creado exitosamente");
      }

      router.push("/catalogos/productos");
    } catch (err: any) {
      setError(err.message || "Error al guardar el producto");
      toast.error(err.message || "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  const { totalCosto, totalVenta, precioVentaFinal, precioVentaCalculado } =
    calculateTotals();

  // Actualizar precio editable cuando cambien los cálculos
  useEffect(() => {
    if (precioVentaEditable === 0) {
      setPrecioVentaEditable(precioVentaCalculado);
    }
  }, [precioVentaCalculado, precioVentaEditable]);

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
    <div className="new-product-page">
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
              <h5 className="mb-0 fw-bold">Información del Producto</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Nombre <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre del producto"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Unidad <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.unidad}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unidad: e.target.value as UnidadType,
                      })
                    }
                    required
                    className="py-2"
                  >
                    {UNIDADES_OPTIONS.map((unidad) => (
                      <option key={unidad} value={unidad}>
                        {unidad.charAt(0).toUpperCase() + unidad.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Orden</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.orden}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        orden: parseInt(e.target.value) || 0,
                      })
                    }
                    className="py-2"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Descripción del producto"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Precio de Venta Final */}
        <Card className="mb-4">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">
              <Package className="me-2" />
              Precio de Venta Final
            </h5>
          </Card.Header>
          <Card.Body>
            <Row className="align-items-center">
              <Col md={6}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Total Insumos:</span>
                  <span className="fs-5 text-primary">
                    ${formatNumber(totalVenta)}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Mano de Obra:</span>
                  <span className="fs-5 text-warning">
                    ${formatNumber(formData.labour)}
                  </span>
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold fs-4">Precio de Venta Final:</span>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={precioVentaEditable}
                      onChange={(e) =>
                        setPrecioVentaEditable(parseFloat(e.target.value) || 0)
                      }
                      className="fs-3 fw-bold text-success border-success"
                      style={{ width: "150px", textAlign: "right" }}
                    />
                    <span className="fs-3 fw-bold text-success">$</span>
                    {precioVentaEditable !== precioVentaCalculado && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() =>
                          setPrecioVentaEditable(precioVentaCalculado)
                        }
                        title="Resetear al precio calculado"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="text-center">
                  <div className="p-4 bg-light rounded">
                    <h6 className="text-muted mb-2">Desglose del Precio</h6>
                    <div className="fs-6">
                      <div className="mb-1">
                        <span className="text-primary">Insumos:</span> $
                        {formatNumber(totalVenta)}
                      </div>
                      <div className="mb-1">
                        <span className="text-warning">Mano de Obra:</span> $
                        {formatNumber(formData.labour)}
                      </div>
                      <hr className="my-2" />
                      <div className="fw-bold text-success">
                        <span>Total:</span> ${formatNumber(precioVentaFinal)}
                      </div>
                      {precioVentaEditable !== precioVentaCalculado && (
                        <div className="mt-2 p-2 bg-warning bg-opacity-25 rounded">
                          <small className="text-warning">
                            <strong>Ajuste:</strong> +$
                            {formatNumber(
                              precioVentaEditable - precioVentaCalculado
                            )}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Imagen */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <Upload size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Imagen del Producto</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Subir Imagen</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    Selecciona una imagen para el producto (JPG, PNG, etc.)
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                {imagePreview && (
                  <div>
                    <Form.Label className="fw-semibold d-block mb-2">
                      Vista previa
                    </Form.Label>
                    <div className="position-relative d-inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="rounded border border-2 shadow-sm"
                        height="110"
                        width="110"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 start-100 translate-middle"
                        onClick={handleRemoveImage}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Insumos */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <Package size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Insumos</h5>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Mensaje informativo cuando se está editando */}
            {editingInsumoIndex !== null && (
              <Alert
                variant="info"
                className="mb-3 d-flex align-items-center gap-2"
              >
                <Edit2 size={16} />
                <span>
                  Editando insumo #{editingInsumoIndex + 1}. Modifica los campos
                  y guarda los cambios.
                </span>
              </Alert>
            )}

            {/* Formulario para agregar insumos */}
            <Row className="g-3 mb-3">
              <Col md={editingInsumoIndex !== null ? 2 : 3}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">
                    Material
                  </Form.Label>
                  <Form.Select
                    value={currentInsumo.materialId}
                    onChange={(e) => {
                      const selectedMaterial = materials.find(
                        (m) => m._id === e.target.value
                      );
                      if (selectedMaterial) {
                        setCurrentInsumo({
                          ...currentInsumo,
                          materialId: selectedMaterial._id,
                          nombre: selectedMaterial.name,
                          unidad: selectedMaterial.unit.abbreviation,
                          importeCosto: selectedMaterial.cost,
                          importeVenta: selectedMaterial.price,
                        });
                        setUnitCost(selectedMaterial.cost);
                        setUnitPrice(selectedMaterial.price);
                      }
                    }}
                    size="sm"
                  >
                    {materials.length === 0 ? (
                      <option value="">No hay materiales disponibles</option>
                    ) : (
                      materials.map((material) => (
                        <option key={material._id} value={material._id}>
                          {material.name}
                        </option>
                      ))
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">
                    Cantidad
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentInsumo.cantidad}
                    onChange={(e) =>
                      setCurrentInsumo({
                        ...currentInsumo,
                        cantidad: parseFloat(e.target.value) || 0,
                      })
                    }
                    size="sm"
                  />
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Unidad</Form.Label>
                  <Form.Select
                    value={currentInsumo.unidad}
                    onChange={(e) =>
                      setCurrentInsumo({
                        ...currentInsumo,
                        unidad: e.target.value,
                      })
                    }
                    size="sm"
                  >
                    {UNIDADES_OPTIONS.map((unidad) => (
                      <option key={unidad} value={unidad}>
                        {unidad}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">
                    Costo Unit.
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={unitCost}
                    onChange={(e) =>
                      setUnitCost(parseFloat(e.target.value) || 0)
                    }
                    size="sm"
                  />
                </Form.Group>
              </Col>

              <Col md={2}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">
                    Precio Unit.
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={unitPrice}
                    onChange={(e) =>
                      setUnitPrice(parseFloat(e.target.value) || 0)
                    }
                    size="sm"
                  />
                </Form.Group>
              </Col>

              <Col
                md={editingInsumoIndex !== null ? 2 : 1}
                className="d-flex align-items-end gap-1"
              >
                {editingInsumoIndex !== null && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleCancelEditInsumo}
                    className="w-100"
                    title="Cancelar"
                  >
                    <X size={18} />
                  </Button>
                )}
                <Button
                  variant={editingInsumoIndex !== null ? "primary" : "success"}
                  size="sm"
                  onClick={handleAddInsumo}
                  className="w-100"
                  title={editingInsumoIndex !== null ? "Actualizar" : "Agregar"}
                >
                  {editingInsumoIndex !== null ? (
                    <Save size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                </Button>
              </Col>
            </Row>

            {/* Tabla de insumos */}
            {formData.insumos && formData.insumos.length > 0 && (
              <div className="table-responsive">
                <Table className="table table-hover table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>No.</th>
                      <th>Insumo</th>
                      <th>Cantidad</th>
                      <th>Unidad</th>
                      <th>Importe costo</th>
                      <th>Importe venta</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.insumos.map((insumo, index) => {
                      return (
                        <tr
                          key={index}
                          className={
                            editingInsumoIndex === index ? "table-info" : ""
                          }
                        >
                          <td>{index + 1}</td>
                          <td>{insumo.nombre}</td>
                          <td>{insumo.cantidad}</td>
                          <td>{insumo.unidad}</td>
                          <td className="text-success">
                            ${formatNumber(insumo.importeCosto)}
                          </td>
                          <td className="text-primary">
                            ${formatNumber(insumo.importeVenta)}
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditInsumo(index)}
                                disabled={editingInsumoIndex !== null}
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveInsumo(index)}
                                disabled={editingInsumoIndex !== null}
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
                      <td colSpan={4} className="text-end">
                        Totales:
                      </td>
                      <td className="text-success">
                        ${formatNumber(totalCosto)}
                      </td>
                      <td className="text-primary">
                        ${formatNumber(totalVenta)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Mano de Obra */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <Package size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Mano de Obra</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Tipo de Cálculo
                  </Form.Label>
                  <Form.Select
                    value={labourType}
                    onChange={(e) => {
                      const newType = e.target.value as "fixed" | "percentage";
                      setLabourType(newType);
                      // Si cambia a fijo, mantener el valor actual de labour
                      // Si cambia a porcentaje, calcular el porcentaje basado en labour actual
                      if (
                        newType === "percentage" &&
                        totalVenta > 0 &&
                        formData.labour > 0
                      ) {
                        const percentage = (formData.labour / totalVenta) * 100;
                        setLabourPercentage(parseFloat(percentage.toFixed(2)));
                      }
                    }}
                    className="py-2"
                  >
                    <option value="fixed">Monto Fijo</option>
                    <option value="percentage">Porcentaje</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {labourType === "fixed" ? (
                <Col md={8}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      Costo de Mano de Obra
                    </Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.labour}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          labour: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="py-2"
                    />
                    <Form.Text className="text-muted">
                      Ingresa el monto fijo de mano de obra
                    </Form.Text>
                  </Form.Group>
                </Col>
              ) : (
                <Col md={8}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">
                      Porcentaje de Mano de Obra
                    </Form.Label>
                    <div className="d-flex gap-2 align-items-center">
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0"
                        value={labourPercentage}
                        onChange={(e) => {
                          const percentage = parseFloat(e.target.value) || 0;
                          setLabourPercentage(percentage);
                          // Calcular labour basado en el porcentaje del total de venta
                          const calculatedLabour =
                            (totalVenta * percentage) / 100;
                          setFormData({
                            ...formData,
                            labour: parseFloat(calculatedLabour.toFixed(2)),
                          });
                        }}
                        className="py-2"
                      />
                      <span className="fw-bold">%</span>
                    </div>
                    {labourPercentage > 0 ? (
                      <div className="mt-2 p-2 bg-light rounded">
                        <span className="fs-5 fw-bold text-primary">
                          {labourPercentage}% de ${formatNumber(totalVenta)} = $
                          {formatNumber(formData.labour)}
                        </span>
                      </div>
                    ) : (
                      <Form.Text className="text-muted">
                        Ingresa el porcentaje sobre el total de venta de insumos
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              )}
            </Row>
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

export default NewProductPage;
