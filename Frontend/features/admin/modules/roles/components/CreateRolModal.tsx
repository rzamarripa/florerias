/* eslint-disable @typescript-eslint/no-unused-vars */
import { Plus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import { rolesService } from "../services/roles";
import { Module, Page, SelectedModules } from "../types";

interface CreateRoleModalProps {
  pages: Page[];
  reloadData: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  pages,
  reloadData,
}) => {
  const [show, setShow] = useState<boolean>(false);
  const [roleName, setRoleName] = useState<string>("");
  const [selectedModules, setSelectedModules] = useState<SelectedModules>({});
  const [loading, setLoading] = useState<boolean>(false);

  const handleShow = useCallback(() => setShow(true), []);
  const handleClose = useCallback(() => {
    setShow(false);
    setRoleName("");
    setSelectedModules({});
  }, []);

  useEffect(() => {
    if (show && pages.length > 0) {
      const initialModules: SelectedModules = {};
      pages.forEach((page) => {
        page.modules.forEach((module) => {
          initialModules[module._id] = false;
        });
      });
      setSelectedModules(initialModules);
    }
  }, [show, pages]);

  const handleRoleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRoleName(e.target.value);
    },
    []
  );

  const handleModuleChange = useCallback(
    (moduleId: string, checked: boolean) => {
      setSelectedModules((prev) => ({
        ...prev,
        [moduleId]: checked,
      }));
    },
    []
  );

  const getStatusIndicator = useCallback(
    (page: Page) => {
      if (page.modules.length === 0) {
        return <span className="ms-2 text-danger">○</span>;
      }

      const hasSelectedModules = page.modules.some(
        (module) => selectedModules[module._id]
      );

      if (hasSelectedModules) {
        return <span className="ms-2 text-success">●</span>;
      }
      return <span className="ms-2 text-warning">○</span>;
    },
    [selectedModules]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      toast.error("El nombre del rol es requerido");
      return;
    }

    try {
      setLoading(true);

      const selectedModuleIds = Object.entries(selectedModules)
        .filter(([_, isSelected]) => isSelected)
        .map(([moduleId, _]) => moduleId);

      const response = await rolesService.createRole({
        name: roleName.trim(),
        modules: selectedModuleIds,
      });

      if (response.success && response.data) {
        handleClose();
        reloadData();
        toast.success("Rol creado exitosamente");
      } else {
        toast.error(response.message || "Error al crear el rol");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error("Error al crear el rol");
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = Object.values(selectedModules).filter(Boolean).length;

  return (
    <>
      <Button variant="primary" onClick={handleShow}>
        <Plus size={16} className="me-2" />
        Nuevo
      </Button>

      <Modal
        show={show}
        onHide={handleClose}
        size="lg"
        centered
        backdrop="static"
        keyboard={!loading}
      >
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Rol</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del rol *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Escriba el nombre del rol"
                value={roleName}
                onChange={handleRoleNameChange}
                disabled={loading}
                required
                autoFocus
              />
            </Form.Group>

            <div className="mb-2">
              <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>
                Módulos ({selectedCount} seleccionados)
              </Form.Label>
            </div>

            <div
              style={{
                maxHeight: "350px",
                overflowY: "auto",
                border: "1px solid #dee2e6",
                borderRadius: "0.375rem",
              }}
            >
              {pages.map((page: Page) => (
                <div key={page._id} className="border-bottom">
                  <div
                    className="bg-light px-3 py-2"
                    style={{ fontSize: "13px", color: "#495057" }}
                  >
                    <div className="d-flex align-items-center">
                      <strong>{page.name}</strong>
                      {getStatusIndicator(page)}
                    </div>
                  </div>

                  {page.modules.map((module: Module) => (
                    <div key={module._id} className="px-3 py-2 border-bottom">
                      <Form.Check
                        type="checkbox"
                        id={`modal-${module._id}`}
                        label={module.name}
                        checked={selectedModules[module._id] || false}
                        onChange={(e) =>
                          handleModuleChange(module._id, e.target.checked)
                        }
                        disabled={loading}
                        style={{ fontSize: "13px" }}
                      />
                    </div>
                  ))}

                  {page.modules.length === 0 && (
                    <div className="px-3 py-3 text-center">
                      <span
                        className="text-muted fst-italic"
                        style={{ fontSize: "12px" }}
                      >
                        Sin módulos disponibles
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || !roleName.trim()}
            >
              {loading ? "Creando..." : "Crear Rol"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default CreateRoleModal;
