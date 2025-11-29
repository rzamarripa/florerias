"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Form, InputGroup, Spinner } from "react-bootstrap";
import { Plus, Search, ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { toast } from "react-toastify";
import { expenseConceptsService } from "./services/expenseConcepts";
import { branchesService } from "../branches/services/branches";
import { ExpenseConcept } from "./types";
import ExpenseConceptActions from "./components/ExpenseConceptActions";
import ExpenseConceptModal from "./components/ExpenseConceptModal";

const DEPARTMENT_LABELS: Record<string, string> = {
  sales: "Ventas",
  administration: "Administración",
  operations: "Operaciones",
  marketing: "Marketing",
  finance: "Finanzas",
  human_resources: "Recursos Humanos",
  other: "Otro",
};

const ExpenseConceptsPage: React.FC = () => {
  const [concepts, setConcepts] = useState<ExpenseConcept[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [branches, setBranches] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedConcept, setSelectedConcept] = useState<ExpenseConcept | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadConcepts = async (isInitial: boolean, page: number = pagination.page) => {
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

      if (branchFilter) {
        filters.branch = branchFilter;
      }

      const response = await expenseConceptsService.getAllExpenseConcepts(filters);

      if (response.data) {
        setConcepts(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los conceptos");
      console.error("Error loading concepts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await branchesService.getUserBranches();
      if (response.data) {
        setBranches(response.data);
      }
    } catch (error: any) {
      console.error("Error loading branches:", error);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadConcepts(true, 1);
  }, [searchTerm, branchFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleBranchFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setBranchFilter(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadConcepts(true, page);
  };

  const handleNewConcept = () => {
    setSelectedConcept(null);
    setShowModal(true);
  };

  const handleEditConcept = (concept: ExpenseConcept) => {
    setSelectedConcept(concept);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedConcept(null);
  };

  const handleConceptUpdated = () => {
    loadConcepts(false);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Conceptos de Gastos</h2>
          <p className="text-muted mb-0">Gestiona los conceptos de gastos del sistema</p>
        </div>
        <Button
          variant="primary"
          onClick={handleNewConcept}
          className="d-flex align-items-center gap-2 px-4"
        >
          <Plus size={20} />
          Nuevo Concepto
        </Button>
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
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border-0 bg-light"
                  style={{ borderRadius: "0 10px 10px 0" }}
                />
              </InputGroup>
            </div>
            <div className="col-md-6">
              <Form.Select
                value={branchFilter}
                onChange={handleBranchFilterChange}
                className="border-0 bg-light"
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todas las sucursales</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.branchName} {branch.branchCode ? `- ${branch.branchCode}` : ""}
                  </option>
                ))}
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
              <p className="text-muted mt-3">Cargando conceptos...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">#</th>
                    <th className="px-4 py-3 fw-semibold text-muted">NOMBRE</th>
                    <th className="px-4 py-3 fw-semibold text-muted">DESCRIPCIÓN</th>
                    <th className="px-4 py-3 fw-semibold text-muted">DEPARTAMENTO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">SUCURSAL</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ESTADO</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {concepts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <PackageSearch size={48} className="mb-3 opacity-50" />
                        <p className="mb-0">No se encontraron conceptos de gastos</p>
                      </td>
                    </tr>
                  ) : (
                    concepts.map((concept, index) => (
                      <tr key={concept._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-4 py-3 fw-semibold">{concept.name}</td>
                        <td className="px-4 py-3">
                          {concept.description || (
                            <span className="text-muted fst-italic">Sin descripción</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            bg="info"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {DEPARTMENT_LABELS[concept.department] || concept.department}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="fw-semibold">{concept.branch.branchName}</div>
                            {concept.branch.branchCode && (
                              <small className="text-muted">{concept.branch.branchCode}</small>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            bg={concept.isActive ? "success" : "danger"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {concept.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <ExpenseConceptActions
                            concept={concept}
                            onEdit={handleEditConcept}
                            onConceptUpdated={handleConceptUpdated}
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
          {!loading && concepts.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} conceptos
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

      {/* Concept Modal */}
      <ExpenseConceptModal
        show={showModal}
        onHide={handleCloseModal}
        onSuccess={handleConceptUpdated}
        concept={selectedConcept}
      />
    </div>
  );
};

export default ExpenseConceptsPage;
