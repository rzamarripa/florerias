"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Button, Row, Col, Alert } from "react-bootstrap";
import { Save, ArrowLeft, Package2 } from "lucide-react";
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
        description: material.description,
        status: material.status,
      });
    } catch (err: any) {
      toast.error("Error al cargar el material");
      console.error("Error loading material:", err);
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

    if (formData.price <= 0) {
      setError("El precio debe ser mayor a 0");
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

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button
          variant="light"
          onClick={handleBack}
          className="border-0"
          style={{ borderRadius: "10px" }}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="mb-1 fw-bold">
            {isEditing ? "Editar Material" : "Nuevo Material"}
          </h2>
          <p className="text-muted mb-0">
            {isEditing ? "Actualiza la información del material" : "Completa los datos del nuevo material"}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            {/* Información General */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
              <Card.Header className="bg-white border-0 py-3">
                <div className="d-flex align-items-center gap-2">
                  <Package2 size={20} className="text-primary" />
                  <h5 className="mb-0 fw-bold">Información General</h5>
                </div>
              </Card.Header>
              <Card.Body className="p-4">
                <Row className="g-4">
                  <Col md={12}>
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
                        className="border-0 bg-light"
                        style={{ borderRadius: "10px", padding: "12px 16px" }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
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
                        className="border-0 bg-light"
                        style={{ borderRadius: "10px", padding: "12px 16px" }}
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

                  <Col md={4}>
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
                        className="border-0 bg-light"
                        style={{ borderRadius: "10px", padding: "12px 16px" }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
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
                        className="border-0 bg-light"
                        style={{ borderRadius: "10px", padding: "12px 16px" }}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Descripción</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Descripción opcional del material..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        className="border-0 bg-light"
                        style={{ borderRadius: "10px", padding: "12px 16px" }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Estado */}
            <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">Estado</h5>
              </Card.Header>
              <Card.Body className="p-4">
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
              </Card.Body>
            </Card>

            {/* Información de Ganancia */}
            {formData.price > 0 && formData.cost > 0 && (
              <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: "15px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                <Card.Body className="p-4 text-white">
                  <h6 className="fw-bold mb-3">Ganancia Estimada</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Precio:</span>
                    <span className="fw-bold">${formData.price.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Costo:</span>
                    <span className="fw-bold">${formData.cost.toFixed(2)}</span>
                  </div>
                  <hr className="bg-white opacity-25" />
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold">Ganancia:</span>
                    <span className="fw-bold fs-5">${(formData.price - formData.cost).toFixed(2)}</span>
                  </div>
                  <small className="d-block mt-2 opacity-75">
                    Margen: {formData.price > 0 ? (((formData.price - formData.cost) / formData.price) * 100).toFixed(1) : 0}%
                  </small>
                </Card.Body>
              </Card>
            )}

            {/* Botones de Acción */}
            <div className="d-grid gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || loadingUnits}
                className="d-flex align-items-center justify-content-center gap-2 py-3"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "600",
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                }}
              >
                <Save size={20} />
                {loading ? "Guardando..." : isEditing ? "Actualizar Material" : "Crear Material"}
              </Button>
              <Button
                variant="light"
                onClick={handleBack}
                disabled={loading}
                className="py-3"
                style={{ borderRadius: "10px" }}
              >
                Cancelar
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default NewMaterialPage;
