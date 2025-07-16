import React, { useEffect, useState, useRef } from "react";
import { Button, Modal, Table, Form, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { X } from "lucide-react";
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
  const [searchText, setSearchText] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [userProviders, setUserProviders] = useState<UserProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingUserProviders, setLoadingUserProviders] =
    useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showModal) {
      loadUserProviders();
    }
  }, [showModal]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchText.trim().length >= 1) {
      searchTimeoutRef.current = setTimeout(() => {
        searchProviders();
        setShowDropdown(true);
      }, 500);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText, userProviders, selectedProviders]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const searchProviders = async () => {
    try {
      setSearchLoading(true);
      const response = await providersService.getAll({
        search: searchText,
        isActive: true,
        limit: 50,
      });

      if (response.success && response.data) {
        const assignedProviderIds = userProviders.map(
          (up) => up.providerId._id
        );
        const selectedProviderIds = selectedProviders.map((p) => p._id);
        const availableProviders = response.data.filter(
          (provider) =>
            !assignedProviderIds.includes(provider._id) &&
            !selectedProviderIds.includes(provider._id)
        );
        setSearchResults(availableProviders);
      }
    } catch (error) {
      console.error("Error searching providers:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const loadUserProviders = async () => {
    try {
      setLoadingUserProviders(true);
      const response = await usersService.getUserProviders(user._id);

      if (response.success && response.data) {
        setUserProviders(response.data);
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
    setSearchText("");
    setSearchResults([]);
    setSelectedProviders([]);
    setShowDropdown(false);
    setUserProviders([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProviders([...selectedProviders, provider]);
    setSearchText("");
    setSearchResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleRemoveSelectedProvider = (providerId: string) => {
    setSelectedProviders(selectedProviders.filter((p) => p._id !== providerId));
  };

  const handleAddSelectedProviders = async () => {
    if (selectedProviders.length === 0) return;

    try {
      setLoading(true);
      const currentProviderIds = userProviders.map((up) => up.providerId._id);
      const newProviderIds = selectedProviders.map((p) => p._id);
      const allProviderIds = [...currentProviderIds, ...newProviderIds];

      const response = await usersService.assignProviders(
        user._id,
        allProviderIds
      );

      if (response.success) {
        const newUserProviders: UserProvider[] = selectedProviders.map(
          (provider) => ({
            _id: `temp_${provider._id}_${Date.now()}`,
            userId: user._id,
            providerId: {
              _id: provider._id,
              commercialName: provider.commercialName,
              businessName: provider.businessName,
              contactName: provider.contactName,
              isActive: provider.isActive,
            },
            createdAt: new Date().toISOString(),
          })
        );

        setUserProviders([...userProviders, ...newUserProviders]);
        setSelectedProviders([]);

        toast.success(
          `${newProviderIds.length} proveedor(es) agregado(s) correctamente`
        );
        onProvidersSaved?.();
      } else {
        toast.error(response.message || "Error al agregar proveedores");
      }
    } catch (error) {
      console.error("Error adding providers:", error);
      toast.error("Error al agregar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUserProvider = async (providerId: string) => {
    try {
      setLoading(true);

      const response = await usersService.removeProvider(user._id, providerId);

      if (response.success) {
        setUserProviders(
          userProviders.filter((up) => up.providerId._id !== providerId)
        );
        toast.success("Proveedor eliminado correctamente");
        onProvidersSaved?.();
      } else {
        toast.error(response.message || "Error al eliminar proveedor");
      }
    } catch (error) {
      console.error("Error removing provider:", error);
      toast.error("Error al eliminar el proveedor");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowDropdown(true);
    }
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
          <div className="mb-3">
            <Form.Label className="text-dark mb-2">
              Buscar y Seleccionar Proveedores:
            </Form.Label>

            <div className="position-relative">
              <div
                className="border rounded p-2 d-flex flex-wrap align-items-center gap-2"
                style={{ minHeight: "42px" }}
              >
                {selectedProviders.map((provider) => (
                  <Badge
                    key={provider._id}
                    bg="primary"
                    className="d-flex align-items-center gap-1 px-2 py-1 flex-shrink-0"
                    style={{
                      fontSize: "0.875rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span>{provider.commercialName}</span>
                    <X
                      size={14}
                      className="cursor-pointer"
                      onClick={() => handleRemoveSelectedProvider(provider._id)}
                      style={{ cursor: "pointer" }}
                    />
                  </Badge>
                ))}

                <Form.Control
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar proveedores..."
                  value={searchText}
                  onChange={handleSearchTextChange}
                  onFocus={handleInputFocus}
                  disabled={loading}
                  className="border-0 p-0"
                  style={{
                    boxShadow: "none",
                    minWidth: "150px",
                    flex: "1 1 auto",
                  }}
                />
              </div>

              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="position-absolute w-100 bg-white border rounded shadow-lg"
                  style={{
                    top: "100%",
                    zIndex: 1050,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {searchLoading ? (
                    <div className="p-3 text-center">
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Buscando...</span>
                      </div>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-muted text-center">
                      {searchText.length < 1
                        ? "Escriba para buscar"
                        : "No hay resultados"}
                    </div>
                  ) : (
                    searchResults.map((provider) => (
                      <div
                        key={provider._id}
                        className="p-2 cursor-pointer border-bottom hover-bg-light"
                        onClick={() => handleProviderSelect(provider)}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f8f9fa")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "")
                        }
                      >
                        <div className="fw-medium">
                          {provider.commercialName}
                        </div>
                        <small className="text-muted">
                          {provider.businessName}
                        </small>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedProviders.length > 0 && (
              <div className="mt-2">
                <Button
                  variant="primary"
                  onClick={handleAddSelectedProviders}
                  disabled={loading}
                  className="d-flex align-items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Agregando...</span>
                      </div>
                      Agregando...
                    </>
                  ) : (
                    `Agregar ${selectedProviders.length} proveedor(es)`
                  )}
                </Button>
              </div>
            )}
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
                        <span className="visually-hidden">
                          Cargando proveedores asignados...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : userProviders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-3 text-muted">
                      No hay proveedores asignados
                    </td>
                  </tr>
                ) : (
                  userProviders.map((userProvider) => (
                    <tr key={userProvider._id}>
                      <td>{userProvider.providerId.commercialName}</td>
                      <td>{userProvider.providerId.businessName}</td>
                      <td>{userProvider.providerId.contactName}</td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() =>
                            handleRemoveUserProvider(
                              userProvider.providerId._id
                            )
                          }
                          disabled={loading}
                          title="Eliminar proveedor"
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
            {userProviders.length > 0 && (
              <span>Proveedores asignados: {userProviders.length}</span>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-2 pb-3">
          <Button variant="light" onClick={handleCloseModal} disabled={loading}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserProvidersModal;
