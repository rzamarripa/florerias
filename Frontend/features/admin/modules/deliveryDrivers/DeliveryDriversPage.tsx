"use client";

import { Search, ChevronLeft, ChevronRight, Truck, Loader2, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { deliveryDriversService } from "./services/deliveryDrivers";
import {
  DeliveryDriver,
  DeliveryDriverFilters,
  CreateDeliveryDriverData,
  UpdateDeliveryDriverData,
} from "./types";
import Actions from "./components/Actions";
import DeliveryDriverModal from "./components/DeliveryDriverModal";

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
import { useUserRoleStore } from "@/stores/userRoleStore";

const DeliveryDriversPage: React.FC = () => {
  const { getIsAdmin, getIsManager } = useUserRoleStore();
  const isAdminOrManager = getIsAdmin() || getIsManager();

  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedDriver, setSelectedDriver] = useState<DeliveryDriver | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadDeliveryDrivers = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: DeliveryDriverFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (statusFilter) {
        filters.estatus = statusFilter === "true";
      }

      const response = await deliveryDriversService.getAllDeliveryDrivers(filters);

      if (response.data) {
        setDrivers(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los repartidores");
      console.error("Error loading delivery drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryDrivers(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value);
  };

  const handlePageChange = (page: number) => {
    loadDeliveryDrivers(true, page);
  };

  const handleCreateDriver = () => {
    setSelectedDriver(null);
    setShowModal(true);
  };

  const handleEditDriver = (driver: DeliveryDriver) => {
    setSelectedDriver(driver);
    setShowModal(true);
  };

  const handleToggleStatus = async (driver: DeliveryDriver) => {
    try {
      if (driver.profile.estatus) {
        await deliveryDriversService.deactivateDeliveryDriver(driver._id);
        toast.success("Repartidor desactivado exitosamente");
      } else {
        await deliveryDriversService.activateDeliveryDriver(driver._id);
        toast.success("Repartidor activado exitosamente");
      }
      loadDeliveryDrivers(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del repartidor");
    }
  };

  const handleSaveDriver = async (
    data: CreateDeliveryDriverData | UpdateDeliveryDriverData
  ) => {
    try {
      setModalLoading(true);
      if (selectedDriver) {
        await deliveryDriversService.updateDeliveryDriver(selectedDriver._id, data as UpdateDeliveryDriverData);
        toast.success("Repartidor actualizado exitosamente");
      } else {
        await deliveryDriversService.createDeliveryDriver(data as CreateDeliveryDriverData);
        toast.success("Repartidor creado exitosamente");
      }
      setShowModal(false);
      setSelectedDriver(null);
      loadDeliveryDrivers(false);
    } catch (error: any) {
      toast.error(error.message || `Error al ${selectedDriver ? "actualizar" : "crear"} el repartidor`);
    } finally {
      setModalLoading(false);
    }
  };

  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(pages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push("...", pages);
    } else if (pages > 1) {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
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
        title="Repartidores"
        description="Gestiona los repartidores del sistema"
      >
        {isAdminOrManager && (
          <Button onClick={handleCreateDriver}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Repartidor
          </Button>
        )}
      </PageHeader>

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar repartidores..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => handleStatusFilterChange(value === "all" ? "" : value)}
            >
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
              <p className="text-muted-foreground mt-3">Cargando repartidores...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <div>No se encontraron repartidores</div>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    drivers.map((driver, index) => (
                      <TableRow key={driver._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{driver.profile.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(driver.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">@{driver.username}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[200px]">{driver.email}</div>
                        </TableCell>
                        <TableCell>{driver.phone}</TableCell>
                        <TableCell>
                          {driver.branch ? (
                            <div>
                              <div className="font-medium">{driver.branch.branchName}</div>
                              <div className="text-sm text-muted-foreground">
                                {driver.branch.branchCode}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin sucursal</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={driver.profile.estatus ? "default" : "destructive"}>
                            {driver.profile.estatus ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Actions
                            driver={driver}
                            onEdit={handleEditDriver}
                            onToggleStatus={handleToggleStatus}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {drivers.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {drivers.length} de {pagination.total} registros
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

      <DeliveryDriverModal
        show={showModal}
        onHide={() => setShowModal(false)}
        driver={selectedDriver}
        onSave={handleSaveDriver}
        loading={modalLoading}
      />
    </div>
  );
};

export default DeliveryDriversPage;