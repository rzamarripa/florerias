import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge, Button, Col, Form, Modal, Row, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  UpdatePageFormData,
  updatePageSchema,
} from "../schemas/editPageSchema";
import { ModuleFormData, moduleSchema } from "../schemas/moduleSchema";
import { CreateModuleData, Module, modulesService } from "../services/modules";
import { pagesService, UpdatePageData } from "../services/pages";
import { ModuleRow } from "../types";

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<UpdatePageFormData>({
    resolver: zodResolver(updatePageSchema),
    defaultValues: {
      name: "",
      path: "",
      description: "",
    },
  });

  const {
    register: registerModule,
    handleSubmit: handleSubmitModule,
    formState: { errors: moduleErrors },
    reset: resetModule,
    watch: watchModule,
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      nombre: "",
      description: "",
    },
  });

  const [existingModules, setExistingModules] = useState<ModuleRow[]>([]);
  const [newModules, setNewModules] = useState<ModuleRow[]>([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [deletingModules, setDeletingModules] = useState<Set<string>>(
    new Set()
  );

  const allModules = [...existingModules, ...newModules];
  const moduleNombre = watchModule("nombre");

  useEffect(() => {
    if (show && pageId) {
      loadPageData();
    } else if (!show) {
      reset();
      resetModule();
      setExistingModules([]);
      setNewModules([]);
      setDeletingModules(new Set());
    }
  }, [show, pageId, reset, resetModule]);

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

        setValue("name", page.name);
        setValue("path", page.path);
        setValue("description", page.description || "");
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
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(`Error al cargar los datos de la página: ${errorMessage}`);
    } finally {
      setLoadingPage(false);
    }
  };

  const handleAddModule = handleSubmitModule((data: ModuleFormData) => {
    const newModule: ModuleRow = {
      id: `new_${Date.now()}`,
      nombre: data.nombre.trim(),
      description: data.description?.trim() || "",
      isExisting: false,
    };

    setNewModules((prev) => [...prev, newModule]);
    resetModule();
    toast.success(`Módulo "${newModule.nombre}" agregado a la lista`);
  });

  const handleRemoveNewModule = (id: string) => {
    const moduleToRemove = newModules.find((m) => m.id === id);
    setNewModules((prev) => prev.filter((module) => module.id !== id));

    if (moduleToRemove) {
      toast.success(`Módulo "${moduleToRemove.nombre}" eliminado de la lista`);
    }
  };

  const handleRemoveExistingModule = async (moduleId: string) => {
    if (!pageId) {
      const errorMsg = "Error: ID de página faltante";
      toast.error(errorMsg);
      return;
    }

    if (!moduleId) {
      const errorMsg = "Error: ID de módulo faltante";
      toast.error(errorMsg);
      return;
    }

    if (typeof pageId !== "string" || pageId.trim() === "") {
      const errorMsg = "Error: ID de página inválido";
      toast.error(errorMsg);
      return;
    }

    if (typeof moduleId !== "string" || moduleId.trim() === "") {
      const errorMsg = "Error: ID de módulo inválido";
      toast.error(errorMsg);
      return;
    }

    const moduleToDelete = existingModules.find((m) => m.id === moduleId);
    const moduleName = moduleToDelete?.nombre || "el módulo";

    try {
      console.log("id del modulo: ", moduleId);
      setDeletingModules((prev) => new Set(prev).add(moduleId));

      const response = await pagesService.removeModuleFromPage(
        pageId,
        moduleId
      );
      console.log(response);

      if (response.success) {
        setExistingModules((prev) =>
          prev.filter((module) => module.id !== moduleId)
        );
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

      toast.error(
        `Error al eliminar el módulo "${moduleName}": ${errorMessage}`
      );
    } finally {
      setDeletingModules((prev) => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    }
  };

  const onSubmit = async (data: UpdatePageFormData) => {
    if (!pageId) {
      toast.error("Error: ID de página faltante");
      return;
    }

    try {
      const pageData: UpdatePageData = {
        name: data.name,
        path: data.path,
        description: data.description || undefined,
      };

      const pageResponse = await pagesService.updatePage(pageId, pageData);

      if (!pageResponse.success) {
        throw new Error(
          pageResponse.message || "Error al actualizar la página"
        );
      }

      toast.success(`Página "${data.name}" actualizada correctamente`);

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

            const moduleResponse = await modulesService.createModule(
              moduleData
            );

            if (moduleResponse.success) {
              modulesCreated++;
            } else {
              modulesFailed++;
              console.error(
                `Error creando módulo ${mod.nombre}:`,
                moduleResponse.message
              );
            }
          } catch (moduleError) {
            modulesFailed++;
            console.error(`Error creando módulo ${mod.nombre}:`, moduleError);
          }
        }

        if (modulesCreated > 0) {
          toast.success(
            `${modulesCreated} módulo(s) nuevo(s) creado(s) correctamente`
          );
        }

        if (modulesFailed > 0) {
          toast.warning(`${modulesFailed} módulo(s) no pudieron ser creados`);
        }
      }

      handleClose();
      onPageUpdated();
    } catch (error) {
      console.error("Error updating page:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar la página";
      toast.error(`Error al actualizar la página: ${errorMessage}`);
    }
  };

  const handleClose = () => {
    reset();
    resetModule();
    setExistingModules([]);
    setNewModules([]);
    setDeletingModules(new Set());
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
          Actualizar página
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4">
        {loadingPage ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mb-0">Cargando datos de la página...</p>
          </div>
        ) : (
          <>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium mb-2 small">
                      Nombre de la página
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre de la página"
                      {...register("name")}
                      isInvalid={!!errors.name}
                      className="shadow-none"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name?.message}
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
                      {...register("path")}
                      isInvalid={!!errors.path}
                      className="shadow-none"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.path?.message}
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
                      {...register("description")}
                      isInvalid={!!errors.description}
                      className="shadow-none"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.description?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Form>

            <div className="mb-4">
              <h5 className="fw-semibold mb-3 pb-2 border-bottom">
                Módulos de la página
              </h5>

              <Form onSubmit={handleAddModule}>
                <Row className="mb-3">
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label className="fw-medium mb-2 small">
                        Nombre del módulo
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Nombre del módulo"
                        {...registerModule("nombre")}
                        isInvalid={!!moduleErrors.nombre}
                        className="shadow-none"
                      />
                      <Form.Control.Feedback type="invalid">
                        {moduleErrors.nombre?.message}
                      </Form.Control.Feedback>
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
                        {...registerModule("description")}
                        isInvalid={!!moduleErrors.description}
                        className="shadow-none"
                      />
                      <Form.Control.Feedback type="invalid">
                        {moduleErrors.description?.message}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!moduleNombre?.trim() || isSubmitting}
                      className="fw-medium w-100"
                      title="Agregar módulo a la lista"
                    >
                      <Plus size={16} className="me-2" />
                      Agregar
                    </Button>
                  </Col>
                </Row>
              </Form>

              {allModules.length > 0 && (
                <div className="border rounded overflow-hidden">
                  <Table responsive className="mb-0">
                    <thead>
                      <tr>
                        <th className="fw-semibold small">#</th>
                        <th className="fw-semibold small">Nombre del módulo</th>
                        <th className="fw-semibold small">
                          Descripción del módulo
                        </th>
                        <th className="fw-semibold small align-middle text-center">
                          Acciones
                        </th>
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
                                  type="button"
                                  className="btn btn-light btn-icon btn-sm rounded-circle"
                                  title={
                                    module.isExisting
                                      ? "Eliminar módulo de la base de datos"
                                      : "Eliminar módulo de la lista"
                                  }
                                  onClick={() => {
                                    if (module.isExisting) {
                                      handleRemoveExistingModule(module.id);
                                    } else {
                                      handleRemoveNewModule(module.id);
                                    }
                                  }}
                                  disabled={
                                    deletingModules.has(module.id) ||
                                    isSubmitting
                                  }
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
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button
          type="button"
          onClick={handleClose}
          className="fw-medium px-4 btn-light"
          disabled={isSubmitting}
        >
          Cerrar
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || loadingPage}
          className="fw-medium px-4"
        >
          {isSubmitting ? (
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
