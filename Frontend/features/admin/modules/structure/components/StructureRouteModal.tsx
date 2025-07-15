import React, { useEffect, useState } from "react";
import { Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { routeService } from "../../routes/services/routeService";
import { RouteFormData } from "../../routes/types";
import {
  useUserSessionStore,
  UserSessionStore,
} from "@/stores/userSessionStore";

interface StructureRouteModalProps {
  show: boolean;
  onHide: () => void;
  onRouteSaved: () => void;
  categoryId: string;
  companyId: string;
  brandId: string;
  branchId: string;
}

const StructureRouteModal: React.FC<StructureRouteModalProps> = ({
  show,
  onHide,
  onRouteSaved,
  categoryId,
  companyId,
  brandId,
  branchId,
}) => {
  const user = useUserSessionStore((state: UserSessionStore) => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RouteFormData>({
    name: "",
    description: "",
    categoryId: categoryId,
    brandId: brandId,
    companyId: companyId,
    branchId: branchId,
    status: true,
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setFormData({
        name: "",
        description: "",
        categoryId: categoryId,
        brandId: brandId,
        companyId: companyId,
        branchId: branchId,
        status: true,
      });

      loadCategories();
      loadCompanies();
      loadBrands();
      loadBranches();
    }
  }, [show, categoryId, companyId, brandId, branchId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await routeService.getCategories(user?._id);
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
    if (!categoryId) return;

    try {
      setLoading(true);
      const response = await routeService.getCompaniesByCategory(
        categoryId,
        user?._id
      );
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
    if (!categoryId || !companyId) return;

    try {
      setLoading(true);
      const response = await routeService.getBrandsByCategoryAndCompany(
        categoryId,
        companyId,
        user?._id
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
    if (!companyId || !brandId) return;

    try {
      setLoading(true);
      const response = await routeService.getBranchesByCompanyAndBrand(
        companyId,
        brandId,
        user?._id
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

    if (!formData.name) {
      toast.error("El nombre es obligatorio");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await routeService.createRoute(formData);

      if (!response.success) {
        toast.error(response.message || "Error al guardar ruta");
        return;
      }

      toast.success("Ruta creada correctamente");
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
        <Modal.Title>Nueva Ruta</Modal.Title>
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
                <Form.Select value={formData.categoryId} disabled={true}>
                  <option value="">Selecciona una opción…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  La unidad de negocio se selecciona automáticamente desde la
                  estructura
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Razón Social *</Form.Label>
                <Form.Select value={formData.companyId} disabled={true}>
                  <option value="">Selecciona una opción…</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  La razón social se selecciona automáticamente desde la
                  estructura
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Marca *</Form.Label>
                <Form.Select value={formData.brandId} disabled={true}>
                  <option value="">Selecciona una opción…</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  La marca se selecciona automáticamente desde la estructura
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sucursal *</Form.Label>
                <Form.Select value={formData.branchId} disabled={true}>
                  <option value="">Selecciona una opción…</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  La sucursal se selecciona automáticamente desde la estructura
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Creando...
                </>
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

export default StructureRouteModal;
