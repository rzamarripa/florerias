"use client";

import { Search, ChevronLeft, ChevronRight, Plus, User, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { productionService } from "./services/production";
import { Production, ProductionFilters, FilterType, FilterOption, CreateProductionData, UpdateProductionData } from "./types";
import Actions from "./components/Actions";
import ProductionModal from "./components/ProductionModal";

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

const ProductionPage: React.FC = () => {
  const [production, setProduction] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<FilterType>("nombre");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadProduction = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: ProductionFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters[filterType] = searchTerm;
      }

      if (statusFilter) {
        filters.estatus = statusFilter === "true";
      }

      const response = await productionService.getAllProduction(filters);

      if (response.data) {
        setProduction(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el personal de producción");
      console.error("Error loading production:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduction(true, 1);
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
    loadProduction(true, page);
  };

  const handleCreateProduction = () => {
    setSelectedProduction(null);
    setShowModal(true);
  };

  const handleEditProduction = (production: Production) => {
    setSelectedProduction(production);
    setShowModal(true);
  };

  const handleToggleStatus = async (production: Production) => {
    try {
      if (production.estatus) {
        await productionService.deactivateProduction(production._id);
        toast.success("Personal de producción desactivado exitosamente");
      } else {
        await productionService.activateProduction(production._id);
        toast.success("Personal de producción activado exitosamente");
      }
      loadProduction(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del personal de producción");
    }
  };

  const handleSaveProduction = async (data: CreateProductionData | UpdateProductionData) => {
    try {
      setModalLoading(true);
      if (selectedProduction) {
        await productionService.updateProduction(selectedProduction._id, data);
        toast.success("Personal de producción actualizado exitosamente");
      } else {
        await productionService.createProduction(data as CreateProductionData);
        toast.success("Personal de producción creado exitosamente");
      }
      setShowModal(false);
      loadProduction(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el personal de producción");
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

  const getFullName = (production: Production) => {
    return `${production.nombre} ${production.apellidoPaterno} ${production.apellidoMaterno}`.trim();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Personal de Producción"
        description="Gestiona el personal de producción del sistema"
        action={{
          label: "Nuevo Personal",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreateProduction,
        }}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground mt-3">Cargando personal de producción...</p>
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
                  {production.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <div>No se encontró personal de producción</div>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    production.map((person, index) => (
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
                            production={person}
                            onEdit={handleEditProduction}
                            onToggleStatus={handleToggleStatus}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {production.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {production.length} de {pagination.total} registros
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

      <ProductionModal
        show={showModal}
        onHide={() => setShowModal(false)}
        production={selectedProduction}
        onSave={handleSaveProduction}
        loading={modalLoading}
      />
    </div>
  );
};

export default ProductionPage;
