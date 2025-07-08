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
  const [loading, setLoading] = useState(false);

  // Cargar categorías al abrir el modal
  useEffect(() => {
    if (show) {
      loadCategories();
    }
  }, [show]);

  // Cargar datos en cascada
  useEffect(() => {
    if (formData.categoryId) {
      loadCompanies();
      resetSelections(["company", "brand", "branch"]);
    }
  }, [formData.categoryId]);

  useEffect(() => {
    if (formData.categoryId && formData.companyId) {
      loadBrands();
      resetSelections(["brand", "branch"]);
    }
  }, [formData.categoryId, formData.companyId]);

  useEffect(() => {
    if (formData.companyId && formData.brandId) {
      loadBranches();
      resetSelections(["branch"]);
    }
  }, [formData.companyId, formData.brandId]);

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

  const resetSelections = (selections: string[]) => {
    const newFormData = { ...formData };
    
    if (selections.includes("company")) {
      newFormData.companyId = "";
      setCompanies([]);
    }
    if (selections.includes("brand")) {
      newFormData.brandId = "";
      setBrands([]);
    }
    if (selections.includes("branch")) {
      newFormData.branchId = "";
      setBranches([]);
    }
    
    setFormData(newFormData);
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await routeService.getCategories();
      if (response.success) {
        setCategories(response.data || []);
      } else {
        toast.error(response.message || "Error al cargar unidades de negocio");
      }
    } catch {
      toast.error("Error al cargar unidades de negocio");
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    if (!formData.categoryId) return;

    try {
      setLoading(true);
      const response = await routeService.getCompaniesByCategory(formData.categoryId);
      if (response.success) {
        setCompanies(response.data || []);
      } else {
        toast.error(response.message || "Error al cargar razones sociales");
      }
    } catch {
      toast.error("Error al cargar razones sociales");
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    if (!formData.categoryId || !formData.companyId) return;

    try {
      setLoading(true);
      const response = await routeService.getBrandsByCategoryAndCompany(
        formData.categoryId,
        formData.companyId
      );
      if (response.success) {
        setBrands(response.data || []);
      } else {
        toast.error(response.message || "Error al cargar marcas");
      }
    } catch {
      toast.error("Error al cargar marcas");
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    if (!formData.companyId || !formData.brandId) return;

    try {
      setLoading(true);
      const response = await routeService.getBranchesByCompanyAndBrand(
        formData.companyId,
        formData.brandId
      );
      if (response.success) {
        setBranches(response.data || []);
      } else {
        toast.error(response.message || "Error al cargar sucursales");
      }
    } catch {
      toast.error("Error al cargar sucursales");
    } finally {
      setLoading(false);
    }
  };

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
                    });
                  }}
                  required
                  disabled={loading}
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
                    });
                  }}
                  required
                  disabled={loading || !formData.categoryId}
                >
                  <option value="">Selecciona una opción…</option>
                  {companies.map((c) => (
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
                    });
                  }}
                  required
                  disabled={loading || !formData.companyId}
                >
                  <option value="">Selecciona una opción…</option>
                  {brands.map((b) => (
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
                  disabled={loading || !formData.brandId}
                >
                  <option value="">Selecciona una opción…</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex gap-2">
            <Button type="submit" variant="primary" disabled={isSubmitting || loading}>
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
