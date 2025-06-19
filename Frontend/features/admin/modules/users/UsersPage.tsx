"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { Role } from "../roles/types";
import UserActions from "./components/Actions";
import UserModal from "./components/UserModal";
import { usersService } from "./services/users";
import { User } from "./types";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadRoles = async () => {
    try {
      const response = await usersService.getAllRoles({ limit: 100 });
      if (response.data) {
        setRoles(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los roles");
      console.error("Error loading roles:", error);
    }
  };

  const loadUsers = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }
      const response = await usersService.getAllUsers({
        page,
        limit: pagination.limit,
        ...(searchTerm && { username: searchTerm }),
        ...(statusFilter && { estatus: statusFilter }),
      });

      if (response.data) {
        setUsers(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los usuarios");
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    loadUsers(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadUsers(true, page);
  };

  const handleUserSaved = () => {
    loadUsers(false);
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
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="shadow-none px-4"
                  style={{ fontSize: 15, paddingLeft: "2.5rem" }}
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
              <Form.Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="shadow-none"
                style={{ maxWidth: 150 }}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Form.Select>
            </div>
            <UserModal roles={roles} onSuccess={handleUserSaved} />
          </div>
          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Departamento</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
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
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
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
                              {user.profile?.name?.charAt(0).toUpperCase() ||
                                user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="fw-medium">
                              {user.profile?.name || user.username}
                            </div>
                            <div className="text-muted small">
                              {user.profile?.fullName}
                            </div>
                          </div>
                        </div>
                                   
                      </td>
                      <td>{user.profile.fullName}</td>
                      <td>{user.department || "-"}</td>
                      <td>
                        {typeof user.role === "object"
                          ? user.role.name
                          : user.role || "-"}
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
                        <UserActions
                          user={user}
                          roles={roles}
                          onUserSaved={handleUserSaved}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
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
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
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
              })}
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
  );
};

export default UsersPage;
