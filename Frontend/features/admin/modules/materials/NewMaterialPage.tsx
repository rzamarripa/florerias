"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import { Save, ArrowLeft, Package2, DollarSign } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { materialsService } from "./services/materials";
import { unitsService } from "../units/services/units";
import { CreateMaterialData } from "./types";
import { Unit } from "../units/types";

const NewMaterialPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const materialId = params?.id as string;
  const isEditing = !!materialId;

  const [formData, setFormData] = useState<CreateMaterialData>({
    name: "",
    unit: "",
    price: 0,
    cost: 0,
    piecesPerPackage: 1,
    description: "",
    status: true,
  });

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar unidades
  useEffect(() => {
    loadUnits();
  }, []);

  // Cargar material si estamos editando
  useEffect(() => {
    if (isEditing) {
      loadMaterial();
    }
  }, [materialId]);

  const loadUnits = async () => {
    try {
      setLoadingUnits(true);
      const response = await unitsService.getAllUnits({ status: true, limit: 1000 });
      setUnits(response.data);
    } catch (err: any) {
      toast.error("Error al cargar las unidades");
      console.error("Error loading units:", err);
    } finally {
      setLoadingUnits(false);
    }
  };

  const loadMaterial = async () => {
    try {
      setLoading(true);
      const response = await materialsService.getMaterialById(materialId);
      const material = response.data;
      setFormData({
        name: material.name,
        unit: material.unit._id,
        price: material.price,
        cost: material.cost,
        piecesPerPackage: material.piecesPerPackage,
        description: material.description,
        status: material.status,
      });
    } catch (err: any) {
      toast.error("Error al cargar el material");
      console.error("Error loading material:", err);
      router.push("/catalogos/materiales");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.name.trim()) {
      setError("El nombre es requerido");
      return;
    }

    if (!formData.unit) {
      setError("La unidad es requerida");
      return;
    }

    if (formData.price < 0) {
      setError("El precio no puede ser negativo");
      return;
    }

    if (formData.cost < 0) {
      setError("El costo no puede ser negativo");
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        await materialsService.updateMaterial(materialId, formData);
        toast.success("Material actualizado exitosamente");
      } else {
        await materialsService.createMaterial(formData);
        toast.success("Material creado exitosamente");
      }

      router.push("/catalogos/materiales");
    } catch (err: any) {
      setError(err.message || "Error al guardar el material");
      toast.error(err.message || "Error al guardar el material");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/catalogos/materiales");
  };

  // Función para formatear números con separación de miles
  const formatNumber = (num: number): string => {
    return num.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calcular ganancia y margen
  const ganancia = formData.price - formData.cost;
  const margen = formData.price > 0 ? (ganancia / formData.price) * 100 : 0;

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
    <div className="new-material-page">
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Información General */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <Package2 size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Información del Material</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Nombre del Material <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Rosas Rojas, Papel Kraft, etc."
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
                    Unidad <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    required
                    disabled={loadingUnits}
                    className="py-2"
                  >
                    <option value="">Seleccionar unidad...</option>
                    {units.map((unit) => (
                      <option key={unit._id} value={unit._id}>
                        {unit.name} ({unit.abbreviation})
                      </option>
                    ))}
                  </Form.Select>
                  {units.length === 0 && !loadingUnits && (
                    <Form.Text className="text-danger">
                      No hay unidades disponibles. Por favor, crea una primero.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Piezas por Paquete <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={formData.piecesPerPackage}
                    onChange={(e) =>
                      setFormData({ ...formData, piecesPerPackage: parseInt(e.target.value) || 1 })
                    }
                    required
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    Cantidad de piezas que vienen por paquete
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Estado</Form.Label>
                  <div className="pt-2">
                    <Form.Check
                      type="switch"
                      id="status-switch"
                      label={formData.status ? "Activo" : "Inactivo"}
                      checked={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.checked })
                      }
                      className="fs-5"
                    />
                  </div>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Descripción opcional del material..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Precios */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <div className="d-flex align-items-center gap-2">
              <DollarSign size={20} className="text-primary" />
              <h5 className="mb-0 fw-bold">Precios</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Costo <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    Costo de adquisición del material
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    Precio de Venta <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    Precio de venta al público
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Resumen Financiero */}
        {formData.price > 0 && formData.cost > 0 && (
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-success text-white py-3">
              <h5 className="mb-0">
                <DollarSign className="me-2" size={20} />
                Resumen Financiero
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="align-items-center">
                <Col md={6}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold">Precio de Venta:</span>
                    <span className="fs-5 text-primary">
                      ${formatNumber(formData.price)}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold">Costo:</span>
                    <span className="fs-5 text-danger">
                      ${formatNumber(formData.cost)}
                    </span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold fs-4">Ganancia:</span>
                    <span className="fs-3 fw-bold text-success">
                      ${formatNumber(ganancia)}
                    </span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center">
                    <div className="p-4 bg-light rounded">
                      <h6 className="text-muted mb-2">Margen de Ganancia</h6>
                      <div className="fs-1 fw-bold text-success mb-2">
                        {margen.toFixed(1)}%
                      </div>
                      <small className="text-muted">
                        Por cada ${formatNumber(formData.price)} vendido, ganas ${formatNumber(ganancia)}
                      </small>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Botones */}
        <div className="d-flex justify-content-between gap-2 mb-4">
          <Button
            type="button"
            variant="outline-secondary"
            size="lg"
            onClick={handleBack}
            disabled={loading}
            className="d-flex align-items-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading || loadingUnits}
            className="d-flex align-items-center gap-2 px-5"
          >
            <Save size={18} />
            {loading ? "Guardando..." : isEditing ? "Actualizar Material" : "Crear Material"}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default NewMaterialPage;
