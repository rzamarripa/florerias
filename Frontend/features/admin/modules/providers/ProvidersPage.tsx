"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Form, Alert } from "react-bootstrap";
import { Plus, Search, ChevronLeft, ChevronRight, PackageSearch, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { providersService } from "./services/providers";
import { Provider } from "./types";
import ProviderActions from "./components/ProviderActions";
import ProviderForm from "./components/ProviderForm";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { companiesService } from "../companies/services/companies";

const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [userCompany, setUserCompany] = useState<{ _id: string; legalName: string; tradeName?: string; rfc: string } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const { getIsAdmin, getIsManager, getIsSuperAdmin } = useUserRoleStore();
  const isAdminOrManager = getIsAdmin() || getIsManager();
  const isSuperAdmin = getIsSuperAdmin();

  const loadProviders = async (isInitial: boolean, page: number = pagination.page) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: any = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (statusFilter) {
        filters.isActive = statusFilter === "true";
      }

      const response = await providersService.getAllProviders(filters);

      if (response.data) {
        setProviders(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los proveedores");
      console.error("Error loading providers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar empresa del usuario al montar el componente
  useEffect(() => {
    if (isAdminOrManager) {
      loadUserCompany();
    }
  }, [isAdminOrManager]);

  useEffect(() => {
    loadProviders(true, 1);
  }, [searchTerm, statusFilter]);

  const loadUserCompany = async () => {
    try {
      const response = await companiesService.getUserCompany();
      if (response.success && response.data) {
        setUserCompany(response.data);
      }
    } catch (error: any) {
      console.error("Error loading user company:", error);
      // No mostrar error al usuario, es solo informativo
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadProviders(true, page);
  };

  const handleNewProvider = () => {
    setSelectedProvider(null);
    setShowModal(true);
  };

  const handleEditProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProvider(null);
  };

  const handleProviderUpdated = () => {
    loadProviders(false);
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
                  placeholder="Buscar por nombre comercial, fiscal, RFC o contacto..."
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
            <Button
              variant="primary"
              onClick={handleNewProvider}
              className="d-flex align-items-center gap-2"
            >
              <Plus size={16} />
              Nuevo Proveedor
            </Button>
          </div>

          {/* Company Info Banner for Admin/Manager */}
          {isAdminOrManager && userCompany && (
            <Alert
              variant="info"
              className="mx-3 mt-3 mb-0 border-0"
            >
              <div className="d-flex align-items-center gap-3">
                <Building2 size={24} className="text-primary" />
                <div>
                  <div className="fw-bold text-dark">
                    {userCompany.tradeName || userCompany.legalName}
                  </div>
                  <small className="text-muted">
                    {userCompany.rfc} • Estás viendo los proveedores de esta empresa
                  </small>
                </div>
              </div>
            </Alert>
          )}

          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th>#</th>
                  <th>Nombre Comercial</th>
                  <th>Nombre Fiscal</th>
                  <th>RFC</th>
                  <th>Contacto</th>
                  <th>Empresa</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
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
                          Cargando proveedores...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : providers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="text-muted">
                        <PackageSearch size={48} className="mb-3 opacity-50" />
                        <div>No se encontraron proveedores</div>
                        <small>Intenta ajustar los filtros de búsqueda</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  providers.map((provider, index) => (
                    <tr key={provider._id}>
                      <td>
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td>
                        <div className="fw-medium">{provider.tradeName}</div>
                      </td>
                      <td>{provider.legalName}</td>
                      <td>{provider.rfc}</td>
                      <td>
                        <div>
                          <div className="fw-medium">{provider.contactName}</div>
                          <div className="text-muted small">{provider.phone}</div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{provider.company.legalName}</div>
                          <div className="text-muted small">{provider.company.rfc}</div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge fs-6 ${
                            provider.isActive
                              ? "bg-success bg-opacity-10 text-success"
                              : "bg-danger bg-opacity-10 text-danger"
                          }`}
                        >
                          {provider.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="text-center">
                        <ProviderActions
                          provider={provider}
                          onEdit={handleEditProvider}
                          onProviderUpdated={handleProviderUpdated}
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
              Mostrando {providers.length} de {pagination.total} registros
            </span>
            <div className="d-flex gap-1 align-items-center">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="d-flex align-items-center"
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>

              <span className="px-2 text-muted">
                Página {pagination.page} de {pagination.pages}
              </span>

              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="d-flex align-items-center"
              >
                Siguiente
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Form Modal */}
      <ProviderForm
        show={showModal}
        onHide={handleCloseModal}
        onSuccess={handleProviderUpdated}
        provider={selectedProvider}
      />
    </div>
  );
};

export default ProvidersPage;
