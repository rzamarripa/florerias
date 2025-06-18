"use client";

import { FileText, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Form, Table } from "react-bootstrap";
import { BsCheck2 } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import BranchModal from "./components/BranchModal";
import { branchService } from "./services/branch";
import { Branch } from "./types";

const BranchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchBranches = async (
    isInitialLoad: boolean = false,
    page: number = pagination.page
  ) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const res = await branchService.getAll({
        page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
      });
      if (res.data) {
        setBranches(res.data);
      }
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al cargar las sucursales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches(true, 1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    fetchBranches(true, page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedType(e.target.value);
  };

  const handleToggleSucursal = async (branch: Branch) => {
    try {
      if (branch.isActive) {
        await branchService.delete(branch._id);
        toast.success(`Sucursal "${branch.name}" desactivada correctamente`);
      } else {
        await branchService.activate(branch._id);
        toast.success(`Sucursal "${branch.name}" activada correctamente`);
      }
      fetchBranches(false);
    } catch (error: any) {
      const action = branch.isActive ? "desactivar" : "activar";
      toast.error(
        `Error al ${action} la sucursal "${branch.name}": ${error.message}`
      );
    }
  };

  const isSucursalActive = (id: string) => {
    return branches.find((branch) => branch._id === id)?.isActive;
  };

  const handleSucursalSaved = () => {
    fetchBranches(false);
  };

  const filteredBranches: Branch[] = branches.filter((branch: Branch) => {
    const matchesSearch: boolean =
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (typeof branch.companyId === "object" &&
        branch.companyId.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (typeof branch.municipalityId === "object" &&
        branch.municipalityId.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      branch.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType: boolean =
      selectedType === "todos" ||
      (selectedType === "activos" && branch.isActive) ||
      (selectedType === "inactivos" && !branch.isActive);
    return matchesSearch && matchesType;
  });

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
            <div className="d-flex gap-2">
              <div className="position-relative" style={{ maxWidth: 400 }}>
                <Form.Control
                  type="search"
                  placeholder="Buscar sucursales..."
                  value={searchTerm}
                  onChange={handleSearchChange}
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
                <option value="activos">Sucursales activas</option>
                <option value="inactivos">Sucursales inactivas</option>
              </Form.Select>

              <BranchModal
                mode="create"
                onSucursalSaved={handleSucursalSaved}
              />
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr>
                  <th className="text-center">#</th>
                  <th className="text-center">NOMBRE</th>
                  <th className="text-center">RAZÓN SOCIAL</th>
                  <th className="text-center">MARCA</th>
                  <th className="text-center">UBICACIÓN</th>
                  <th className="text-center">CONTACTO</th>
                  <th className="text-center">ESTADO</th>
                  <th className="text-center text-nowrap">FECHA CREACIÓN</th>
                  <th className="text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <div
                          className="spinner-border text-primary mb-2"
                          role="status"
                        >
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0 small">
                          Cargando sucursales...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((branch: Branch, index: number) => (
                    <tr key={branch._id}>
                      <td className="text-center">
                        <span className="text-muted fw-medium">
                          {index + 1}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-column">
                          <span className="fw-medium text-dark">
                            {branch.name}
                          </span>
                          {branch.description && (
                            <small className="text-muted">
                              {branch.description}
                            </small>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="text-dark">
                          {typeof branch.companyId === "object"
                            ? branch.companyId.name
                            : ""}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {typeof branch.brandId === "object"
                            ? branch.brandId.name
                            : ""}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-column">
                          <span className="fw-medium text-dark">
                            {typeof branch.municipalityId === "object"
                              ? branch.municipalityId.name
                              : ""}
                            ,{" "}
                            {typeof branch.stateId === "object"
                              ? branch.stateId.name
                              : ""}
                          </span>
                          <small className="text-muted">
                            {typeof branch.countryId === "object"
                              ? branch.countryId.name
                              : ""}
                          </small>
                          {branch.address && (
                            <small className="text-muted">
                              {branch.address.length > 30
                                ? `${branch.address.substring(0, 30)}...`
                                : branch.address}
                            </small>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <div className="d-flex flex-column">
                          <span className="text-dark">{branch.phone}</span>
                          <small className="text-muted">{branch.email}</small>
                        </div>
                      </td>
                      <td className="text-center">
                        <span
                          className={`badge fs-6 ${
                            branch.isActive
                              ? "bg-success bg-opacity-10 text-success"
                              : "bg-danger bg-opacity-10 text-danger"
                          }`}
                        >
                          {branch.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="text-center">
                        <span>
                          {new Date(branch.createdAt).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <BranchModal
                            mode="edit"
                            editingSucursal={branch as any}
                            onSucursalSaved={handleSucursalSaved}
                          />

                          <button
                            className="btn btn-light btn-icon btn-sm rounded-circle"
                            title={
                              isSucursalActive(branch._id)
                                ? "Desactivar sucursal"
                                : "Activar sucursal"
                            }
                            onClick={() => handleToggleSucursal(branch)}
                          >
                            {isSucursalActive(branch._id) ? (
                              <FiTrash2 size={16} />
                            ) : (
                              <BsCheck2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            {!loading && filteredBranches.length === 0 && (
              <div className="text-center py-5">
                <FileText size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No se encontraron sucursales</h5>
                <p className="text-muted">
                  {searchTerm || selectedType !== "todos"
                    ? "Intenta cambiar los filtros de búsqueda"
                    : "No hay sucursales disponibles en el sistema"}
                </p>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <span className="text-muted">
                Mostrando {branches.length} de {pagination.total} registros
              </span>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Anterior
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        className={`btn btn-sm ${
                          pagination.page === pageNum
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchPage;
