"use client";

import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Form, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import ExpenseConceptCategoryModal from "./components/ExpenseConceptCategoryModal";
import ExpenseConceptCategoryActions from "./components/ExpenseConceptCategoryActions";
import {
  ExpenseConceptCategorySearchParams,
  expenseConceptCategoryService,
} from "./services/expenseConceptCategories";
import { ExpenseConceptCategory } from "./types";

const ExpenseConceptCategoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [categories, setCategories] = useState<ExpenseConceptCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadCategories = useCallback(
    async (
      isInitial: boolean = false,
      params?: Partial<ExpenseConceptCategorySearchParams>
    ) => {
      try {
        if (isInitial) setLoading(true);
        const page = params?.page || pagination.page;
        const limit = params?.limit || pagination.limit;
        const searchParams: ExpenseConceptCategorySearchParams = {
          page,
          limit,
          search: searchTerm.trim() || undefined,
          isActive:
            selectedType === "todos"
              ? undefined
              : selectedType === "activos"
                ? "true"
                : "false",
          ...params,
        };

        const response = await expenseConceptCategoryService.getAll(
          searchParams
        );
        if (response.success) {
          setCategories(response.data);
          if (response.pagination) {
            setPagination(response.pagination);
          }
        } else {
          toast.error("Error al cargar las categorías");
        }
      } catch (error: any) {
        toast.error(error.message || "Error al cargar las categorías");
        console.error("Error loading categories:", error);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [pagination.page, pagination.limit, searchTerm, selectedType]
  );

  useEffect(() => {
    loadCategories(true);
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(
      () => {
        loadCategories(false, { page: 1 });
      },
      searchTerm ? 500 : 0
    );

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm, selectedType]);

  const handlePageChange = (newPage: number) => {
    loadCategories(false, { page: newPage, limit: pagination.limit });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedType(e.target.value);
  };

  const handleCategorySaved = () => {
    loadCategories(false, { page: pagination.page, limit: pagination.limit });
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
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
              <div className="d-flex gap-2">
                <div className="position-relative" style={{ maxWidth: 400 }}>
                  <Form.Control
                    type="search"
                    placeholder="Buscar categorías..."
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
                  disabled={loading}
                >
                  <option value="todos">Todas las categorías</option>
                  <option value="activos">Categorías activas</option>
                  <option value="inactivos">Categorías inactivas</option>
                </Form.Select>

                <ExpenseConceptCategoryModal
                  mode="create"
                  onCategoriaSaved={handleCategorySaved}
                />
              </div>
            </div>

            <div className="table-responsive shadow-sm">
              {loading ? (
                <div className="text-center my-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center my-5">
                  <FileText size={48} className="text-muted mb-2" />
                  <p className="text-muted">No hay categorías registradas</p>
                </div>
              ) : (
                <>
                  <Table className="table table-custom table-centered table-select table-hover w-100 mb-0">
                    <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                      <tr>
                        <th className="text-center">#</th>
                        <th>Nombre</th>
                        <th className="text-center">Estatus</th>
                        <th className="text-center text-nowrap">Fecha creación</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category, index) => (
                        <tr key={category._id}>
                          <td className="text-center">
                            <span className="text-muted">
                              {(pagination.page - 1) * pagination.limit + index + 1}
                            </span>
                          </td>
                          <td>
                            <span className="fw-medium">{category.name}</span>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge fs-6 ${category.isActive
                                ? "bg-success bg-opacity-10 text-success"
                                : "bg-danger bg-opacity-10 text-danger"
                                }`}
                            >
                              {category.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="text-center">
                            <span>
                              {new Date(category.createdAt).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="text-center">
                            <ExpenseConceptCategoryActions
                              categoria={category}
                              onCategoriaSaved={handleCategorySaved}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div className="d-flex justify-content-between align-items-center p-3 border-top">
                    <span className="text-muted">
                      Mostrando {categories.length} de {pagination.total} registros
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
                                ? 'btn-primary'
                                : 'btn-outline-secondary'
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
    </div>
  );
};

export default ExpenseConceptCategoryPage;
