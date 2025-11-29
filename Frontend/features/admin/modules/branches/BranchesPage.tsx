"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Form, InputGroup, Spinner } from "react-bootstrap";
import { Plus, Search, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { branchesService } from "./services/branches";
import { Branch } from "./types";
import BranchActions from "./components/BranchActions";
import BranchModal from "./components/BranchModal";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { companiesService } from "../companies/services/companies";

const BranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const { getUserId } = useUserSessionStore();
  const { getIsAdmin } = useUserRoleStore();
  const userId = getUserId();
  const isAdmin = getIsAdmin();

  // Cargar la empresa del usuario administrador (solo para el modal de creación)
  const loadUserCompany = async () => {
    try {
      if (!userId || !isAdmin) return;

      // Usar el nuevo endpoint que obtiene la empresa del usuario administrador autenticado
      const company = await companiesService.getMyCompany();
      setUserCompany(company || null);
    } catch (error: any) {
      console.error("Error al cargar empresa del usuario:", error);
      // Si no hay empresa asignada, establecer null
      setUserCompany(null);
    }
  };

  const loadBranches = async (isInitial: boolean, page: number = pagination.page) => {
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

      // El backend se encarga del filtrado automático según el rol del usuario
      // No es necesario enviar companyId desde el frontend
      const response = await branchesService.getAllBranches(filters);

      if (response.data) {
        setBranches(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las sucursales");
      console.error("Error loading branches:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar empresa del usuario al montar el componente (solo para el modal)
  useEffect(() => {
    loadUserCompany();
  }, [userId]);

  // Cargar sucursales cuando cambian los filtros
  useEffect(() => {
    loadBranches(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadBranches(true, page);
  };

  const handleBranchUpdated = () => {
    loadBranches(false);
  };

  const getCompanyName = (branch: Branch): string => {
    if (typeof branch.companyId === "string") {
      return "N/A";
    }
    return branch.companyId.legalName;
  };

  const getEmployeesCount = (branch: Branch): number => {
    return branch.employees?.length || 0;
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Sucursales</h2>
          <p className="text-muted mb-0">Gestiona las sucursales del sistema</p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="d-flex align-items-center gap-2"
          >
            <Plus size={20} />
            Nueva Sucursal
          </Button>
        )}
      </div>

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
                  placeholder="Buscar por nombre o código de sucursal..."
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
              <p className="text-muted mt-3">Cargando sucursales...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">#</th>
                    <th className="px-4 py-3 fw-semibold text-muted">NOMBRE</th>
                    <th className="px-4 py-3 fw-semibold text-muted">CÓDIGO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">EMPRESA</th>
                    <th className="px-4 py-3 fw-semibold text-muted">CIUDAD</th>
                    <th className="px-4 py-3 fw-semibold text-muted">GERENTE</th>
                    <th className="px-4 py-3 fw-semibold text-muted">EMPLEADOS</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ESTADO</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        <Building2 size={48} className="mb-3 opacity-50" />
                        <p className="mb-0">No se encontraron sucursales</p>
                      </td>
                    </tr>
                  ) : (
                    branches.map((branch, index) => (
                      <tr key={branch._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-4 py-3 fw-semibold">{branch.branchName}</td>
                        <td className="px-4 py-3">
                          {branch.branchCode ? (
                            <span className="badge bg-secondary">{branch.branchCode}</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">{getCompanyName(branch)}</td>
                        <td className="px-4 py-3">
                          {branch.address.city}, {branch.address.state}
                        </td>
                        <td className="px-4 py-3">
                          {!branch.manager || typeof branch.manager === "string" ? (
                            <span className="text-muted">Sin gerente</span>
                          ) : (
                            <div>
                              <div className="fw-semibold">{branch.manager.profile.fullName}</div>
                              <small className="text-muted">{branch.manager.email}</small>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge bg="info" pill>
                            {getEmployeesCount(branch)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            bg={branch.isActive ? "success" : "danger"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {branch.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <BranchActions
                            branch={branch}
                            onBranchUpdated={handleBranchUpdated}
                            userCompany={userCompany}
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
          {!loading && branches.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} sucursales
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

      {/* Create Modal */}
      {isAdmin && (
        <BranchModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onBranchSaved={handleBranchUpdated}
          userCompany={userCompany}
        />
      )}
    </div>
  );
};

export default BranchesPage;
