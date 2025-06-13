"use client";

import { Plus, Search } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Badge, Button, Form, Table } from "react-bootstrap";
import { Role, rolesService } from "../roles/services/role";
import { Actions } from "./components/Actions";
import CreateUserModal from "./components/CreateUserModal/UserModal";
import { usersService, type User } from "./services/users";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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
      console.error("Error fetching roles:", err);
    }
  };

  const fetchUsers = async (page: number = pagination.page) => {
    try {
      setLoading(true);

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
      console.error("Error fetching users:", err);
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

  const handleToggleUserStatus = async (user: User): Promise<void> => {
    try {
      if (user.profile.estatus) {
        await usersService.deleteUser(user._id);
      } else {
        await usersService.activateUser(user._id);
      }
      fetchUsers(pagination.page);
    } catch (err) {
      console.error("Error toggling user status:", err);
    }
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
            <div className="d-flex gap-2">
              <div className="position-relative" style={{ maxWidth: 400 }}>
                <Form.Control
                  type="search"
                  placeholder="Buscar usuarios..."
                  value={searchUsersSearch}
                  onChange={(e) => setSearchUsersTerm(e.target.value)}
                  className="shadow-none px-4"
                  style={{
                    fontSize: 15,
                    paddingLeft: "2.5rem",
                  }}
                />
                <Search
                  className="text-muted position-absolute"
                  size={18}
                  style={{
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
              </div>
              <button
                data-table-delete-selected
                className="btn btn-danger d-none"
              >
                Delete
              </button>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Form.Select
                value={searchRolesSearch}
                onChange={(e) => setSearchRolesTerm(e.target.value)}
                style={{ minWidth: "150px" }}
                size="sm"
              >
                <option value="">Todos los roles</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </Form.Select>

              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ minWidth: "140px" }}
                size="sm"
              >
                <option value="">Todos los estados</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Form.Select>

              <Button
                variant="primary"
                className="d-flex align-items-center gap-2 text-nowrap px-3"
                onClick={handleAddUser}
              >
                <Plus size={18} />
                Agregar Usuario
              </Button>
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th>#</th>
                  <th>USUARIO</th>
                  <th>ROL</th>
                  <th className="text-nowrap">NOMBRE COMPLETO</th>
                  <th>DEPARTAMENTO</th>
                  <th className="text-nowrap">FECHA CREACIÓN</th>
                  <th>ESTATUS</th>
                  <th>ACCIONES</th>
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
                      <td>
                        <span className="text-muted fw-medium">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-md d-flex align-items-center justify-content-center me-2">
                            {user.profile.image ? (
                              <Image
                                src={user.profile.image || ""}
                                alt={user.username}
                                className="img-fluid rounded-circle"
                                width={40}
                                height={40}
                                style={{
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "30px", height: "30px" }}
                              >
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="fw-medium">{user.username}</span>
                        </div>
                      </td>
                      <td>
                        <Badge bg="primary" className="px-2 py-1">
                          {user.role?.name || "Sin rol"}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-dark">
                          {user.profile.nombreCompleto || user.profile.nombre}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted">
                          {user.department || "No especificado"}
                        </span>
                      </td>
                      <td>
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
                      <td>
                        <span
                          className={`badge fs-6 ${
                            user.profile.estatus
                              ? "bg-success bg-opacity-10 text-success"
                              : "bg-danger bg-opacity-10 text-danger"
                          }`}
                        >
                          {user.profile.estatus ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
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

            {/* Footer con paginación */}
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <span className="text-muted">
                Mostrando {users.length} de {pagination.total} usuarios
              </span>
              <div className="d-flex gap-1">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Anterior
                </Button>
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          pagination.page === pageNum
                            ? "primary"
                            : "outline-secondary"
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>

          <CreateUserModal
            isOpen={showCreateModal}
            onClose={handleCloseModal}
            editingUserId={editingUserId}
            users={users}
            roles={roles}
          />
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
