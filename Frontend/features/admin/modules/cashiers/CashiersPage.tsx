"use client";

import { Search, ChevronLeft, ChevronRight, Plus, User, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { cashiersService } from "./services/cashiers";
import {
  Cashier,
  CashierFilters,
  CreateCashierData,
  UpdateCashierData,
} from "./types";
import Actions from "./components/Actions";
import CashierModal from "./components/CashierModal";

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

const CashiersPage: React.FC = () => {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadCashiers = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: CashierFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (statusFilter) {
        filters.estatus = statusFilter === "true";
      }

      const response = await cashiersService.getAllCashiers(filters);

      if (response.data) {
        setCashiers(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los cajeros");
      console.error("Error loading cashiers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashiers(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value);
  };

  const handlePageChange = (page: number) => {
    loadCashiers(true, page);
  };

  const handleCreateCashier = () => {
    setSelectedCashier(null);
    setShowModal(true);
  };

  const handleEditCashier = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setShowModal(true);
  };

  const handleToggleStatus = async (cashier: Cashier) => {
    try {
      if (cashier.profile.estatus) {
        await cashiersService.deactivateCashier(cashier._id);
        toast.success("Cajero desactivado exitosamente");
      } else {
        await cashiersService.activateCashier(cashier._id);
        toast.success("Cajero activado exitosamente");
      }
      loadCashiers(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del cajero");
    }
  };

  const handleSaveCashier = async (
    data: CreateCashierData | UpdateCashierData
  ) => {
    try {
      setModalLoading(true);
      if (selectedCashier) {
        await cashiersService.updateCashier(selectedCashier._id, data);
        toast.success("Cajero actualizado exitosamente");
      } else {
        await cashiersService.createCashier(data as CreateCashierData);
        toast.success("Cajero creado exitosamente");
      }
      setShowModal(false);
      loadCashiers(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el cajero");
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
        title="Cajeros"
        description="Gestiona los cajeros del sistema"
        action={{
          label: "Nuevo Cajero",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreateCashier,
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
                placeholder="Buscar cajeros..."
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
              <p className="text-muted-foreground mt-3">Cargando cajeros...</p>
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
                  {cashiers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-muted-foreground"
                      >
                        <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <div>No se encontraron cajeros</div>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cashiers.map((cashier, index) => (
                      <TableRow key={cashier._id}>
                        <TableCell>
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{cashier.profile.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(cashier.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">@{cashier.username}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[200px]">{cashier.email}</div>
                        </TableCell>
                        <TableCell>{cashier.phone}</TableCell>
                        <TableCell>
                          {cashier.branch ? (
                            <div>
                              <div className="font-medium">{cashier.branch.branchName}</div>
                              <div className="text-sm text-muted-foreground">
                                {cashier.branch.branchCode}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin sucursal</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cashier.profile.estatus ? "default" : "destructive"}>
                            {cashier.profile.estatus ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Actions
                            cashier={cashier}
                            onEdit={handleEditCashier}
                            onToggleStatus={handleToggleStatus}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {cashiers.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {cashiers.length} de {pagination.total} registros
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

      <CashierModal
        show={showModal}
        onHide={() => setShowModal(false)}
        cashier={selectedCashier}
        onSave={handleSaveCashier}
        loading={modalLoading}
      />
    </div>
  );
};

export default CashiersPage;
