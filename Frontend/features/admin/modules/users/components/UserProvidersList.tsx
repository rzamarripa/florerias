import React, { useEffect, useState } from "react";
import { Button, Modal, Pagination, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { usersService } from "../services/users";
import { User, UserProvider } from "../types";

interface UserProvidersListProps {
  user: User;
  show: boolean;
  onClose: () => void;
}

const UserProvidersList: React.FC<UserProvidersListProps> = ({
  user,
  show,
  onClose,
}) => {
  const [providers, setProviders] = useState<UserProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (show) {
      loadUserProviders();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      loadUserProviders();
    }
  }, [pagination.page]);

  const loadUserProviders = async () => {
    try {
      setLoading(true);
      const response = await usersService.getUserProviders(user._id, {
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.data) {
        setProviders(response.data);
        if ((response as any).pagination) {
          setPagination((response as any).pagination);
        }
      }
    } catch (error) {
      console.error("Error loading user providers:", error);
      toast.error("Error al cargar los proveedores del usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProvider = async (providerId: string) => {
    try {
      const response = await usersService.removeProvider(user._id, providerId);
      if (response.success) {
        toast.success("Proveedor removido exitosamente");
        loadUserProviders();
      } else {
        toast.error(response.message || "Error al remover el proveedor");
      }
    } catch (error) {
      console.error("Error removing provider:", error);
      toast.error("Error al remover el proveedor");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-2 pt-3">
        <Modal.Title className="text-dark fs-5">
          Proveedores Asignados - {user.username}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 py-2">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 mb-0">Cargando proveedores...</p>
          </div>
        ) : providers.length === 0 ? (
          <p className="text-center py-4 text-muted">
            Este usuario no tiene proveedores asignados
          </p>
        ) : (
          <>
            <div className="table-responsive">
              <Table className="table table-hover table-sm">
                <thead className="bg-light">
                  <tr>
                    <th className="text-center" style={{ width: "50px" }}>
                      #
                    </th>
                    <th>Nombre Comercial</th>
                    <th>Razón Social</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th className="text-center" style={{ width: "100px" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((userProvider, index) => (
                    <tr key={userProvider._id}>
                      <td className="text-center">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td>{userProvider.providerId.commercialName}</td>
                      <td>{userProvider.providerId.businessName}</td>
                      <td>{userProvider.providerId.contactName}</td>
                      <td>
                        <span
                          className={`badge fs-6 ${
                            userProvider.providerId.isActive
                              ? "bg-success bg-opacity-10 text-success"
                              : "bg-danger bg-opacity-10 text-danger"
                          }`}
                        >
                          {userProvider.providerId.isActive
                            ? "Activo"
                            : "Inactivo"}
                        </span>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            handleRemoveProvider(userProvider.providerId._id)
                          }
                        >
                          Remover
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {pagination.pages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <Pagination>
                  <Pagination.First
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                  />
                  <Pagination.Prev
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  />

                  {Array.from(
                    { length: Math.min(5, pagination.pages) },
                    (_, i) => {
                      const pageNum =
                        Math.max(
                          1,
                          Math.min(pagination.pages - 4, pagination.page - 2)
                        ) + i;
                      if (pageNum > pagination.pages) return null;

                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === pagination.page}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    }
                  )}

                  <Pagination.Next
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  />
                  <Pagination.Last
                    onClick={() => handlePageChange(pagination.pages)}
                    disabled={pagination.page === pagination.pages}
                  />
                </Pagination>
              </div>
            )}

            <div className="mt-3 text-muted small text-center">
              Mostrando {providers.length} de {pagination.total} proveedores
              asignados
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 pt-2 pb-3">
        <Button variant="light" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UserProvidersList;
