/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { FileText, Settings, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  ListGroup,
  Row,
} from "react-bootstrap";
import { toast } from "react-toastify";
import CreateRoleModal from "./components/CreateRolModal";
import { rolesService } from "./services/roles";
import { Module, Page, Role, SelectedModules } from "./types";
import { BsPencil } from "react-icons/bs";

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedModules, setSelectedModules] = useState<SelectedModules>({});
  const [originalRoleModules, setOriginalRoleModules] = useState<{
    [roleId: string]: string[];
  }>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async (): Promise<void> => {
    try {
      setLoading(true);

      const [rolesResponse, pagesResponse] = await Promise.all([
        rolesService.getAll(),
        rolesService.getPages(),
      ]);

      if (rolesResponse.success && rolesResponse.data) {
        setRoles(rolesResponse.data);

        const roleModulesMap: { [roleId: string]: string[] } = {};
        rolesResponse.data.forEach((role: Role) => {
          roleModulesMap[role._id] = role.modules.map((module: any) =>
            typeof module === "string" ? module : module._id
          );
        });
        setOriginalRoleModules(roleModulesMap);
      }

      if (pagesResponse.success && pagesResponse.data) {
        setPages(pagesResponse.data);

        if (selectedRole && pagesResponse.data.length > 0) {
          const roleModules = originalRoleModules[selectedRole._id] || [];
          const newSelectedModules: SelectedModules = {};

          pagesResponse.data.forEach((page) => {
            page.modules.forEach((module) => {
              newSelectedModules[module._id] = roleModules.includes(module._id);
            });
          });

          setSelectedModules(newSelectedModules);
        }
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Error al cargar los datos iniciales");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: Role): void => {
    setSelectedRole(role);
    setIsEditing(false);

    const roleModules = originalRoleModules[role._id] || [];
    const newSelectedModules: SelectedModules = {};

    pages.forEach((page) => {
      page.modules.forEach((module) => {
        const isSelected = roleModules.includes(module._id);
        newSelectedModules[module._id] = isSelected;
      });
    });

    setSelectedModules(newSelectedModules);
  };

  const handleEdit = (): void => {
    setIsEditing(true);
  };

  const handleCancel = (): void => {
    setIsEditing(false);
    if (selectedRole) {
      handleRoleSelect(selectedRole);
    }
  };

  const handleModuleChange = (moduleId: string, checked: boolean): void => {
    setSelectedModules((prev: SelectedModules) => ({
      ...prev,
      [moduleId]: checked,
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedRole) return;

    try {
      setLoading(true);

      const selectedModuleIds = Object.entries(selectedModules)
        .filter(([_, isSelected]) => isSelected)
        .map(([moduleId, _]) => moduleId);

      const response = await rolesService.update(
        selectedRole._id,
        { modules: selectedModuleIds.map(id => ({ _id: id } as Module)) }
      );

      if (response.success) {
        setOriginalRoleModules((prev) => ({
          ...prev,
          [selectedRole._id]: selectedModuleIds,
        }));

        setRoles((prev) =>
          prev.map((role) =>
            role._id === selectedRole._id
              ? {
                ...role,
                modules: selectedModuleIds.map(
                  (id) => ({ _id: id } as Module)
                ),
              }
              : role
          )
        );

        setIsEditing(false);
        toast.success("Módulos actualizados correctamente");
      } else {
        toast.error(response.message || "Error al actualizar los módulos");
      }
    } catch (error) {
      console.error("Error updating role modules:", error);
      toast.error("Error al actualizar los módulos del rol");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndicator = (page: Page) => {
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
  };

  const getModuleCountForRole = (roleId: string): number => {
    return originalRoleModules[roleId]?.length || 0;
  };

  return (
    <Container fluid className="p-4 min-vh-100">
      <Row className="mb-3">
        <Col>
          <CreateRoleModal pages={pages} reloadData={loadInitialData} />
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Card>
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {roles.map((role: Role) => (
                  <ListGroup.Item
                    key={role._id + role.name}
                    action
                    active={selectedRole?._id === role._id}
                    onClick={() => handleRoleSelect(role)}
                    className="cursor-pointer border-start-0 border-end-0 border-top-0"
                    style={{
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      borderLeft:
                        selectedRole?._id === role._id
                          ? "3px solid #007bff"
                          : "3px solid transparent",
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <Settings size={16} className="me-2" />
                        <span>{role.name}</span>
                      </div>
                      <div className=" d-flex align-items-between gap-2">
                        <Badge bg="secondary" pill>
                          {getModuleCountForRole(role._id)}
                        </Badge>
                        <BsPencil size={12} />
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          {selectedRole ? (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">{selectedRole.name}</h5>
                  <small className="text-muted">
                    Módulos (
                    {Object.values(selectedModules).filter(Boolean).length}{" "}
                    seleccionados)
                  </small>
                </div>
                <div>
                  {!isEditing ? (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleEdit}
                    >
                      Editar
                    </Button>
                  ) : (
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                {loading && !isEditing ? (
                  <div className="text-center py-4">
                    <div
                      className="spinner-border text-primary mb-2"
                      role="status"
                    >
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="text-muted mb-0">Cargando módulos...</p>
                  </div>
                ) : (
                  <div
                    className="pe-2"
                    style={{
                      maxHeight: "600px",
                      overflowY: "auto",
                    }}
                  >
                    {pages.map((page: Page) => (
                      <div
                        key={page._id}
                        className="mb-2 border rounded overflow-hidden"
                      >
                        <div
                          className="bg-light px-3 py-2 border-bottom"
                          style={{ fontSize: "13px", color: "#495057" }}
                        >
                          <div className="d-flex align-items-center">
                            <FileText size={14} />
                            <strong className="ms-2">{page.name}</strong>
                            {getStatusIndicator(page)}
                          </div>
                        </div>

                        {page.modules.map((module: Module) => (
                          <div
                            key={module._id}
                            className="px-3 py-2 border-bottom"
                            style={{
                              transition: "background-color 0.2s ease",
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between">
                              <label
                                htmlFor={module._id}
                                className="mb-0 flex-grow-1 text-dark"
                                style={{
                                  cursor: isEditing ? "pointer" : "default",
                                  fontSize: "13px",
                                }}
                              >
                                {module.name}
                              </label>
                              <input
                                type="checkbox"
                                id={module._id}
                                checked={selectedModules[module._id] || false}
                                onChange={(e) =>
                                  handleModuleChange(
                                    module._id,
                                    e.target.checked
                                  )
                                }
                                disabled={!isEditing}
                                className="form-check-input"
                                style={{ margin: 0 }}
                              />
                            </div>
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
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="text-center py-5">
                <Users size={48} className="text-muted mb-3" />
                <h5>Selecciona un rol</h5>
                <p className="text-muted">
                  Selecciona un rol de la lista para ver y editar sus módulos
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default RolesPage;
