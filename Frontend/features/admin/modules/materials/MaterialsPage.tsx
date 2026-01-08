"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Form, InputGroup, Spinner } from "react-bootstrap";
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { materialsService } from "./services/materials";
import { Material, MaterialFilters } from "./types";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { branchesService } from "../branches/services/branches";
import { Branch } from "../branches/types";

const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [branchId, setBranchId] = useState<string | null>(null);
  const [managerBranch, setManagerBranch] = useState<Branch | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  const router = useRouter();
  
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
        console.log("🔍 [Materials] Sucursal del gerente cargada:", branch.branchName);
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
      console.log("🔍 [Materials] Usando sucursal activa del admin:", activeBranch.branchName);
    }
  }, [isManager, isAdmin, activeBranch]);

  const loadMaterials = async (isInitial: boolean, page: number = pagination.page) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: MaterialFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.name = searchTerm;
      }

      if (statusFilter) {
        filters.status = statusFilter === "true";
      }

      const response = await materialsService.getAllMaterials(filters);

      if (response.data) {
        setMaterials(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los materiales");
      console.error("Error loading materials:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadMaterials(true, page);
  };

  const handleNewMaterial = () => {
    // Para gerentes, verificar que tienen una sucursal asignada
    if (isManager && !branchId) {
      toast.error("No se encontró una sucursal asignada para el gerente");
      return;
    }
    
    // Pasar el branchId como query param si es gerente
    if (isManager && branchId) {
      router.push(`/catalogos/materiales/nuevo?branchId=${branchId}`);
    } else {
      router.push("/catalogos/materiales/nuevo");
    }
  };

  const handleEditMaterial = (materialId: string) => {
    // Pasar el branchId como query param si es gerente
    if (isManager && branchId) {
      router.push(`/catalogos/materiales/${materialId}?branchId=${branchId}`);
    } else {
      router.push(`/catalogos/materiales/${materialId}`);
    }
  };

  const handleToggleStatus = async (material: Material) => {
    try {
      await materialsService.updateMaterialStatus(material._id, !material.status);
      toast.success(`Material ${!material.status ? "activado" : "desactivado"} exitosamente`);
      loadMaterials(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del material");
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm("¿Estás seguro de eliminar este material?")) return;

    try {
      await materialsService.deleteMaterial(materialId);
      toast.success("Material eliminado exitosamente");
      loadMaterials(false);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el material");
    }
  };

  return (
    <div className="container-fluid py-2">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h2 className="mb-1 fw-bold">Materiales</h2>
          <p className="text-muted mb-0">
            Gestiona los materiales del catálogo
            {isManager && managerBranch && (
              <span className="ms-2 badge bg-info">Sucursal: {managerBranch.branchName}</span>
            )}
          </p>
        </div>
        {/* Mostrar botón de nuevo material para Admin y Gerente */}
        {(isAdmin || isManager) && (
          <Button
            variant="primary"
            onClick={handleNewMaterial}
            className="d-flex align-items-center gap-2 px-4"
          >
            <Plus size={20} />
            Nuevo Material
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-2" style={{ borderRadius: "10px" }}>
        <div className="card-body p-2">
          <div className="row g-2">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre..."
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
      <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Cargando materiales...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-2 py-2 fw-semibold text-muted">No.</th>
                    <th className="px-2 py-2 fw-semibold text-muted">NOMBRE</th>
                    <th className="px-2 py-2 fw-semibold text-muted">UNIDAD</th>
                    <th className="px-2 py-2 fw-semibold text-muted">COSTO</th>
                    <th className="px-2 py-2 fw-semibold text-muted">PRECIO</th>
                    <th className="px-2 py-2 fw-semibold text-muted">DESCRIPCIÓN</th>
                    <th className="px-2 py-2 fw-semibold text-muted">ESTATUS</th>
                    <th className="px-2 py-2 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No se encontraron materiales
                      </td>
                    </tr>
                  ) : (
                    materials.map((material, index) => (
                      <tr key={material._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-2 py-2">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                        <td className="px-2 py-2 fw-semibold">{material.name}</td>
                        <td className="px-2 py-2">{material.unit?.name || "N/A"}</td>
                        <td className="px-2 py-2">${material.cost.toFixed(2)}</td>
                        <td className="px-2 py-2 fw-semibold text-success">${material.price.toFixed(2)}</td>
                        <td className="px-2 py-2 text-muted" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {material.description || "Sin descripción"}
                        </td>
                        <td className="px-2 py-2">
                          <Badge
                            bg={material.status ? "success" : "danger"}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {material.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-2 py-2">
                          <div className="d-flex justify-content-center gap-2">
                            {(isAdmin || isManager) && (
                              <>
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => handleEditMaterial(material._id)}
                                  className="border-0"
                                  style={{ borderRadius: "8px" }}
                                  title="Editar"
                                >
                                  <Edit size={16} className="text-warning" />
                                </Button>
                                <Button
                                  variant="light"
                                  size="sm"
                                  onClick={() => handleDelete(material._id)}
                                  className="border-0"
                                  style={{ borderRadius: "8px" }}
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} className="text-danger" />
                                </Button>
                              </>
                            )}
                            {!isAdmin && !isManager && (
                              <span className="text-muted">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && materials.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-2 py-2 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} materiales
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

export default MaterialsPage;
