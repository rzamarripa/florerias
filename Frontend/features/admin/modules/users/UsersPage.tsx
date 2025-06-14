"use client";
import { Search } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Badge, Button, Form, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { Role, rolesService } from "../roles/services/role";
import { Actions } from "./components/Actions";
import UserModal from "./components/UserModal";
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
      toast.error("Error al cargar los roles");
    }
  };

  const fetchUsers = async (
    page: number = pagination.page,
    showLoading: boolean = false
  ) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const data = await usersService.getAllUsers({
        page,
        limit: pagination.limit,
        ...(searchUsersSearch && { username: searchUsersSearch }),
        ...(statusFilter && { estatus: statusFilter }),
      });

      if (data.data) {
        setUsers(data.data);
      }

      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Error al cargar los usuarios");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers(1, true);
  }, [searchUsersSearch, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRoles(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchRolesSearch]);

  const handlePageChange = (page: number): void => {
    fetchUsers(page, true);
  };

  const handleToggleUserStatus = async (user: User): Promise<void> => {
    try {
      if (user.profile.estatus) {
        await usersService.deleteUser(user._id);
        toast.success(`Usuario ${user.username} desactivado correctamente`);
      } else {
        await usersService.activateUser(user._id);
        toast.success(`Usuario ${user.username} activado correctamente`);
      }
      fetchUsers(pagination.page, false);
    } catch (err) {
      console.error("Error toggling user status:", err);
      const action = user.profile.estatus ? "desactivar" : "activar";
      toast.error(`Error al ${action} el usuario ${user.username}`);
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
                style={{ minWidth: "150px" }}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Form.Select>

              <UserModal
                roles={roles}
                onSuccess={() => fetchUsers(pagination.page, false)}
              />
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th className="text-center">#</th>
                  <th className="text-center">USUARIO</th>
                  <th className="text-center">ROL</th>
                  <th className="text-center text-nowrap">NOMBRE COMPLETO</th>
                  <th className="text-center">DEPARTAMENTO</th>
                  <th className="text-center text-nowrap">FECHA CREACIÓN</th>
                  <th className="text-center">ESTATUS</th>
                  <th className="text-center">ACCIONES</th>
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
                      <td className="text-center">
                        <span className="text-muted fw-medium">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex align-items-center">
                          <div
                            className="d-flex align-items-center justify-content-center me-2"
                            style={{
                              width: "45px",
                              height: "45px",
                              minWidth: "45px",
                              minHeight: "45px",
                            }}
                          >
                            {user.profile.image ? (
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  overflow: "hidden",
                                  border: "2px solid #e9ecef",
                                  position: "relative",
                                }}
                              >
                                <Image
                                  src={user.profile.image}
                                  alt={user.username}
                                  fill
                                  style={{
                                    objectFit: "cover",
                                  }}
                                  sizes="40px"
                                />
                              </div>
                            ) : (
                              <div
                                className="badge fs-6 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center fw-bold"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  fontSize: "16px",
                                }}
                              >
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="fw-medium">{user.username}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge className="badge fs-6 bg-success bg-opacity-10 text-success px-2 py-1">
                          {user.role?.name || "Sin rol"}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <span className="text-dark">
                          {user.profile.nombreCompleto || user.profile.nombre}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="text-muted">
                          {user.department || "No especificado"}
                        </span>
                      </td>
                      <td className="text-center">
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
                      <td className="text-center">
                        <span
                          className={`badge fs-6 ${user.profile.estatus
                            ? "bg-success bg-opacity-10 text-success"
                            : "bg-danger bg-opacity-10 text-danger"
                            }`}
                        >
                          {user.profile.estatus ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="text-center">
                        <Actions
                          user={user}
                          roles={roles}
                          onToggleStatus={handleToggleUserStatus}
                          onUserUpdated={() =>
                            fetchUsers(pagination.page, false)
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <span className="text-muted">
                Mostrando {users.length} de {pagination.total} registros
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
        </div>
      </div>
    </div>
  );
};

export default UsersPage;