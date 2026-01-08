"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Form, InputGroup, Spinner } from "react-bootstrap";
import { Plus, Search, ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { toast } from "react-toastify";
import { stageCatalogsService } from "./services/stageCatalogs";
import { StageCatalog, RGBColor } from "./types";
import StageCatalogActions from "./components/StageCatalogActions";
import StageCatalogModal from "./components/StageCatalogModal";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { branchesService } from "../branches/services/branches";
import { Branch } from "../branches/types";

const StageCatalogsPage: React.FC = () => {
  const [stages, setStages] = useState<StageCatalog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedStage, setSelectedStage] = useState<StageCatalog | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [managerBranch, setManagerBranch] = useState<Branch | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  
  const { hasRole } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();
  const isManager = hasRole("Gerente");
  const isAdmin = hasRole("Administrador") || hasRole("Admin") || hasRole("Super Admin");

  // Cargar sucursal del gerente si aplica
  const loadManagerBranch = async () => {
    try {
      const response = await branchesService.getUserBranches();
      if (response.success && response.data && response.data.length > 0) {
        const branch = response.data[0]; // El gerente solo debe tener una sucursal
        setManagerBranch(branch);
        setBranchId(branch._id);
        console.log("🔍 [StageCatalogs] Sucursal del gerente cargada:", branch.branchName);
      } else {
        toast.error("No se encontró una sucursal asignada para el gerente");
      }
    } catch (error: any) {
      console.error("Error al cargar sucursal del gerente:", error);
      toast.error(error.message || "Error al cargar la sucursal del gerente");
    }
  };

  // Determinar el branchId según el rol del usuario
  useEffect(() => {
    if (isManager) {
      loadManagerBranch();
    } else if (isAdmin && activeBranch) {
      setBranchId(activeBranch._id);
      console.log("🔍 [StageCatalogs] Usando sucursal activa del admin:", activeBranch.branchName);
    }
  }, [isManager, isAdmin, activeBranch]);

  const loadStages = async (isInitial: boolean, page: number = pagination.page) => {
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

      const response = await stageCatalogsService.getAllStageCatalogs(filters);

      if (response.data) {
        setStages(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las etapas");
      console.error("Error loading stages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStages(true, 1);
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadStages(true, page);
  };

  const handleNewStage = () => {
    setSelectedStage(null);
    setShowModal(true);
  };

  const handleEditStage = (stage: StageCatalog) => {
    setSelectedStage(stage);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStage(null);
  };

  const handleStageUpdated = () => {
    loadStages(false);
  };

  const rgbaToString = (color: RGBColor): string => {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a || 1})`;
  };

  return (
    <div className="container-fluid py-2">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h2 className="mb-1 fw-bold">Catálogo de Etapas</h2>
          <p className="text-muted mb-0">
            Gestiona las etapas de tu empresa
            {isManager && managerBranch && (
              <span className="ms-2 badge bg-info">Sucursal: {managerBranch.branchName}</span>
            )}
          </p>
        </div>
        {/* Mostrar botón de nueva etapa para Admin y Gerente */}
        {(isAdmin || isManager) && (
          <Button
            variant="primary"
            onClick={handleNewStage}
            className="d-flex align-items-center gap-2 px-4"
          >
            <Plus size={20} />
            Nueva Etapa
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-2" style={{ borderRadius: "10px" }}>
        <div className="card-body p-2">
          <div className="row g-2">
            <div className="col-md-12">
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre o abreviación..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border-0 bg-light"
                  style={{ borderRadius: "0 10px 10px 0" }}
                />
              </InputGroup>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Cargando etapas...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-2 py-2 fw-semibold text-muted">#</th>
                    <th className="px-2 py-2 fw-semibold text-muted">NÚMERO</th>
                    <th className="px-2 py-2 fw-semibold text-muted">NOMBRE</th>
                    <th className="px-2 py-2 fw-semibold text-muted">ABREVIACIÓN</th>
                    <th className="px-2 py-2 fw-semibold text-muted">TIPO TABLERO</th>
                    <th className="px-2 py-2 fw-semibold text-muted">COLOR</th>
                    <th className="px-2 py-2 fw-semibold text-muted">EMPRESA</th>
                    <th className="px-2 py-2 fw-semibold text-muted">ESTADO</th>
                    <th className="px-2 py-2 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        <PackageSearch size={48} className="mb-3 opacity-50" />
                        <p className="mb-0">No se encontraron etapas</p>
                      </td>
                    </tr>
                  ) : (
                    stages.map((stage, index) => (
                      <tr key={stage._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-2 py-2">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-2 py-2">
                          <Badge
                            bg="secondary"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "600",
                              fontSize: "14px",
                            }}
                          >
                            {stage.stageNumber}
                          </Badge>
                        </td>
                        <td className="px-2 py-2 fw-semibold">{stage.name}</td>
                        <td className="px-2 py-2">
                          <Badge
                            bg="light"
                            text="dark"
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontWeight: "600",
                              border: "1px solid #dee2e6",
                            }}
                          >
                            {stage.abreviation}
                          </Badge>
                        </td>
                        <td className="px-2 py-2">
                          <Badge
                            bg={stage.boardType === "Produccion" ? "info" : "warning"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {stage.boardType === "Produccion" ? "Producción" : "Envío"}
                          </Badge>
                        </td>
                        <td className="px-2 py-2">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "6px",
                                backgroundColor: rgbaToString(stage.color),
                                border: "2px solid #dee2e6",
                              }}
                            />
                            <small className="text-muted">
                              RGB({stage.color.r}, {stage.color.g}, {stage.color.b})
                            </small>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div>
                            <div className="fw-semibold">{stage.company.legalName}</div>
                            {stage.company.tradeName && (
                              <small className="text-muted">{stage.company.tradeName}</small>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <Badge
                            bg={stage.isActive ? "success" : "danger"}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {stage.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-2 py-2">
                          {(isAdmin || isManager) ? (
                            <StageCatalogActions
                              stage={stage}
                              onEdit={handleEditStage}
                              onStageUpdated={handleStageUpdated}
                            />
                          ) : (
                            <div className="text-center">
                              <span className="text-muted">-</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && stages.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-2 py-2 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} etapas
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

      {/* Stage Modal */}
      <StageCatalogModal
        show={showModal}
        onHide={handleCloseModal}
        onSuccess={handleStageUpdated}
        stage={selectedStage}
      />
    </div>
  );
};

export default StageCatalogsPage;
