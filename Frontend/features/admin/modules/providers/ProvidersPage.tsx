"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, PackageSearch, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { providersService } from "./services/providers";
import { Provider } from "./types";
import ProviderActions from "./components/ProviderActions";
import ProviderForm from "./components/ProviderForm";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { companiesService } from "../companies/services/companies";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

const ProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [userCompany, setUserCompany] = useState<{ _id: string; legalName: string; tradeName?: string; rfc: string } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const { getIsAdmin, getIsManager, getIsSuperAdmin } = useUserRoleStore();
  const isAdminOrManager = getIsAdmin() || getIsManager();
  const isSuperAdmin = getIsSuperAdmin();

  const loadProviders = async (isInitial: boolean, page: number = pagination.page) => {
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

      const response = await providersService.getAllProviders(filters);

      if (response.data) {
        setProviders(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los proveedores");
      console.error("Error loading providers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar empresa del usuario al montar el componente
  useEffect(() => {
    if (isAdminOrManager) {
      loadUserCompany();
    }
  }, [isAdminOrManager]);

  useEffect(() => {
    loadProviders(true, 1);
  }, [searchTerm, statusFilter]);

  const loadUserCompany = async () => {
    try {
      const response = await companiesService.getUserCompany();
      if (response.success && response.data) {
        setUserCompany(response.data);
      }
    } catch (error: any) {
      console.error("Error loading user company:", error);
      // No mostrar error al usuario, es solo informativo
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value);
  };

  const handlePageChange = (page: number) => {
    loadProviders(true, page);
  };

  const handleNewProvider = () => {
    setSelectedProvider(null);
    setShowModal(true);
  };

  const handleEditProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProvider(null);
  };

  const handleProviderUpdated = () => {
    loadProviders(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Proveedores"
        description="Gestiona los proveedores del sistema"
        action={{
          label: "Nuevo Proveedor",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleNewProvider,
        }}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre comercial, fiscal, RFC o contacto..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter || "all"} onValueChange={(value) => handleStatusFilterChange(value === "all" ? "" : value)}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Company Info Banner for Admin/Manager */}
      {isAdminOrManager && userCompany && (
        <Alert>
          <Building2 className="h-5 w-5" />
          <AlertDescription>
            <div className="font-semibold">
              {userCompany.tradeName || userCompany.legalName}
            </div>
            <div className="text-sm text-muted-foreground">
              {userCompany.rfc} - Estás viendo los proveedores de esta empresa
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando proveedores...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre Comercial</TableHead>
                    <TableHead>Nombre Fiscal</TableHead>
                    <TableHead>RFC</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <PackageSearch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <div>No se encontraron proveedores</div>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    providers.map((provider, index) => (
                      <TableRow key={provider._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{provider.tradeName}</div>
                        </TableCell>
                        <TableCell>{provider.legalName}</TableCell>
                        <TableCell>{provider.rfc}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{provider.contactName}</div>
                            <div className="text-sm text-muted-foreground">{provider.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{provider.company.legalName}</div>
                            <div className="text-sm text-muted-foreground">{provider.company.rfc}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={provider.isActive ? "default" : "destructive"}>
                            {provider.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ProviderActions
                            provider={provider}
                            onEdit={handleEditProvider}
                            onProviderUpdated={handleProviderUpdated}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {providers.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {providers.length} de {pagination.total} registros
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm px-2">
                      Página {pagination.page} de {pagination.pages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Provider Form Modal */}
      <ProviderForm
        show={showModal}
        onHide={handleCloseModal}
        onSuccess={handleProviderUpdated}
        provider={selectedProvider}
      />
    </div>
  );
};

export default ProvidersPage;
