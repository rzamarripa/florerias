import { Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { z } from "zod";
import { CreateModuleData, Module, modulesService } from "../services/modules";
import { pagesService, UpdatePageData } from "../services/pages";
import styles from './pages.module.css'

const updatePageSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  path: z.string().min(1, "La ruta es requerida"),
  description: z.string().optional(),
});

interface UpdatePageFormData {
  name: string;
  path: string;
  description: string;
}

interface ModuleRow {
  id: string;
  nombre: string;
  description: string;
  isExisting?: boolean;
}

interface EditPageModalProps {
  show: boolean;
  onHide: () => void;
  onPageUpdated: () => void;
  pageId: string | null;
}

const EditPageModal: React.FC<EditPageModalProps> = ({
  show,
  onHide,
  onPageUpdated,
  pageId,
}) => {
  const [formData, setFormData] = useState<UpdatePageFormData>({
    name: "",
    path: "",
    description: "",
  });

  const [existingModules, setExistingModules] = useState<ModuleRow[]>([]);
  const [newModules, setNewModules] = useState<ModuleRow[]>([]);
  const [currentModule, setCurrentModule] = useState({
    nombre: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [deletingModules, setDeletingModules] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (show && pageId) {
      loadPageData();
    } else if (!show) {
      setFormData({ name: "", path: "", description: "" });
      setExistingModules([]);
      setNewModules([]);
      setCurrentModule({ nombre: "", description: "" });
      setErrors({});
      setDeletingModules(new Set());
    }
  }, [show, pageId]);

  const loadPageData = async () => {
    if (!pageId) {
      console.error("ERROR: No pageId provided to loadPageData");
      toast.error("Error: ID de página faltante");
      return;
    }

    try {
      setLoadingPage(true);
      const pageResponse = await pagesService.getPageById(pageId);

      if (pageResponse.success && pageResponse.data) {
        const page = pageResponse.data;
        console.log("✅ Datos de página cargados correctamente:", page);

        setFormData({
          name: page.name,
          path: page.path,
          description: page.description || "",
        });
      } else {
        throw new Error("No se pudieron cargar los datos de la página");
      }

      const modulesResponse = await modulesService.getModulesByPage(pageId, {
        limit: 100,
      });

      if (modulesResponse.success && modulesResponse.data) {
        const modules = modulesResponse.data
          .filter((module: Module) => {
            const isValid =
              module &&
              module._id &&
              typeof module._id === "string" &&
              module._id.trim() !== "";
            if (!isValid) {
              console.warn("❌ Módulo descartado por ID inválido:", module);
            }
            return isValid;
          })
          .map((module: Module) => {
            return {
              id: module._id,
              nombre: module.name || "Sin nombre",
              description: module.description || "",
              isExisting: true,
            };
          });

        setExistingModules(modules);
      } else {
        console.log("No se encontraron módulos o error en la respuesta");
        setExistingModules([]);
      }
    } catch (error) {
      console.error("❌ ERROR cargando datos de página:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setErrors({
        general: `Error al cargar los datos de la página: ${errorMessage}`,
      });
      toast.error(`Error al cargar los datos de la página: ${errorMessage}`);
    } finally {
      setLoadingPage(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdatePageFormData,
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
        id: `new_${Date.now()}`,
        nombre: currentModule.nombre.trim(),
        description: currentModule.description.trim(),
        isExisting: false,
      };

      setNewModules((prev) => [...prev, newModule]);
      setCurrentModule({ nombre: "", description: "" });

      if (errors.general) {
        setErrors((prev) => ({ ...prev, general: "" }));
      }

      // Toast de confirmación
      toast.success(`Módulo "${newModule.nombre}" agregado a la lista`);
    }
  };

  const handleRemoveNewModule = (id: string) => {
    const moduleToRemove = newModules.find(m => m.id === id);
    setNewModules((prev) => prev.filter((module) => module.id !== id));

    if (moduleToRemove) {
      toast.success(`Módulo "${moduleToRemove.nombre}" eliminado de la lista`);
    }
  };

  const handleRemoveExistingModule = async (moduleId: string) => {
    if (!pageId) {
      const errorMsg = "Error: ID de página faltante";
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
      return;
    }

    if (!moduleId) {
      const errorMsg = "Error: ID de módulo faltante";
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
      return;
    }

    if (typeof pageId !== "string" || pageId.trim() === "") {
      const errorMsg = "Error: ID de página inválido";
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
      return;
    }

    if (typeof moduleId !== "string" || moduleId.trim() === "") {
      const errorMsg = "Error: ID de módulo inválido";
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
      return;
    }

    const moduleToDelete = existingModules.find(m => m.id === moduleId);
    const moduleName = moduleToDelete?.nombre || "el módulo";

    try {
      console.log('id del modulo: ', moduleId)
      setDeletingModules((prev) => new Set(prev).add(moduleId));

      const response = await pagesService.removeModuleFromPage(
        pageId,
        moduleId
      );
      console.log(response)
      if (response.success) {
        setExistingModules((prev) =>
          prev.filter((module) => module.id !== moduleId)
        );
        console.log('se elimino')

        if (errors.general) {
          setErrors((prev) => ({ ...prev, general: "" }));
        }

        // Toast de éxito
        toast.success(`Módulo "${moduleName}" eliminado correctamente`);
      } else {
        throw new Error(
          response.message || "Error al eliminar el módulo de la base de datos"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar el módulo";

      setErrors({ general: `Error al eliminar el módulo: ${errorMessage}` });
      toast.error(`Error al eliminar el módulo "${moduleName}": ${errorMessage}`);
    } finally {
      setDeletingModules((prev) => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      updatePageSchema.parse(formData);
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

    if (!validateForm() || !pageId) {
      if (!pageId) {
        toast.error("Error: ID de página faltante");
      } else {
        toast.error("Por favor corrige los errores en el formulario");
      }
      return;
    }

    try {
      setLoading(true);

      const pageData: UpdatePageData = {
        name: formData.name,
        path: formData.path,
        description: formData.description || undefined,
      };

      const pageResponse = await pagesService.updatePage(pageId, pageData);

      if (!pageResponse.success) {
        throw new Error(pageResponse.message || "Error al actualizar la página");
      }

      // Toast de éxito para la página actualizada
      toast.success(`Página "${formData.name}" actualizada correctamente`);

      // Crear nuevos módulos si existen
      if (newModules.length > 0) {
        let modulesCreated = 0;
        let modulesFailed = 0;

        for (const mod of newModules) {
          try {
            const moduleData: CreateModuleData = {
              name: mod.nombre,
              description: mod.description,
              page: pageId,
            };

            const moduleResponse = await modulesService.createModule(moduleData);

            if (moduleResponse.success) {
              modulesCreated++;
            } else {
              modulesFailed++;
              console.error(`Error creando módulo ${mod.nombre}:`, moduleResponse.message);
            }
          } catch (moduleError) {
            modulesFailed++;
            console.error(`Error creando módulo ${mod.nombre}:`, moduleError);
          }
        }

        // Toast de resumen de módulos creados
        if (modulesCreated > 0) {
          toast.success(`${modulesCreated} módulo(s) nuevo(s) creado(s) correctamente`);
        }

        if (modulesFailed > 0) {
          toast.warning(`${modulesFailed} módulo(s) no pudieron ser creados`);
        }
      }

      // Limpiar formulario
      setFormData({ name: "", path: "", description: "" });
      setExistingModules([]);
      setNewModules([]);
      setCurrentModule({ nombre: "", description: "" });
      setErrors({});

      onPageUpdated();
      onHide();
    } catch (error) {
      console.error("Error updating page:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar la página";
      setErrors({
        general: errorMessage,
      });
      toast.error(`Error al actualizar la página: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", path: "", description: "" });
    setExistingModules([]);
    setNewModules([]);
    setCurrentModule({ nombre: "", description: "" });
    setErrors({});
    setDeletingModules(new Set());
    onHide();
  };

  const allModules = [...existingModules, ...newModules];

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
          Actualizar página
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4">
        {errors.general && (
          <Alert variant="danger" className="mb-3">
            {errors.general}
          </Alert>
        )}

        {loadingPage ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mb-0">Cargando datos de la página...</p>
          </div>
        ) : (
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
                    disabled={!currentModule.nombre.trim() || loading}
                    className="fw-medium w-100"
                    title="Agregar módulo a la lista"
                  >
                    <Plus size={16} className="me-2" />
                    Agregar
                  </Button>
                </Col>
              </Row>

              {allModules.length > 0 && (
                <div className="border rounded overflow-hidden">
                  <Table responsive className="mb-0">
                    <thead>
                      <tr>
                        <th className="fw-semibold small">ID</th>
                        <th className="fw-semibold small">Nombre del módulo</th>
                        <th className="fw-semibold small">
                          Descripción del módulo
                        </th>
                        <th className="fw-semibold small align-middle text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allModules
                        .map((module, index) => {
                          if (!module || !module.id) {
                            console.warn("Módulo inválido encontrado:", module);
                            return null;
                          }

                          return (
                            <tr key={module.id}>
                              <td className="align-middle">
                                <small className="text-muted font-monospace">
                                  {index + 1}
                                </small>
                              </td>
                              <td className="align-middle small">
                                {module.nombre || "Sin nombre"}
                                {module.isExisting && (
                                  <Badge bg="secondary" className="ms-2">
                                    Existente
                                  </Badge>
                                )}
                                {!module.isExisting && (
                                  <Badge bg="success" className="ms-2">
                                    Nuevo
                                  </Badge>
                                )}
                              </td>
                              <td className="align-middle small">
                                {module.description || "Sin descripción"}
                              </td>
                              <td className="align-middle text-center">
                                <button
                                  className="btn btn-light btn-icon btn-sm rounded-circle"
                                  title={module.isExisting ? "Eliminar módulo de la base de datos" : "Eliminar módulo de la lista"}
                                  onClick={() => {
                                    if (module.isExisting) {
                                      handleRemoveExistingModule(module.id);
                                    } else {
                                      handleRemoveNewModule(module.id);
                                    }
                                  }}
                                  disabled={deletingModules.has(module.id) || loading}
                                >
                                  {deletingModules.has(module.id) ? (
                                    <div
                                      className="spinner-border spinner-border-sm"
                                      role="status"
                                    >
                                      <span className="visually-hidden">
                                        Eliminando...
                                      </span>
                                    </div>
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                        .filter(Boolean)}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button
          onClick={handleClose}
          className={`fw-medium px-4 btn-light`}
          disabled={loading}
        >
          Cerrar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || loadingPage}
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

export default EditPageModal;