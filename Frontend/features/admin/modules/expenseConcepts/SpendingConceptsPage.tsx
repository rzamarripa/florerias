"use client";

import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Form, Table, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import ExpenseConceptModal from "./components/ExpenseConceptModal";
import ExpenseConceptActions from "./components/ExpenseConceptActions";
import { expenseConceptService } from "./services/expenseConcepts";
import { expenseConceptCategoryService } from "../expenseConceptCategories/services/expenseConceptCategories";
import { departmentService } from "../departments/services/departments";
import { ExpenseConcept, ExpenseConceptSearchParams } from "./types";
import { ExpenseConceptCategory } from "../expenseConceptCategories/types";
import { Department } from "../departments/types";

const ExpenseConceptsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [concepts, setConcepts] = useState<ExpenseConcept[]>([]);
  const [categories, setCategories] = useState<ExpenseConceptCategory[]>([]);
  const [departments, setDepartments] = useState<Pick<Department, '_id' | 'name'>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const response = await expenseConceptCategoryService.getAll({ isActive: "true" });
      if (response.success) {
        setCategories(response.data);
      } else {
        toast.error("Error al cargar las categorías");
      }
    } catch (error: any) {
      toast.error("Error al cargar las categorías");
      console.error("Error loading categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await departmentService.getActive();
      if (response.success) {
        setDepartments(response.data as unknown as Pick<Department, '_id' | 'name'>[]);
      } else {
        toast.error("Error al cargar los departamentos");
      }
    } catch (error: any) {
      toast.error("Error al cargar los departamentos");
      console.error("Error loading departments:", error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadConcepts = useCallback(
    async (isInitial: boolean, params?: Partial<ExpenseConceptSearchParams>) => {
      try {
        if (isInitial) {
          setLoading(true);
        }
        const searchParams: ExpenseConceptSearchParams = {
          page: params?.page || pagination.page,
          limit: params?.limit || pagination.limit,
          search: searchTerm.trim() || undefined,
          categoryId: selectedCategory || undefined,
          departmentId: selectedDepartment || undefined,
        };

        const response = await expenseConceptService.getAll(searchParams);
        if (response.success && Array.isArray(response.data)) {
          setConcepts(response.data);
          if (response.pagination) {
            setPagination(response.pagination);
          }
        } else {
          toast.error("Error al cargar los conceptos de gastos");
        }
      } catch (error: any) {
        toast.error(error.message || "Error al cargar los conceptos de gastos");
        console.error("Error loading expense concepts:", error);
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit, searchTerm, selectedCategory, selectedDepartment]
  );

  useEffect(() => {
    loadCategories();
    loadDepartments();
    loadConcepts(true);
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      loadConcepts(false, { page: 1 });
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTerm, selectedCategory, selectedDepartment]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedCategory(e.target.value);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedDepartment(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    loadConcepts(false, { page: newPage });
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
                  placeholder="Buscar conceptos de gastos..."
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
                value={selectedCategory}
                onChange={handleCategoryChange}
                style={{ minWidth: "200px" }}
                disabled={loadingCategories}
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Select
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                style={{ minWidth: "200px" }}
                disabled={loadingDepartments}
              >
                <option value="">Todos los departamentos</option>
                {departments.map((department) => (
                  <option key={department._id} value={department._id}>
                    {department.name}
                  </option>
                ))}
              </Form.Select>

              <ExpenseConceptModal
                mode="create"
                onConceptoSaved={() => loadConcepts(false)}
              />
            </div>
          </div>

          <div className="table-responsive shadow-sm">
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : concepts.length === 0 ? (
              <div className="text-center my-5">
                <FileText size={48} className="text-muted mb-2" />
                <p className="text-muted">No hay conceptos de gastos registrados</p>
              </div>
            ) : (
              <>
                <Table className="table table-custom table-centered table-hover w-100 mb-0">
                  <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                    <tr>
                      <th className="text-center">#</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Categoría</th>
                      <th>Departamento</th>
                      <th className="text-center">Estatus</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {concepts.map((concept, index) => (
                      <tr key={concept._id}>
                        <td className="text-center">
                          <span className="text-muted">
                            {(pagination.page - 1) * pagination.limit + index + 1}
                          </span>
                        </td>
                        <td>
                          <span className="fw-medium">{concept.name}</span>
                        </td>
                        <td>
                          <span className="text-muted">
                            {concept.description.length > 50
                              ? `${concept.description.substring(0, 50)}...`
                              : concept.description}
                          </span>
                        </td>
                        <td>
                          <span className="fw-medium">{concept.categoryId.name}</span>
                        </td>
                        <td>
                          <span className="fw-medium">{concept.departmentId?.name || '-'}</span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge fs-6 ${concept.isActive
                              ? "bg-success bg-opacity-10 text-success"
                              : "bg-danger bg-opacity-10 text-danger"
                              }`}
                          >
                            {concept.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="text-center">
                          <ExpenseConceptActions
                            concepto={concept}
                            onConceptoUpdated={() => loadConcepts(false)}
                            onConceptoDeleted={() => loadConcepts(false)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <span className="text-muted">
                    Mostrando {concepts.length} de {pagination.total} registros
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

export default ExpenseConceptsPage;
