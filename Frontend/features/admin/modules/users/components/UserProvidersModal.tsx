import React, { useEffect, useState } from "react";
import { Button, Modal, Table, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { providersService } from "../services/providers";
import { usersService } from "../services/users";
import { Provider, User, UserProvider } from "../types";

interface UserProvidersModalProps {
  user: User;
  onProvidersSaved?: () => void;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
  children?: React.ReactNode;
}

const UserProvidersModal: React.FC<UserProvidersModalProps> = ({
  user,
  onProvidersSaved,
  buttonProps = {},
  children,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingUserProviders, setLoadingUserProviders] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (showModal) {
      loadProviders();
      loadUserProviders();
    }
  }, [showModal]);

  useEffect(() => {
    if (showModal) {
      loadProviders();
    }
  }, [pagination.page]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await providersService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        isActive: true,
      });
      if (response.success && response.data) {
        setProviders(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error("Error loading providers:", error);
      toast.error("Error al cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  const loadUserProviders = async () => {
    try {
      setLoadingUserProviders(true);
      const response = await usersService.getUserProviders(user._id);
      if (response.success && response.data) {
        const providerIds = response.data.map(
          (userProvider: UserProvider) => userProvider.providerId._id
        );
        setSelectedProviders(providerIds);
      }
    } catch (error) {
      console.error("Error loading user providers:", error);
      toast.error("Error al cargar los proveedores del usuario");
    } finally {
      setLoadingUserProviders(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProviders([]);
    setSelectedProviderId("");
    setPagination({ ...pagination, page: 1 });
  };

  const handleAddProvider = () => {
    if (selectedProviderId && !selectedProviders.includes(selectedProviderId)) {
      setSelectedProviders([...selectedProviders, selectedProviderId]);
      setSelectedProviderId("");
    }
  };

  const handleRemoveProvider = (providerId: string) => {
    setSelectedProviders(selectedProviders.filter(id => id !== providerId));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await usersService.assignProviders(
        user._id,
        selectedProviders
      );
      if (response.success) {
        toast.success("Proveedores asignados correctamente");
        onProvidersSaved?.();
        handleCloseModal();
      } else {
        toast.error(response.message || "Error al asignar proveedores");
      }
    } catch (error) {
      console.error("Error saving providers:", error);
      toast.error("Error al guardar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedProvidersData = () => {
    return selectedProviders.map(providerId => {
      const provider = providers.find(p => p._id === providerId);
      return provider || { _id: providerId, commercialName: "Cargando...", businessName: "", contactName: "" };
    });
  };

  return (
    <>
      <button
        className={`btn btn-${buttonProps.variant || "light"} btn-${
          buttonProps.size || "sm"
        } ${buttonProps.className || ""}`}
        title={buttonProps.title || "Asignar proveedores"}
        onClick={handleOpenModal}
      >
        {children || "Asignar Proveedores"}
      </button>

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="lg"
        centered
        backdrop="static"
        keyboard={!loading}
      >
        <Modal.Header closeButton className="border-0 pb-2 pt-3">
          <Modal.Title className="text-dark fs-5">
            Asignar Proveedores - {user.username}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="px-4 py-2">
          <div className="row mb-3">
            <div className="col-md-8">
              <Form.Select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                disabled={loading}
              >
                <option value="">Seleccionar proveedor...</option>
                {providers
                  .filter(provider => !selectedProviders.includes(provider._id))
                  .map((provider) => (
                    <option key={provider._id} value={provider._id}>
                      {provider.commercialName} - {provider.businessName}
                    </option>
                  ))}
              </Form.Select>
            </div>
            <div className="col-md-4">
              <Button
                variant="outline-primary"
                onClick={handleAddProvider}
                disabled={!selectedProviderId || loading}
                className="w-100"
              >
                Agregar
              </Button>
            </div>
          </div>

          <div className="table-responsive" style={{ maxHeight: "400px" }}>
            <Table className="table table-hover table-sm">
              <thead className="bg-light sticky-top">
                <tr>
                  <th>Nombre Comercial</th>
                  <th>Razón Social</th>
                  <th>Contacto</th>
                  <th style={{ width: "80px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingUserProviders ? (
                  <tr>
                    <td colSpan={4} className="text-center py-3">
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Cargando proveedores asignados...</span>
                      </div>
                    </td>
                  </tr>
                ) : selectedProviders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-3 text-muted">
                      No hay proveedores asignados
                    </td>
                  </tr>
                ) : (
                  getSelectedProvidersData().map((provider) => (
                    <tr key={provider._id}>
                      <td>{provider.commercialName}</td>
                      <td>{provider.businessName}</td>
                      <td>{provider.contactName}</td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveProvider(provider._id)}
                          disabled={loading}
                          title="Remover proveedor"
                        >
                          ×
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          <div className="mt-3 text-muted small">
            {selectedProviders.length > 0 && (
              <span>Proveedores asignados: {selectedProviders.length}</span>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-2 pb-3">
          <Button variant="light" onClick={handleCloseModal} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserProvidersModal;
