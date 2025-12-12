"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Badge,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { companiesService } from "./services/companies";
import { Company } from "./types";
import CompanyActions from "./components/CompanyActions";

const CompaniesPage: React.FC = () => {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadCompanies = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
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

      const response = await companiesService.getAllCompanies(filters);

      if (response.data) {
        setCompanies(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las empresas");
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies(true, 1);
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
    loadCompanies(true, page);
  };

  const handleNewCompany = () => {
    router.push("/gestion/empresas/nueva");
  };

  const handleCompanyUpdated = () => {
    loadCompanies(false);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Empresas</h2>
          <p className="text-muted mb-0">Gestiona las empresas del sistema</p>
        </div>
        <Button
          variant="primary"
          onClick={handleNewCompany}
          className="d-flex align-items-center gap-2 px-4"
        >
          <Plus size={20} />
          Nueva Empresa
        </Button>
      </div>

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por razón social, RFC o nombre comercial..."
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
              <p className="text-muted mt-3">Cargando empresas...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">#</th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      RAZÓN SOCIAL
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">RFC</th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      NOMBRE COMERCIAL
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      ADMINISTRADOR
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      USUARIOS REDES
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">ESTADO</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-center">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        <Building2 size={48} className="mb-3 opacity-50" />
                        <p className="mb-0">No se encontraron empresas</p>
                      </td>
                    </tr>
                  ) : (
                    companies.map((company, index) => (
                      <tr
                        key={company._id}
                        style={{ borderBottom: "1px solid #f1f3f5" }}
                      >
                        <td className="px-4 py-3">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-4 py-3 fw-semibold">
                          {company.legalName}
                        </td>
                        <td className="px-4 py-3">{company.rfc}</td>
                        <td className="px-4 py-3">
                          {company.tradeName || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {company.administrator ? (
                            <div>
                              <div className="fw-semibold">
                                {company.administrator.profile.fullName}
                              </div>
                              <small className="text-muted">
                                {company.administrator.email}
                              </small>
                            </div>
                          ) : (
                            <span className="text-muted">
                              Sin administrador
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {company.redes && company.redes.length > 0 ? (
                            <div>
                              {company.redes.map((redesUser, idx) => (
                                <div key={redesUser._id}>
                                  <div
                                    className="fw-semibold"
                                    style={{ fontSize: "0.9rem" }}
                                  >
                                    {redesUser.profile.fullName}
                                  </div>
                                  {idx < company.redes!.length - 1 && (
                                    <hr className="my-1" />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">
                              Sin usuarios redes
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            bg={company.isActive ? "success" : "danger"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {company.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <CompanyActions
                            company={company}
                            onCompanyUpdated={handleCompanyUpdated}
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
          {!loading && companies.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                de {pagination.total} empresas
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
    </div>
  );
};

export default CompaniesPage;
