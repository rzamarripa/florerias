"use client"
import { FileText, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Form, Table, Pagination, Spinner } from "react-bootstrap";
import ProviderModal from "./components/ProviderModal";
import { Provider } from "./types";
import { getProviders } from "./services/providers";
import Actions from "./components/Actions";

const ProvidersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [proveedores, setProveedores] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchProveedores = async (params?: { page?: number; limit?: number }, isInitial = false) => {
    if (isInitial) setLoading(true);
    setError("");
    try {
      const query: any = {
        page: params?.page || pagination.page,
        limit: params?.limit || pagination.limit,
      };
      if (searchTerm) query.search = searchTerm;
      if (selectedType === "activos") query.status = "true";
      if (selectedType === "inactivos") query.status = "false";
      const res = await getProviders(query);
      if (res.success && Array.isArray(res.data)) {
        setProveedores(res.data);
        if (res.pagination) setPagination(res.pagination);
      } else {
        setProveedores([]);
        setError(res.message || "Error al cargar proveedores");
      }
    } catch {
      setError("Error de conexión con el servidor");
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchProveedores({ page: 1 }, true);
    }, searchTerm ? 500 : 0);
    setSearchTimeout(timeout);
    return () => {
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedType]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedType(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    fetchProveedores({ page: newPage });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    fetchProveedores({ page: 1, limit: newLimit });
  };

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;
    const items = [];
    const currentPage = pagination.page;
    const totalPages = pagination.pages;

    items.push(
      <Pagination.First
        key="first"
        disabled={currentPage === 1}
        onClick={() => handlePageChange(1)}
      />
    );
    items.push(
      <Pagination.Prev
        key="prev"
        disabled={currentPage === 1}
        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
      />
    );

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else {
        startPage = Math.max(1, endPage - 4);
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        disabled={currentPage === totalPages}
        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
      />
    );
    items.push(
      <Pagination.Last
        key="last"
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(totalPages)}
      />
    );

    return <Pagination className="mb-0">{items}</Pagination>;
  };

  const filteredProveedores: Provider[] = proveedores;

  return (
    <div className="container-fluid py-4">
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
                    onChange={handleSearchChange}
                    className="shadow-none px-4"
                    style={{ fontSize: 15, paddingLeft: "2.5rem" }}
                  />
                  <Search
                    className="text-muted position-absolute"
                    size={18}
                    style={{ left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}
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
                  <option value="activos">Proveedores activos</option>
                  <option value="inactivos">Proveedores inactivos</option>
                </Form.Select>
                <ProviderModal mode="create" onProveedorSaved={fetchProveedores} />
              </div>
            </div>
            <div className="table-responsive shadow-sm">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <span className="ms-2">Cargando proveedores...</span>
                </div>
              ) : error ? (
                <div className="text-center py-5">
                  <FileText size={48} className="text-danger mb-3" />
                  <h5 className="text-danger">{error}</h5>
                </div>
              ) : (
                <>
                  <Table className="table table-custom table-centered table-select table-hover w-100 mb-0" style={{ tableLayout: "fixed" }}>
                    <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                      <tr>
                        <th className="text-center" style={{ width: "6%" }}>#</th>
                        <th className="text-center">NOMBRE COMERCIAL</th>
                        <th className="text-center">RAZÓN SOCIAL</th>
                        <th className="text-center">CONTACTO</th>
                        <th className="text-center">UBICACIÓN</th>
                        <th className="text-center">INFORMACIÓN</th>
                        <th className="text-center">ESTADO</th>
                        <th className="text-center text-nowrap">FECHA CREACIÓN</th>
                        <th className="text-center">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProveedores.map((proveedor: Provider, index: number) => (
                        <tr key={proveedor._id}>
                          <td className="text-center">
                            <span className="text-muted fw-medium">
                              {(pagination.page - 1) * pagination.limit + index + 1}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column">
                              <span className="fw-medium text-dark">{proveedor.commercialName}</span>
                              {proveedor.description && <small className="text-muted">{proveedor.description}</small>}
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="text-dark">{proveedor.businessName}</span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column">
                              <span className="fw-medium text-dark">{proveedor.contactName}</span>
                              <small className="text-muted">{proveedor.phone}</small>
                              <small className="text-muted">{proveedor.email}</small>
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column">
                              <span className="fw-medium text-dark">
                                {typeof proveedor.municipalityId === 'object' && proveedor.municipalityId ? proveedor.municipalityId.name : ''}, {typeof proveedor.stateId === 'object' && proveedor.stateId ? proveedor.stateId.name : ''}
                              </span>
                              <small className="text-muted">
                                {typeof proveedor.countryId === 'object' && proveedor.countryId ? proveedor.countryId.name : ''}
                              </small>
                              {proveedor.address && (
                                <small className="text-muted">
                                  {proveedor.address.length > 30
                                    ? `${proveedor.address.substring(0, 30)}...`
                                    : proveedor.address}
                                </small>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <div className="d-flex flex-column">
                              <span className="badge bg-info bg-opacity-10 text-info mb-1">Proveedor</span>
                              <small className="text-muted">{new Date(proveedor.updatedAt).toLocaleDateString("es-ES")}</small>
                            </div>
                          </td>
                          <td className="text-center">
                                <span className={`badge fs-6 ${proveedor.isActive ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"}`}>
                                    {proveedor.isActive ? "Activo" : "Inactivo"}  
                            </span>
                          </td>
                          <td className="text-center">
                            <span>
                              {new Date(proveedor.createdAt).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="text-center">
                            <Actions proveedor={proveedor} onProveedorSaved={fetchProveedores} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {filteredProveedores.length === 0 && (
                    <div className="text-center py-5">
                      <FileText size={48} className="text-muted mb-3" />
                      <h5 className="text-muted">No se encontraron proveedores</h5>
                      <p className="text-muted">
                        {searchTerm || selectedType !== "todos"
                          ? "Intenta cambiar los filtros de búsqueda"
                          : "No hay proveedores disponibles en el sistema"}
                      </p>
                    </div>
                  )}
                  <div className="d-flex justify-content-between align-items-center p-3 border-top">
                    <div className="d-flex align-items-center gap-3">
                      <Form.Select
                        value={pagination.limit}
                        onChange={handleLimitChange}
                        style={{ width: 110, display: "inline-block" }}
                        size="sm"
                        disabled={loading}
                      >
                        {[5, 10, 20, 50, 100].map((opt) => (
                          <option key={opt} value={opt}>{opt} / página</option>
                        ))}
                      </Form.Select>
                      <span className="text-muted">
                        Mostrando {proveedores.length} de {pagination.total} registros
                      </span>
                    </div>
                    <div>
                      {renderPagination()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvidersPage;