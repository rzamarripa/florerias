import MultiSelect, { SelectOption } from "@/components/forms/Multiselect";
import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Modal, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { providersService } from "../services/providers";
import { usersService } from "../services/users";
import { Provider, User } from "../types";

interface UserProvidersModalProps {
  user: User;
  onProvidersSaved?: () => void;
  buttonProps?: {
    variant?: string;
    size?: "sm" | "lg";
    className?: string;
    title?: string;
  };
}

const UserProvidersModal: React.FC<UserProvidersModalProps> = ({
  user,
  onProvidersSaved,
  buttonProps = {},
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
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
  }, [searchTerm, pagination.page]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await providersService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        isActive: true,
        ...(searchTerm && { search: searchTerm }),
      });
      if (response.data) {
        setProviders(response.data);
        setPagination((response as any).pagination);
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
      const response = await usersService.getUserProviders(user._id);
      if (response.data) {
        const providerIds = response.data.map(
          (userProvider: any) => userProvider.providerId._id
        );
        setSelectedProviders(providerIds);
      }
    } catch (error) {
      console.error("Error loading user providers:", error);
      toast.error("Error al cargar los proveedores del usuario");
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProviders([]);
    setSearchTerm("");
    setPagination({ ...pagination, page: 1 });
  };

  const handleProviderChange = (values: string[]) => {
    setSelectedProviders(values);
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

  const getMultiSelectOptions = (): SelectOption[] => {
    return providers.map((provider) => ({
      value: provider._id,
      label: provider.commercialName,
      businessName: provider.businessName,
      contactName: provider.contactName,
    }));
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
        📦
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
          <MultiSelect
            value={selectedProviders}
            options={getMultiSelectOptions()}
            onChange={handleProviderChange}
            loading={loading}
            placeholder="Buscar y seleccionar proveedores..."
            noOptionsMessage="No se encontraron proveedores"
            loadingMessage="Cargando proveedores..."
            className="mb-3"
          />

          <div className="table-responsive" style={{ maxHeight: "400px" }}>
            <Table className="table table-hover table-sm">
              <thead className="bg-light sticky-top">
                <tr>
                  <th>Nombre Comercial</th>
                  <th>Razón Social</th>
                  <th>Contacto</th>
                  <th style={{ width: "50px" }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-3">
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-3 text-muted">
                      No se encontraron proveedores activos
                    </td>
                  </tr>
                ) : (
                  providers.map((provider) => (
                    <tr key={provider._id}>
                      <td>{provider.commercialName}</td>
                      <td>{provider.businessName}</td>
                      <td>{provider.contactName}</td>
                      <td>
                        <Button
                          className="btn btn-link text-primary p-0 border-0"
                          variant="outline-primary"
                          onClick={() => {
                            if (!selectedProviders.includes(provider._id)) {
                              setSelectedProviders([
                                ...selectedProviders,
                                provider._id,
                              ]);
                            }
                          }}
                          disabled={selectedProviders.includes(provider._id)}
                          title="Agregar proveedor"
                          style={{ cursor: "pointer" }}
                        >
                          <Plus size={18} strokeWidth={2.5} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          <div className="mt-3 text-muted small">
            Mostrando {providers.length} de {pagination.total} proveedores
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
