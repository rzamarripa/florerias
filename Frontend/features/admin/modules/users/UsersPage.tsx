"use client";

import { Download, RefreshCw, Search, UserPlus } from "lucide-react";
import React, { useEffect, useState } from "react";
import ActionsDropdown from "./components/ActionsDropdown/ActionsDropdown";
import CreateUserModal from "./components/CreateUserModal/CreateUserModal";
import RoleBadge from "./components/RoleBadge/RoleBadge";
import StatusBadge from "./components/StatusBadge/StatusBadge";
import { usersService, type User } from "./services/users";
import styles from "./UsersPage.module.css";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const fetchUsers = async (page: number = pagination.page) => {
    try {
      setLoading(true);
      setError(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const handleRefresh = (): void => {
    fetchUsers(pagination.page);
  };

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

  const handleExport = (): void => {
    console.log("Exportar usuarios");
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
    <div className={styles.container}>
      {error && (
        <div
          className={`alert alert-danger alert-dismissible fade show ${styles.errorAlert}`}
        >
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={clearErrors}
            aria-label="Close"
          />
        </div>
      )}

      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconContainer}>
            <span className={styles.iconEmoji}>👥</span>
          </div>
          <div>
            <h1 className={styles.pageTitle}>
              Usuarios
              <span className={styles.countBadge}>{users.length}</span>
            </h1>
            <p className={styles.userRole}>Su Rol: SuperAdmin</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              className={`${styles.btnIcon} ${loading ? styles.spin : ""}`}
            />
            Actualizar
          </button>
          <button className={styles.exportBtn} onClick={handleExport}>
            <Download size={14} className={styles.btnIcon} />
            Exportar
          </button>
          <button className={styles.addUserBtn} onClick={handleAddUser}>
            <UserPlus size={14} className={styles.btnIcon} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filtersContainer}>
          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterSelect}>
            <select
              className={styles.selectInput}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="SuperAdmin">Super Admin</option>
              <option value="Gerente">Gerente</option>
              <option value="Egresos">Egresos</option>
              <option value="Sin rol">Sin rol</option>
            </select>
          </div>
          <div className={styles.filterSelect}>
            <select
              className={styles.selectInput}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className={styles.loadingText}>Cargando usuarios...</p>
        </div>
      )}

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeader}>#</th>
                <th className={styles.tableHeader}>Rol</th>
                <th className={styles.tableHeader}>Usuario</th>
                <th className={styles.tableHeader}>Nombre Completo</th>
                <th className={styles.tableHeader}>Departamento</th>
                <th className={styles.tableHeader}>Fecha Creación</th>
                <th className={`${styles.tableHeader} ${styles.textCenter}`}>
                  Estatus
                </th>
                <th className={`${styles.tableHeader} ${styles.textCenter}`}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    <div>
                      <div className={styles.emptyIcon}>📭</div>
                      <h6>No se encontraron usuarios</h6>
                      <p className={styles.emptyText}>
                        Intenta ajustar los filtros de búsqueda
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user._id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      <span className={styles.indexNumber}>
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <RoleBadge role={user.role} />
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                          <span className={styles.avatarText}>
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className={styles.username}>{user.username}</span>
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.fullName}>
                        {user.profile.nombreCompleto || user.profile.nombre}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.department}>
                        {user.department || "No especificado"}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.createdDate}>
                        {new Date(user.createdAt).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                    <td className={`${styles.tableCell} ${styles.textCenter}`}>
                      <StatusBadge status={user.profile.estatus} />
                    </td>
                    <td className={`${styles.tableCell} ${styles.textCenter}`}>
                      <ActionsDropdown
                        user={user}
                        onEdit={handleEditUser}
                        onToggleStatus={handleToggleUserStatus}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              <span className={styles.paginationText}>
                Mostrando {users.length} de {pagination.total} usuarios
              </span>
              <nav>
                <ul className={styles.pagination}>
                  <li
                    className={`${styles.pageItem} ${
                      pagination.page === 1 ? styles.disabled : ""
                    }`}
                  >
                    <button
                      className={styles.pageLink}
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
                          className={`${styles.pageItem} ${
                            pagination.page === pageNum ? styles.active : ""
                          }`}
                        >
                          <button
                            className={styles.pageLink}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    }
                  )}

                  <li
                    className={`${styles.pageItem} ${
                      pagination.page === pagination.pages
                        ? styles.disabled
                        : ""
                    }`}
                  >
                    <button
                      className={styles.pageLink}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        editingUserId={editingUserId}
        users={users}
      />
    </div>
  );
};

export default UsersPage;
