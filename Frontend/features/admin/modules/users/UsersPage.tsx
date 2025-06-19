"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { Role } from "../roles/types";
import UserModal from "./components/UserModal";
import { usersService } from "./services/users";
import { User } from "./types";
import { FiTrash2 } from "react-icons/fi";
import { BsCheck2 } from "react-icons/bs";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchUsersSearch, setSearchUsersTerm] = useState<string>("");
  const [searchRolesSearch, setSearchRolesTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const fetchRoles = async (page: number = pagination.page) => {
    try {
      const response = await usersService.getAllRoles({
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
      console.log(data.data)

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
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th className="text-center">Estatus</th>
                  <th className="text-center text-nowrap">Fecha creación</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        />
                        <span className="mt-2">Cargando usuarios...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user._id}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {user?.profile?.image?.data ? (
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                overflow: "hidden",
                                border: "2px solid #e9ecef",
                                position: "relative",
                              }}
                            >
                              <Image
                                src={`data:${user.profile.image.contentType};base64,${user.profile.image.data}`}
                                alt={user.username}
                                fill
                                style={{
                                  objectFit: "cover",
                                }}
                                sizes="32px"
                              />
                            </div>
                          ) : (
                            <div
                              className="bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                fontSize: "14px",
                              }}
                            >
                              {user.profile?.name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="fw-medium">{user.profile?.name || user.username}</div>
                            <div className="text-muted small">{user.profile?.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.username}</td>
                      <td>{typeof user.role === 'object' ? user.role.name : 'Sin rol'}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            user.profile?.estatus
                              ? "bg-success-subtle text-success"
                              : "bg-danger-subtle text-danger"
                          }`}
                        >
                          {user.profile?.estatus ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="text-center">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <UserModal
                            user={user}
                            roles={roles}
                            onSuccess={() => fetchUsers(pagination.page, false)}
                          />
                          <button
                            className="btn btn-light btn-icon btn-sm rounded-circle"
                            onClick={() => handleToggleUserStatus(user)}
                            title={
                              user.profile?.estatus
                                ? "Desactivar usuario"
                                : "Activar usuario"
                            }
                          >
                            {user.profile?.estatus ? (
                              <FiTrash2 size={16} />
                            ) : (
                              <BsCheck2 size={16} />
                            )}
                          </button>
                        </div>
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
                <Button
                  variant="primary"
                  size="sm"
                >
                  {pagination.page}
                </Button>
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
