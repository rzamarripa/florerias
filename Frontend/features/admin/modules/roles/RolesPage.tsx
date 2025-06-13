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
  Form,
  ListGroup,
  Row,
} from "react-bootstrap";
import styles from "./RolesPage.module.css";
import { rolesService } from "./services/roles";
import { Module, Page, Role, SelectedModules } from "./types";

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

      // Solo 2 fetch necesarios: roles y páginas (páginas ya incluyen todos los módulos)
      const [rolesResponse, pagesResponse] = await Promise.all([
        rolesService.getAllRoles(), // Roles con módulos asignados
        rolesService.getPages(), // Páginas con todos los módulos disponibles
      ]);

      // Procesar roles y crear mapa de módulos asignados por rol
      if (rolesResponse.success && rolesResponse.data) {
        setRoles(rolesResponse.data);

        const roleModulesMap: { [roleId: string]: string[] } = {};
        rolesResponse.data.forEach((role: Role) => {
          roleModulesMap[role._id] = role.modules.map((module) => module._id);
        });
        setOriginalRoleModules(roleModulesMap);
      }

      // Establecer páginas (cada página ya incluye su array completo de módulos)
      if (pagesResponse.success && pagesResponse.data) {
        setPages(pagesResponse.data);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: Role): void => {
    setSelectedRole(role);
    setIsEditing(false);

    // Actualizar checkboxes basándose en los módulos del rol seleccionado
    const roleModules = originalRoleModules[role._id] || [];
    const newSelectedModules: SelectedModules = {};

    // Iterar sobre todas las páginas y módulos para establecer el estado
    pages.forEach((page) => {
      page.modules.forEach((module) => {
        newSelectedModules[module._id] = roleModules.includes(module._id);
      });
    });

    setSelectedModules(newSelectedModules);
  };

  const handleEdit = (): void => {
    setIsEditing(true);
  };

  const handleCancel = (): void => {
    setIsEditing(false);
    // Restaurar estado original
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

      setOriginalRoleModules((prev) => ({
        ...prev,
        [selectedRole._id]: selectedModuleIds,
      }));

      setRoles((prev) =>
        prev.map((role) =>
          role._id === selectedRole._id
            ? {
                ...role,
                modules: selectedModuleIds.map((id) => ({ _id: id } as Module)),
              }
            : role
        )
      );

      setIsEditing(false);

      console.log("Módulos a actualizar:", selectedModuleIds);
    } catch (error) {
      console.error("Error updating role modules:", error);
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
    <Container fluid className={styles.container}>
      <Row className="mb-3">
        <Col>
          <div className="d-flex align-items-center">
            <Users className="me-2" size={24} />
            <h2 className="mb-0">Roles por Usuario</h2>
            <Badge bg="primary" className="ms-2">
              {roles.length} roles
            </Badge>
          </div>
          <p className="text-muted">
            Herramienta para administrar los roles de los usuarios
          </p>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <Button variant="primary">Nuevo</Button>
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
                    className={styles.roleItem}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <Settings size={16} className="me-2" />
                        <span>{role.name}</span>
                      </div>
                      <Badge bg="secondary" pill>
                        {getModuleCountForRole(role._id)}
                      </Badge>
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
                  <div className="text-center">Cargando...</div>
                ) : (
                  <div className={styles.modulesContainer}>
                    {pages.map((page: Page) => (
                      <div key={page._id} className={styles.pageSection}>
                        <div className={styles.pageHeader}>
                          <div className="d-flex align-items-center">
                            <FileText size={16} />
                            <strong className="ms-2">{page.name}</strong>
                            {getStatusIndicator(page)}
                          </div>
                        </div>

                        {page.modules.map((module: Module) => (
                          <div key={module._id} className={styles.moduleItem}>
                            <div className="d-flex align-items-center justify-content-between">
                              <label
                                htmlFor={module._id}
                                className="mb-0 flex-grow-1"
                                style={{
                                  cursor: isEditing ? "pointer" : "default",
                                }}
                              >
                                {module.name}
                              </label>
                              <Form.Check
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
                                className="mb-0"
                              />
                            </div>
                          </div>
                        ))}

                        {page.modules.length === 0 && (
                          <div className={styles.noModules}>
                            <span className="text-muted">
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
