"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { branchesService } from "./services/branches";
import { Branch } from "./types";
import BranchActions from "./components/BranchActions";
import BranchModal from "./components/BranchModal";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { companiesService } from "../companies/services/companies";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";

const BranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const { getUserId } = useUserSessionStore();
  const { getIsAdmin } = useUserRoleStore();
  const userId = getUserId();
  const isAdmin = getIsAdmin();

  const loadUserCompany = async () => {
    try {
      if (!userId || !isAdmin) return;
      const company = await companiesService.getMyCompany();
      setUserCompany(company || null);
    } catch (error: any) {
      console.error("Error al cargar empresa del usuario:", error);
      setUserCompany(null);
    }
  };

  const loadBranches = async (isInitial: boolean, page: number = pagination.page) => {
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

      if (statusFilter) {
        filters.isActive = statusFilter === "true";
      }

      const response = await branchesService.getAllBranches(filters);

      if (response.data) {
        setBranches(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las sucursales");
      console.error("Error loading branches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserCompany();
  }, [userId]);

  useEffect(() => {
    loadBranches(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value === "all" ? "" : value);
  };

  const handlePageChange = (page: number) => {
    loadBranches(true, page);
  };

  const handleBranchUpdated = () => {
    loadBranches(false);
  };

  const getCompanyName = (branch: Branch): string => {
    if (typeof branch.companyId === "string") {
      return "N/A";
    }
    return branch.companyId.legalName;
  };

  const getEmployeesCount = (branch: Branch): number => {
    return branch.employees?.length || 0;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Sucursales"
        description="Gestiona las sucursales del sistema"
        action={isAdmin ? {
          label: "Nueva Sucursal",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setShowCreateModal(true),
        } : undefined}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre o código de sucursal..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter || "all"}
              onValueChange={handleStatusFilterChange}
            >
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando sucursales...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>RFC</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Gerente</TableHead>
                    <TableHead>Empleados</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <div>No se encontraron sucursales</div>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    branches.map((branch, index) => (
                      <TableRow key={branch._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell className="font-semibold">{branch.branchName}</TableCell>
                        <TableCell>
                          {branch.branchCode ? (
                            <Badge variant="secondary">{branch.branchCode}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{branch.rfc}</Badge>
                        </TableCell>
                        <TableCell>{getCompanyName(branch)}</TableCell>
                        <TableCell>
                          {branch.address.city}, {branch.address.state}
                        </TableCell>
                        <TableCell>
                          {!branch.manager || typeof branch.manager === "string" ? (
                            <span className="text-muted-foreground">Sin gerente</span>
                          ) : (
                            <div>
                              <div className="font-semibold">{branch.manager.profile.fullName}</div>
                              <span className="text-sm text-muted-foreground">{branch.manager.email}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getEmployeesCount(branch)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={branch.isActive ? "default" : "destructive"}>
                            {branch.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <BranchActions
                            branch={branch}
                            onBranchUpdated={handleBranchUpdated}
                            userCompany={userCompany}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {branches.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} sucursales
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

      {/* Create Modal */}
      {isAdmin && (
        <BranchModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onBranchSaved={handleBranchUpdated}
          userCompany={userCompany}
        />
      )}
    </div>
  );
};

export default BranchesPage;
