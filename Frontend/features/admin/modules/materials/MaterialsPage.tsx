"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
        console.log("[Materials] Sucursal del gerente cargada:", branch.branchName);
      } else {
        toast.error("No se encontro una sucursal asignada para el gerente");
      }
    } catch (error: any) {
      console.error("Error al cargar sucursal del gerente:", error);
      toast.error(error.message || "Error al cargar la sucursal del gerente");
    }
  };

  // Determinar el branchId segun el rol del usuario
  useEffect(() => {
    if (isManager) {
      loadManagerBranch();
    } else if (isAdmin && activeBranch) {
      setBranchId(activeBranch._id);
      console.log("[Materials] Usando sucursal activa del admin:", activeBranch.branchName);
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

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value === "all" ? "" : value);
  };

  const handlePageChange = (page: number) => {
    loadMaterials(true, page);
  };

  const handleNewMaterial = () => {
    // Para gerentes, verificar que tienen una sucursal asignada
    if (isManager && !branchId) {
      toast.error("No se encontro una sucursal asignada para el gerente");
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
    if (!confirm("Estas seguro de eliminar este material?")) return;

    try {
      await materialsService.deleteMaterial(materialId);
      toast.success("Material eliminado exitosamente");
      loadMaterials(false);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el material");
    }
  };

  return (
    <div className="container mx-auto py-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="mb-1 font-bold text-2xl">Materiales</h2>
          <p className="text-muted-foreground mb-0">
            Gestiona los materiales del catalogo
            {isManager && managerBranch && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                Sucursal: {managerBranch.branchName}
              </Badge>
            )}
          </p>
        </div>
        {/* Mostrar boton de nuevo material para Admin y Gerente */}
        {(isAdmin || isManager) && (
          <Button
            onClick={handleNewMaterial}
            className="flex items-center gap-2 px-4"
          >
            <Plus size={20} />
            Nuevo Material
          </Button>
        )}
      </div>

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-3">Cargando materiales...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">No.</TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">NOMBRE</TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">UNIDAD</TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">COSTO</TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">PRECIO</TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">DESCRIPCION</TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground">ESTATUS</TableHead>
                    <TableHead className="px-2 py-2 font-semibold text-muted-foreground text-center">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                        No se encontraron materiales
                      </TableCell>
                    </TableRow>
                  ) : (
                    materials.map((material, index) => (
                      <TableRow key={material._id} className="border-b border-muted">
                        <TableCell className="px-2 py-2">{(pagination.page - 1) * pagination.limit + index + 1}</TableCell>
                        <TableCell className="px-2 py-2 font-semibold">{material.name}</TableCell>
                        <TableCell className="px-2 py-2">{material.unit?.name || "N/A"}</TableCell>
                        <TableCell className="px-2 py-2">${material.cost.toFixed(2)}</TableCell>
                        <TableCell className="px-2 py-2 font-semibold text-green-600">${material.price.toFixed(2)}</TableCell>
                        <TableCell className="px-2 py-2 text-muted-foreground max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {material.description || "Sin descripcion"}
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <Badge
                            variant={material.status ? "default" : "destructive"}
                            className={`px-2.5 py-0.5 rounded-xl font-medium ${material.status ? "bg-green-500 hover:bg-green-600" : ""}`}
                          >
                            {material.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div className="flex justify-center gap-2">
                            {(isAdmin || isManager) && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditMaterial(material._id)}
                                  className="border-0 rounded-lg"
                                  title="Editar"
                                >
                                  <Edit size={16} className="text-yellow-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(material._id)}
                                  className="border-0 rounded-lg"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} className="text-red-500" />
                                </Button>
                              </>
                            )}
                            {!isAdmin && !isManager && (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && materials.length > 0 && (
            <div className="flex justify-between items-center px-2 py-2 border-t">
              <p className="text-muted-foreground mb-0 text-sm">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} materiales
              </p>
              <div className="flex gap-2 items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="rounded-lg"
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-3 py-1 text-sm">
                  Pagina {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="rounded-lg"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialsPage;
