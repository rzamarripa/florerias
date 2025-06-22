"use client";

import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Form, Table, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import DepartmentModal from "./components/DepartmentModal";
import Actions from "./components/Actions";
import { departmentService } from "./services/departments";
import { Department, DepartmentSearchParams } from "./types";

const DepartmentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadDepartments = useCallback(
    async (isInitial: boolean, params?: Partial<DepartmentSearchParams>) => {
      try {
        if (isInitial) {
          setLoading(true);
        }
        const searchParams: DepartmentSearchParams = {
          page: params?.page || pagination.page,
          limit: params?.limit || pagination.limit,
          search: searchTerm.trim() || undefined,
        };

        const response = await departmentService.getAll(searchParams);
        if (response.success && Array.isArray(response.data)) {
          setDepartments(response.data);
          if (response.pagination) {
            setPagination(response.pagination);
          }
        } else {
          toast.error("Error al cargar los departamentos");
        }
      } catch (error: any) {
        toast.error(error.message || "Error al cargar los departamentos");
        console.error("Error loading departments:", error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, searchTerm]
  );

  useEffect(() => {
    loadDepartments(true);
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      loadDepartments(false, { page: 1 });
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    loadDepartments(false, { page: newPage });
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
                  placeholder="Buscar departamentos..."
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
              <DepartmentModal
                mode="create"
                onDepartmentSaved={() => loadDepartments(false)}
                buttonProps={{
                  className: "d-flex align-items-center gap-2 text-nowrap px-3"
                }}
              />
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center my-5">
                <FileText size={48} className="text-muted mb-2" />
                <p className="text-muted">No hay departamentos registrados</p>
              </div>
            ) : (
              <>
                <Table className="table table-custom table-centered table-hover w-100 mb-0">
                  <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                    <tr>
                      <th className="text-center">#</th>
                      <th>Nombre</th>
                      <th className="text-center">Estatus</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((department, index) => (
                      <tr key={department._id}>
                        <td className="text-center">
                          <span className="text-muted">
                            {(pagination.page - 1) * pagination.limit + index + 1}
                          </span>
                        </td>
                        <td>
                          <span className="fw-medium">{department.name}</span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge fs-6 ${department.isActive
                              ? "bg-success bg-opacity-10 text-success"
                              : "bg-danger bg-opacity-10 text-danger"
                              }`}
                          >
                            {department.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="text-center">
                          <Actions
                            department={department}
                            onDepartmentSaved={() => loadDepartments(false)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <span className="text-muted">
                    Mostrando {departments.length} de {pagination.total} registros
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

export default DepartmentsPage; 