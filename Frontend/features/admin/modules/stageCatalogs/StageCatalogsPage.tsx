"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, PackageSearch, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { stageCatalogsService } from "./services/stageCatalogs";
import { StageCatalog, RGBColor } from "./types";
import StageCatalogActions from "./components/StageCatalogActions";
import StageCatalogModal from "./components/StageCatalogModal";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { branchesService } from "../branches/services/branches";
import { Branch } from "../branches/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";

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

  const loadManagerBranch = async () => {
    try {
      const response = await branchesService.getUserBranches();
      if (response.success && response.data && response.data.length > 0) {
        const branch = response.data[0];
        setManagerBranch(branch);
        setBranchId(branch._id);
      } else {
        toast.error("No se encontró una sucursal asignada para el gerente");
      }
    } catch (error: any) {
      console.error("Error al cargar sucursal del gerente:", error);
      toast.error(error.message || "Error al cargar la sucursal del gerente");
    }
  };

  useEffect(() => {
    if (isManager) {
      loadManagerBranch();
    } else if (isAdmin && activeBranch) {
      setBranchId(activeBranch._id);
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
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Catálogo de Etapas"
        description="Gestiona las etapas de tu empresa"
        badge={
          isManager && managerBranch ? (
            <Badge variant="secondary">Sucursal: {managerBranch.branchName}</Badge>
          ) : undefined
        }
        action={
          (isAdmin || isManager)
            ? {
                label: "Nueva Etapa",
                icon: <Plus className="h-4 w-4" />,
                onClick: handleNewStage,
              }
            : undefined
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre o abreviación..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando etapas...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Abreviación</TableHead>
                    <TableHead>Tipo Tablero</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <PackageSearch className="h-12 w-12 opacity-50" />
                          <p>No se encontraron etapas</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stages.map((stage, index) => (
                      <TableRow key={stage._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold">
                            {stage.stageNumber}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{stage.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{stage.abreviation}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              stage.boardType === "Produccion"
                                ? "bg-info text-info-foreground"
                                : "bg-warning text-warning-foreground"
                            }
                          >
                            {stage.boardType === "Produccion" ? "Producción" : "Envío"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-md border-2 border-border"
                              style={{
                                backgroundColor: rgbaToString(stage.color),
                              }}
                            />
                            <span className="text-sm text-muted-foreground">
                              RGB({stage.color.r}, {stage.color.g}, {stage.color.b})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{stage.company.legalName}</div>
                            {stage.company.tradeName && (
                              <p className="text-sm text-muted-foreground">
                                {stage.company.tradeName}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stage.isActive ? "default" : "destructive"}>
                            {stage.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isAdmin || isManager ? (
                            <StageCatalogActions
                              stage={stage}
                              onEdit={handleEditStage}
                              onStageUpdated={handleStageUpdated}
                            />
                          ) : (
                            <div className="text-center text-muted-foreground">-</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {stages.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                    {pagination.total} etapas
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
