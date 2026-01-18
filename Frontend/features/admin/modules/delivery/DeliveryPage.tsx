"use client";

import { Search, ChevronLeft, ChevronRight, Plus, Truck, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { deliveryService } from "./services/delivery";
import { Delivery, DeliveryFilters, FilterType, FilterOption, CreateDeliveryData, UpdateDeliveryData } from "./types";
import Actions from "./components/Actions";
import DeliveryModal from "./components/DeliveryModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const filterOptions: FilterOption[] = [
  { value: "nombre", label: "Nombre" },
  { value: "apellidoPaterno", label: "Apellido Paterno" },
  { value: "usuario", label: "Usuario" },
  { value: "correo", label: "Correo" },
  { value: "telefono", label: "Teléfono" },
];

const DeliveryPage: React.FC = () => {
  const [delivery, setDelivery] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<FilterType>("nombre");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadDelivery = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: DeliveryFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters[filterType] = searchTerm;
      }

      if (statusFilter) {
        filters.estatus = statusFilter === "true";
      }

      const response = await deliveryService.getAllDelivery(filters);

      if (response.data) {
        setDelivery(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los repartidores");
      console.error("Error loading delivery:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDelivery(true, 1);
  }, [searchTerm, filterType, statusFilter]);

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
    loadDelivery(true, page);
  };

  const handleCreateDelivery = () => {
    setSelectedDelivery(null);
    setShowModal(true);
  };

  const handleEditDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowModal(true);
  };

  const handleToggleStatus = async (delivery: Delivery) => {
    try {
      if (delivery.estatus) {
        await deliveryService.deactivateDelivery(delivery._id);
        toast.success("Repartidor desactivado exitosamente");
      } else {
        await deliveryService.activateDelivery(delivery._id);
        toast.success("Repartidor activado exitosamente");
      }
      loadDelivery(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del repartidor");
    }
  };

  const handleSaveDelivery = async (data: CreateDeliveryData | UpdateDeliveryData) => {
    try {
      setModalLoading(true);
      if (selectedDelivery) {
        await deliveryService.updateDelivery(selectedDelivery._id, data);
        toast.success("Repartidor actualizado exitosamente");
      } else {
        await deliveryService.createDelivery(data as CreateDeliveryData);
        toast.success("Repartidor creado exitosamente");
      }
      setShowModal(false);
      loadDelivery(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el repartidor");
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

  const getFullName = (delivery: Delivery) => {
    return `${delivery.nombre} ${delivery.apellidoPaterno} ${delivery.apellidoMaterno}`.trim();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Repartidores"
        description="Gestiona los repartidores del sistema"
        action={{
          label: "Nuevo Repartidor",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreateDelivery,
        }}
      />

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-4 p-4 border-b">
            <Select value={filterType} onValueChange={handleFilterTypeChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por" />
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
                type="search"
                placeholder={`Buscar por ${filterOptions
                  .find((opt) => opt.value === filterType)
                  ?.label.toLowerCase()}...`}
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
                    <TableHead>Foto</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delivery.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <div>No se encontraron repartidores</div>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    delivery.map((person, index) => (
                      <TableRow key={person._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <Avatar>
                            <AvatarImage src={person.foto} alt={getFullName(person)} />
                            <AvatarFallback>
                              {person.nombre.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{getFullName(person)}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(person.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">@{person.usuario}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[200px]">{person.direccion}</div>
                        </TableCell>
                        <TableCell>{person.telefono}</TableCell>
                        <TableCell>
                          <div className="truncate max-w-[180px]">{person.correo}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={person.estatus ? "default" : "destructive"}>
                            {person.estatus ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Actions
                            delivery={person}
                            onEdit={handleEditDelivery}
                            onToggleStatus={handleToggleStatus}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {delivery.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {delivery.length} de {pagination.total} registros
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

      <DeliveryModal
        show={showModal}
        onHide={() => setShowModal(false)}
        delivery={selectedDelivery}
        onSave={handleSaveDelivery}
        loading={modalLoading}
      />
    </div>
  );
};

export default DeliveryPage;