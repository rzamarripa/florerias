"use client"
import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Form, Table, Spinner } from "react-bootstrap";
import ProviderModal from "./components/ProviderModal";
import { Provider, GetProvidersParams, PaginationResponse } from "./types";
import { getProviders } from "./services/providers";
import Actions from "./components/Actions";

const ProvidersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationResponse>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchProviders = async (params?: GetProvidersParams, isInitial = false) => {
    if (isInitial) setLoading(true);
    setError("");
    try {
      const query: GetProvidersParams = {
        page: params?.page || pagination.page,
        limit: params?.limit || pagination.limit,
      };
      if (searchTerm) query.search = searchTerm;
      if (selectedType === "activos") query.status = "true";
      if (selectedType === "inactivos") query.status = "false";
      const res = await getProviders(query);
      if (res.success && Array.isArray(res.data)) {
        setProviders(res.data);
        if (res.pagination) setPagination(res.pagination);
      } else {
        setProviders([]);
        setError(res.message || "Error al cargar proveedores");
      }
    } catch {
      setError("Error de conexión con el servidor");
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders({}, true);
  }, []);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchProviders();
    }, 500);
    setSearchTimeout(timeout);
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTerm, selectedType]);

  const handlePageChange = (page: number) => {
    fetchProviders({ page });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
  };

  // Función para generar los números de página a mostrar
  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2; // Número de páginas a mostrar antes y después de la página actual
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages);
    } else if (pages > 1) {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
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
                  placeholder="Buscar proveedores..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="shadow-none px-4"
                  style={{
                    fontSize: 15,
                    paddingLeft: "2.5rem",
                  }}
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
            </div>

            <div className="d-flex align-items-center gap-2">
              <Form.Select
                value={selectedType}
                onChange={handleTypeChange}
                style={{ minWidth: "150px" }}
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </Form.Select>

              <ProviderModal mode="create" onProviderSaved={() => fetchProviders()} />
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : providers.length === 0 ? (
              <div className="text-center my-5">
                <FileText size={48} className="text-muted mb-2" />
                <p className="text-muted">No hay proveedores registrados</p>
              </div>
            ) : (
              <>
                <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
                  <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                    <tr>
                      <th className="text-center">#</th>
                      <th>Nombre</th>
                      <th>RFC</th>
                      <th>Razón social</th>
                      <th>Contacto</th>
                      <th>Información Bancaria</th>
                      <th>Sucursal</th>
                      <th className="text-center">Estatus</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((provider, index) => (
                      <tr key={provider._id}>
                        <td className="text-center">
                          <span className="text-muted">
                            {(pagination.page - 1) * pagination.limit + index + 1}
                          </span>
                        </td>
                        <td>
                          <span className="fw-medium">{provider.commercialName}</span>
                        </td>
                        <td>{provider.rfc}</td>
                        <td>{provider.businessName}</td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-medium">{provider.contactName}</span>
                            <small className="text-muted">{provider.phone}</small>
                            <small className="text-muted">{provider.email}</small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="fw-medium">{provider.bank?.name}</span>
                            <small className="text-muted">Cuenta: {provider.accountNumber}</small>
                            <small className="text-muted">CLABE: {provider.clabe}</small>
                            <small className="text-muted">Ref: {provider.referencia}</small>
                          </div>
                        </td>
                        <td>
                          <span className="fw-medium">{provider.sucursal?.name}</span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge fs-6 ${provider.isActive
                              ? "bg-success bg-opacity-10 text-success"
                              : "bg-danger bg-opacity-10 text-danger"
                              }`}
                          >
                            {provider.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="text-center">
                          <Actions provider={provider} onProviderSaved={() => fetchProviders()} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <span className="text-muted">
                    Mostrando {providers.length} de {pagination.total} registros
                  </span>
                  <div className="d-flex gap-1 align-items-center">
                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>

                    {getPageNumbers().map((pageNum, index) => (
                      <React.Fragment key={index}>
                        {pageNum === '...' ? (
                          <span className="px-2 text-muted">...</span>
                        ) : (
                          <button
                            className={`btn btn-sm ${pageNum === pagination.page
                              ? "btn-primary"
                              : "btn-outline-secondary"
                              }`}
                            onClick={() => handlePageChange(pageNum as number)}
                          >
                            {pageNum}
                          </button>
                        )}
                      </React.Fragment>
                    ))}

                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Siguiente
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvidersPage;