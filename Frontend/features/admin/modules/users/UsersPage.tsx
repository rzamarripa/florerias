"use client";

import { PlusCircleIcon, Search, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Row,
  Table,
} from "react-bootstrap";
import { Role, rolesService } from "../roles/services/role";
import { Actions } from "./components/ActionsDropdown/Actions";
import CreateUserModal from "./components/CreateUserModal/UserModal";
import StatusBadge from "./components/StatusBadge/StatusBadge";
import { usersService, type User } from "./services/users";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchUsersSearch, setSearchUsersTerm] = useState<string>("");
  const [searchRolesSearch, setSearchRolesTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const fetchRoles = async (page: number = pagination.page) => {
    try {
      setError(null);

      const response = await rolesService.getAllRoles({
        page,
        limit: pagination.limit,
        ...(searchRolesSearch && { username: searchRolesSearch }),
      });

      if (response.data) {
        setRoles(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const fetchUsers = async (page: number = pagination.page) => {
    try {
      setLoading(true);
      setError(null);

      const response = await usersService.getAllUsers({
        page,
        limit: pagination.limit,
        ...(searchUsersSearch && { username: searchUsersSearch }),
        ...(statusFilter && { estatus: statusFilter }),
      });

      if (response.data) {
        setUsers(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [searchUsersSearch, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRoles(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchRolesSearch]);

  const handleAddUser = (): void => {
    setEditingUserId(null);
    setShowCreateModal(true);
  };

  const handleEditUser = (userId: string): void => {
    setEditingUserId(userId);
    setShowCreateModal(true);
  };

  const handleCloseModal = (): void => {
    setShowCreateModal(false);
    setEditingUserId(null);
    fetchUsers(pagination.page);
  };

  const handlePageChange = (page: number): void => {
    fetchUsers(page);
  };

  const clearErrors = (): void => {
    setError(null);
  };

  const handleToggleUserStatus = async (user: User): Promise<void> => {
    try {
      if (user.profile.estatus) {
        await usersService.deleteUser(user._id);
      } else {
        await usersService.activateUser(user._id);
      }
      fetchUsers(pagination.page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cambiar estado del usuario"
      );
    }
  };

  return (
    <Container fluid>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4">
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={clearErrors}
            aria-label="Close"
          />
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <div className="bg-primary rounded-circle p-3 me-3">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h2 className="fw-bold text-dark m-0">USUARIOS</h2>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={handleAddUser}
          className="d-flex align-items-center"
        >
          <PlusCircleIcon size={16} className="me-2" />
          Agregar Usuario
        </Button>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-end-0">
                  <Search size={16} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchUsersSearch}
                  onChange={(e) => setSearchUsersTerm(e.target.value)}
                  className="border-start-0"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={searchRolesSearch}
                onChange={(e) => setSearchRolesTerm(e.target.value)}
              >
                <option value="">Todos los roles</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="table-hover mb-0">
              <thead className="">
                <tr>
                  <th className="border-0 py-2 px-3 fw-semibold text-uppercase text-muted small">
                    #
                  </th>
                  <th className="border-0 py-2 px-3 fw-semibold text-uppercase text-muted small">
                    Usuario
                  </th>
                  <th className="border-0 py-2 px-3 fw-semibold text-uppercase text-muted small">
                    Rol
                  </th>
                  <th className="border-0 py-2 px-3 fw-semibold text-uppercase text-muted small">
                    Nombre Completo
                  </th>
                  <th className="border-0 py-2 px-3 fw-semibold text-uppercase text-muted small">
                    Departamento
                  </th>
                  <th className="border-0 py-2 px-3 fw-semibold text-uppercase text-muted small">
                    Fecha Creación
                  </th>
                  <th className="border-0 py-2 px-3 fw-semibold text-uppercase text-muted small text-center">
                    Estatus
                  </th>
                  <th className="border-0 py-2 px-3 fw-semibold text-uppercase text-muted small text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <div
                          className="spinner-border text-primary mb-2"
                          role="status"
                        >
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0 small">
                          Cargando usuarios...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user._id}>
                      <td className="py-2 px-3 align-middle">
                        <span className="text-muted fw-medium">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </span>
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2"
                            style={{
                              width: "32px",
                              height: "32px",
                              minWidth: "32px",
                            }}
                          >
                            <span className="text-white fw-bold small">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="fw-medium text-dark">
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <Badge bg="primary" className="px-2 py-1">
                          {user.role?.name || "Sin rol"}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <span className="text-dark">
                          {user.profile.nombreCompleto || user.profile.nombre}
                        </span>
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <span className="text-muted">
                          {user.department || "No especificado"}
                        </span>
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <span className="text-muted">
                          {new Date(user.createdAt).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </td>
                      <td className="py-2 px-3 align-middle text-center">
                        <StatusBadge status={user.profile.estatus} />
                      </td>
                      <td className="py-2 px-3 align-middle text-center">
                        <Actions
                          user={user}
                          onEdit={handleEditUser}
                          onToggleStatus={handleToggleUserStatus}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {pagination.pages > 1 && (
            <div className="d-flex justify-content-between align-items-center py-2 px-3 border-top bg-light">
              <span className="text-muted small">
                Mostrando {users.length} de {pagination.total} usuarios
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li
                    className={`page-item ${
                      pagination.page === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </button>
                  </li>

                  {Array.from(
                    { length: Math.min(5, pagination.pages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <li
                          key={pageNum}
                          className={`page-item ${
                            pagination.page === pageNum ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    }
                  )}

                  <li
                    className={`page-item ${
                      pagination.page === pagination.pages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </Card.Body>
      </Card>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        editingUserId={editingUserId}
        users={users}
        roles={roles}
      />
    </Container>
  );
};

export default UsersPage;
