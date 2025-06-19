"use client";

import { FileText, Search } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Form, Table, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import DepartmentModal from "./components/DepartmentModal";
import Actions from "./components/Actions";
import { departmentService } from "./services/departments";
import { brandsService } from "../brands/services/brands";
import { Department, DepartmentSearchParams } from "./types";
import { Brand } from "../brands/types";

const DepartmentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingBrands, setLoadingBrands] = useState<boolean>(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadBrands = useCallback(async () => {
    try {
      setLoadingBrands(true);
      const response = await brandsService.getAll();
      if (response.success) {
        setBrands(response.data.filter(brand => brand.isActive));
      } else {
        toast.error("Error al cargar las marcas");
      }
    } catch (error: any) {
      toast.error("Error al cargar las marcas");
      console.error("Error loading brands:", error);
    } finally {
      setLoadingBrands(false);
    }
  }, []);

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
          brandId: selectedBrand || undefined,
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
    [pagination.page, pagination.limit, searchTerm, selectedBrand]
  );

  useEffect(() => {
    loadBrands();
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
  }, [searchTerm, selectedBrand]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedBrand(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    loadDepartments(false, { page: newPage });
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
              <Form.Select
                value={selectedBrand}
                onChange={handleBrandChange}
                style={{ minWidth: "200px" }}
                disabled={loadingBrands}
              >
                <option value="">Todas las marcas</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </Form.Select>

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
                      <th>Marca</th>
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
                        <td>
                          <span className="fw-medium">{department.brandId.name}</span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge fs-6 ${
                              department.isActive
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsPage; 