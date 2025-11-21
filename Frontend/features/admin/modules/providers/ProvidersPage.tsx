"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Form, InputGroup, Spinner, Alert } from "react-bootstrap";
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
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Proveedores</h2>
          <p className="text-muted mb-0">
            {isSuperAdmin
              ? "Gestiona todos los proveedores del sistema"
              : "Gestiona los proveedores de tu empresa"}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleNewProvider}
          className="d-flex align-items-center gap-2 px-4"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            borderRadius: "10px",
            padding: "12px 24px",
            fontWeight: "600",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
          }}
        >
          <Plus size={20} />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Company Info Banner for Admin/Manager */}
      {isAdminOrManager && userCompany && (
        <Alert
          variant="info"
          className="mb-4 border-0 shadow-sm"
          style={{
            borderRadius: "15px",
            background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
          }}
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

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre comercial, fiscal, RFC o contacto..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border-0 bg-light"
                  style={{ borderRadius: "0 10px 10px 0" }}
                />
              </InputGroup>
            </div>
            <div className="col-md-6">
              <Form.Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="border-0 bg-light"
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Form.Select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Cargando proveedores...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">#</th>
                    <th className="px-4 py-3 fw-semibold text-muted">NOMBRE COMERCIAL</th>
                    <th className="px-4 py-3 fw-semibold text-muted">NOMBRE FISCAL</th>
                    <th className="px-4 py-3 fw-semibold text-muted">RFC</th>
                    <th className="px-4 py-3 fw-semibold text-muted">CONTACTO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">EMPRESA</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ESTADO</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <PackageSearch size={48} className="mb-3 opacity-50" />
                        <p className="mb-0">No se encontraron proveedores</p>
                      </td>
                    </tr>
                  ) : (
                    providers.map((provider, index) => (
                      <tr key={provider._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-4 py-3 fw-semibold">{provider.tradeName}</td>
                        <td className="px-4 py-3">{provider.legalName}</td>
                        <td className="px-4 py-3">{provider.rfc}</td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="fw-semibold">{provider.contactName}</div>
                            <small className="text-muted">{provider.phone}</small>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="fw-semibold">{provider.company.legalName}</div>
                            <small className="text-muted">{provider.company.rfc}</small>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            bg={provider.isActive ? "success" : "danger"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {provider.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
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
          )}

          {/* Pagination */}
          {!loading && providers.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} proveedores
              </p>
              <div className="d-flex gap-2">
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  style={{ borderRadius: "8px" }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-3 py-1">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  style={{ borderRadius: "8px" }}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
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
