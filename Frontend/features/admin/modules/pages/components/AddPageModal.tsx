import { Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { Alert, Button, Col, Form, Modal, Row, Table } from "react-bootstrap";
import { z } from "zod";
import { CreatePageFormData, createPageSchema, ModuleRow } from "../schemas";
import { CreateModuleData, modulesService } from "../services/modules";
import { CreatePageData, pagesService } from "../services/pages";

interface CreatePageModalProps {
  show: boolean;
  onHide: () => void;
  onPageCreated: () => void;
}

const CreatePageModal: React.FC<CreatePageModalProps> = ({
  show,
  onHide,
  onPageCreated,
}) => {
  const [formData, setFormData] = useState<CreatePageFormData>({
    name: "",
    path: "",
    description: "",
    modules: [],
  });

  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [currentModule, setCurrentModule] = useState({
    nombre: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    field: keyof CreatePageFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleAddModule = () => {
    if (currentModule.nombre.trim()) {
      const newModule: ModuleRow = {
        id: Date.now().toString(),
        nombre: currentModule.nombre.trim(),
        description: currentModule.description.trim(),
      };

      setModules((prev) => [...prev, newModule]);
      setCurrentModule({ nombre: "", description: "" });
    }
  };

  const handleRemoveModule = (id: string) => {
    setModules((prev) => prev.filter((module) => module.id !== id));
  };

  const validateForm = (): boolean => {
    try {
      createPageSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const pageData: CreatePageData = {
        name: formData.name,
        path: formData.path,
        description: formData.description || undefined,
      };

      const pageResponse = await pagesService.createPage(pageData);

      if (!pageResponse.success || !pageResponse.data) {
        throw new Error("Error al crear la página");
      }

      const createdPageId = pageResponse.data._id;

      if (modules.length > 0) {
        const moduleIds: string[] = [];

        for (const mod of modules) {
          const moduleData: CreateModuleData = {
            name: mod.nombre,
            description: mod.description,
            page: createdPageId,
          };

          const moduleResponse = await modulesService.createModule(moduleData);

          if (moduleResponse.success && moduleResponse.data) {
            moduleIds.push(moduleResponse.data._id);
          }
        }
      }

      setFormData({ name: "", path: "", description: "", modules: [] });
      setModules([]);
      setCurrentModule({ nombre: "", description: "" });
      setErrors({});

      onPageCreated();
      onHide();
    } catch (error) {
      console.error("Error creating page:", error);
      setErrors({
        general:
          error instanceof Error ? error.message : "Error al crear la página",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", path: "", description: "", modules: [] });
    setModules([]);
    setCurrentModule({ nombre: "", description: "" });
    setErrors({});
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton className="border-0 pb-2">
        <Modal.Title className="h4 fw-semibold mb-0">
          Crear nueva página
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4">
        {errors.general && (
          <Alert variant="danger" className="mb-3">
            {errors.general}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-medium mb-2 small">
                  Nombre de la página
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre de la página"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  isInvalid={!!errors.name}
                  className="shadow-none"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-medium mb-2 small">
                  Ruta de la página
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ruta de la página"
                  value={formData.path}
                  onChange={(e) => handleInputChange("path", e.target.value)}
                  isInvalid={!!errors.path}
                  className="shadow-none"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.path}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <Form.Group>
                <Form.Label className="fw-medium mb-2 small">
                  Descripción (opcional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Descripción de la página"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="shadow-none"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="mb-4">
            <h5 className="fw-semibold mb-3 pb-2 border-bottom">
              Módulos de la página
            </h5>

            <Row className="mb-3">
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="fw-medium mb-2 small">
                    Nombre del módulo
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nombre del módulo"
                    value={currentModule.nombre}
                    onChange={(e) =>
                      setCurrentModule((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                    className="shadow-none"
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label className="fw-medium mb-2 small">
                    Descripción del módulo
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Descripción del módulo"
                    value={currentModule.description}
                    onChange={(e) =>
                      setCurrentModule((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="shadow-none"
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button
                  variant="primary"
                  onClick={handleAddModule}
                  disabled={!currentModule.nombre.trim()}
                  className="fw-medium w-100"
                >
                  <Plus size={16} className="me-2" />
                  Agregar
                </Button>
              </Col>
            </Row>

            {modules.length > 0 && (
              <div className="border rounded overflow-hidden">
                <Table responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="fw-semibold small">Nombre del módulo</th>
                      <th className="fw-semibold small">
                        Descripción del módulo
                      </th>
                      <th className="fw-semibold small">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module) => (
                      <tr key={module.id}>
                        <td className="align-middle small">{module.nombre}</td>
                        <td className="align-middle small">
                          {module.description}
                        </td>
                        <td className="align-middle">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveModule(module.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button
          variant="secondary"
          onClick={handleClose}
          className="fw-medium px-4"
        >
          Cerrar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
          className="fw-medium px-4"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePageModal;
