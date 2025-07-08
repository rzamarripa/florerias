import { useUserSessionStore } from "@/stores/userSessionStore";
import React, { useEffect, useState } from "react";
import { Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { routeService } from "../services/routeService";
import { Route, RouteFormData } from "../types";

interface RouteModalProps {
  show: boolean;
  onHide: () => void;
  editingRoute?: Route | null;
  onRouteSaved: () => void;
}

const RouteModal: React.FC<RouteModalProps> = ({
  show,
  onHide,
  editingRoute,
  onRouteSaved,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RouteFormData>({
    name: "",
    description: "",
    categoryId: "",
    brandId: "",
    companyId: "",
    branchId: "",
    status: true,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const { user } = useUserSessionStore();

  const fetchVisibilitySelects = async () => {
    if (!user?._id) return;
    const response = await routeService.getUserVisibilitySelects(user._id);
    if (response.success && response.data) {
      setCategories(response.data.categories || []);
      setCompanies(response.data.companies || []);
      setBrands(response.data.brands || []);
      setBranches(response.data.branches || []);
    }
  };

  useEffect(() => {
    if (show && user?._id) {
      fetchVisibilitySelects();
    }
  }, [show, user]);

  useEffect(() => {
    if (editingRoute) {
      setFormData({
        name: editingRoute.name,
        description: editingRoute.description || "",
        categoryId: editingRoute.categoryId?._id || "",
        brandId: editingRoute.brandId._id,
        companyId: editingRoute.companyId._id,
        branchId: editingRoute.branchId._id,
        status: editingRoute.status,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        categoryId: "",
        brandId: "",
        companyId: "",
        branchId: "",
        status: true,
      });
    }
  }, [editingRoute, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.categoryId ||
      !formData.brandId ||
      !formData.companyId ||
      !formData.branchId
    ) {
      toast.error("Todos los campos obligatorios deben estar completos");
      return;
    }

    try {
      setIsSubmitting(true);
      let response;
      if (editingRoute) {
        response = await routeService.updateRoute(editingRoute._id, formData);
      } else {
        response = await routeService.createRoute(formData);
      }

      if (!response.success) {
        toast.error(response.message || "Error al guardar ruta");
        return;
      }

      toast.success(
        editingRoute
          ? "Ruta actualizada correctamente"
          : "Ruta creada correctamente"
      );
      onHide();
      onRouteSaved();
    } catch (error: any) {
      toast.error(
        "Error al guardar ruta: " + (error.message || "Error desconocido")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onHide();
  };

  // Filtrar razones sociales basadas en las categorías seleccionadas (si se requiere alguna lógica específica)
  const filteredCompanies = companies;
  
  // Filtrar marcas por razón social
  const filteredBrands = brands.filter(
    (b) => b.companyId === formData.companyId
  );
  
  // Filtrar sucursales por marca Y razón social
  const filteredBranches = branches.filter(
    (br) =>
      br.brandId === formData.brandId && br.companyId === formData.companyId
  );

  return (
    <Modal show={show} onHide={handleCancel} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{editingRoute ? "Editar Ruta" : "Nueva Ruta"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Unidad de Negocio *</Form.Label>
                <Form.Select
                  value={formData.categoryId}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      categoryId: e.target.value,
                      companyId: "",
                      brandId: "",
                      branchId: "",
                    });
                  }}
                  required
                >
                  <option value="">Selecciona una opción…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Razón Social *</Form.Label>
                <Form.Select
                  value={formData.companyId}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      companyId: e.target.value,
                      brandId: "",
                      branchId: "",
                    });
                  }}
                  required
                  disabled={!formData.categoryId}
                >
                  <option value="">Selecciona una opción…</option>
                  {filteredCompanies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Marca *</Form.Label>
                <Form.Select
                  value={formData.brandId}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      brandId: e.target.value,
                      branchId: "",
                    });
                  }}
                  required
                  disabled={!formData.companyId}
                >
                  <option value="">Selecciona una opción…</option>
                  {filteredBrands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sucursal *</Form.Label>
                <Form.Select
                  value={formData.branchId}
                  onChange={(e) => {
                    setFormData({ ...formData, branchId: e.target.value });
                  }}
                  required
                  disabled={!formData.brandId}
                >
                  <option value="">Selecciona una opción…</option>
                  {filteredBranches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex gap-2">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {editingRoute ? "Actualizando..." : "Creando..."}
                </>
              ) : editingRoute ? (
                "Actualizar"
              ) : (
                "Crear"
              )}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default RouteModal;
