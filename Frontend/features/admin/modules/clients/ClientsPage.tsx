"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { clientsService } from "./services/clients";
import {
  Client,
  ClientFilters,
  FilterType,
  FilterOption,
  CreateClientData,
  UpdateClientData,
} from "./types";
import { useRouter } from "next/navigation";
import ClientModal from "./components/ClientModal";
import ClientPointsDashboardModal from "./components/ClientPointsDashboardModal";
import ClientRedeemedRewardsModal from "./components/ClientRedeemedRewardsModal";
import ClientActions from "./components/ClientActions";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { branchesService } from "../branches/services/branches";
import { Branch } from "../branches/types";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const filterOptions: FilterOption[] = [
  { value: "name", label: "Nombre" },
  { value: "lastName", label: "Apellidos" },
  { value: "clientNumber", label: "Número de Cliente" },
  { value: "phoneNumber", label: "Teléfono" },
];

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<FilterType>("name");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [showPointsModal, setShowPointsModal] = useState<boolean>(false);
  const [pointsClient, setPointsClient] = useState<Client | null>(null);
  const [showRewardsModal, setShowRewardsModal] = useState<boolean>(false);
  const [rewardsClient, setRewardsClient] = useState<Client | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [managerBranch, setManagerBranch] = useState<Branch | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  const router = useRouter();
  const { user } = useUserSessionStore();
  const { activeBranch } = useActiveBranchStore();
  const { hasRole } = useUserRoleStore();
  const isManager = hasRole("Gerente");
  const isAdmin = hasRole("Administrador") || hasRole("Admin");

  const loadManagerBranch = async () => {
    try {
      const response = await branchesService.getUserBranches();
      if (response.success && response.data && response.data.length > 0) {
        const branch = response.data[0];
        setManagerBranch(branch);
        setBranchId(branch._id);
        
        // Obtener la empresa a través de la sucursal
        const companyResponse = await companiesService.getCompanyByBranchId(branch._id);
        if (companyResponse.success && companyResponse.data) {
          setCompanyId(companyResponse.data.companyId);
        }
      } else {
        toast.error("No se encontró una sucursal asignada para el gerente");
      }
    } catch (error: any) {
      console.error("Error al cargar sucursal del gerente:", error);
      toast.error(error.message || "Error al cargar la sucursal del gerente");
    }
  };

  const loadAdminCompany = async () => {
    try {
      if (!user?._id) {
        console.error("No se encontró el ID del usuario");
        return;
      }
      
      const companyResponse = await companiesService.getCompanyByAdministratorId(user._id);
      if (companyResponse.success && companyResponse.data) {
        setCompanyId(companyResponse.data._id);
      }
    } catch (error: any) {
      console.error("Error al cargar empresa del administrador:", error);
      toast.error(error.message || "Error al cargar la empresa del administrador");
    }
  };

  useEffect(() => {
    if (isManager) {
      loadManagerBranch();
    } else if (isAdmin) {
      loadAdminCompany();
      if (activeBranch) {
        setBranchId(activeBranch._id);
      }
    }
  }, [isManager, isAdmin, activeBranch]);

  const loadClients = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: ClientFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters[filterType] = searchTerm;
      }

      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter === "true";
      }

      if (companyId) {
        filters.companyId = companyId;
      }

      const response = await clientsService.getAllClients(filters);

      if (response.data) {
        setClients(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los clientes");
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadClients(true, 1);
    }
  }, [searchTerm, filterType, statusFilter, companyId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleFilterTypeChange = (value: string): void => {
    setFilterType(value as FilterType);
    setSearchTerm("");
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value);
  };

  const handlePageChange = (page: number) => {
    loadClients(true, page);
  };

  const handleViewClient = (client: Client) => {
    router.push(`/panel/clientes/${client._id}`);
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleViewPoints = (client: Client) => {
    setPointsClient(client);
    setShowPointsModal(true);
  };

  const handleViewRewards = (client: Client) => {
    setRewardsClient(client);
    setShowRewardsModal(true);
  };

  const handleSaveClient = async (
    data: CreateClientData | UpdateClientData
  ) => {
    try {
      setModalLoading(true);
      if (selectedClient) {
        await clientsService.updateClient(selectedClient._id, data);
        toast.success("Cliente actualizado exitosamente");
      } else {
        if (!companyId) {
          toast.error("No se ha encontrado la empresa para crear el cliente");
          return;
        }

        const clientData = { 
          ...data, 
          company: companyId
        } as CreateClientData;
        await clientsService.createClient(clientData);
        toast.success("Cliente creado exitosamente");
      }
      setShowModal(false);
      loadClients(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el cliente");
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Clientes"
        description="Gestiona los clientes de la sucursal"
        badge={
          managerBranch ? (
            <Badge variant="secondary">Sucursal: {managerBranch.branchName}</Badge>
          ) : activeBranch ? (
            <Badge variant="secondary">Sucursal: {activeBranch.branchName}</Badge>
          ) : undefined
        }
        action={{
          label: "Nuevo Cliente",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreateClient,
          disabled: !companyId,
        }}
      />

      {/* Warnings */}
      {!companyId && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Advertencia</AlertTitle>
          <AlertDescription>
            No se pudo determinar la empresa. Por favor, contacta al administrador.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
            <Select value={filterType} onValueChange={handleFilterTypeChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Buscar por..." />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Buscar por ${filterOptions
                  .find((opt) => opt.value === filterType)
                  ?.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando clientes...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>No. Cliente</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Puntos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead className="text-center w-12">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <div>No se encontraron clientes</div>
                        <p className="text-sm">
                          Intenta ajustar los filtros de búsqueda
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client, index) => (
                      <TableRow key={client._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                                {client.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{client.fullName}</div>
                              <div className="text-sm text-muted-foreground">
                                {client.name} {client.lastName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{client.clientNumber}</Badge>
                        </TableCell>
                        <TableCell>{client.phoneNumber}</TableCell>
                        <TableCell>
                          <div className="truncate max-w-[200px]">
                            {client.email || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.points} pts</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={client.status ? "default" : "destructive"}
                          >
                            {client.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(client.createdAt)}</TableCell>
                        <TableCell className="text-center">
                          <ClientActions
                            client={client}
                            onView={handleViewClient}
                            onEdit={handleEditClient}
                            onViewPoints={handleViewPoints}
                            onViewRewards={handleViewRewards}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {clients.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {clients.length} de {pagination.total} registros
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

      <ClientModal
        show={showModal}
        onHide={() => setShowModal(false)}
        client={selectedClient}
        onSave={handleSaveClient}
        loading={modalLoading}
      />

      <ClientPointsDashboardModal
        show={showPointsModal}
        onHide={() => setShowPointsModal(false)}
        client={pointsClient}
        branchId={branchId}
      />

      <ClientRedeemedRewardsModal
        show={showRewardsModal}
        onHide={() => setShowRewardsModal(false)}
        client={rewardsClient}
      />
    </div>
  );
};

export default ClientsPage;
