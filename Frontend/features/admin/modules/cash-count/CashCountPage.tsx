"use client";

import React, { useState, useEffect } from "react";
import {
  Eye,
  Calendar,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { cashRegisterLogsService } from "./services/cashRegisterLogs";
import { CashRegisterLog, CashRegisterRef } from "./types";
import CashCountDetailModal from "./components/CashCountDetailModal";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

const CashCountPage: React.FC = () => {
  const { activeBranch } = useActiveBranchStore();
  const { getIsCashier, getIsAdmin } = useUserRoleStore();
  const isCashier = getIsCashier();
  const isAdmin = getIsAdmin();

  const [logs, setLogs] = useState<CashRegisterLog[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegisterRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CashRegisterLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [filters, setFilters] = useState({
    cashRegisterId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadCashRegisters();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters.page, filters.limit]);

  // Recargar logs cuando cambie la sucursal activa
  useEffect(() => {
    loadLogs();
  }, [activeBranch?._id]);

  const loadCashRegisters = async () => {
    // Los cajeros no necesitan cargar la lista de cajas porque el filtro se aplica automaticamente en el backend
    if (isCashier) {
      return;
    }

    try {
      const response = await cashRegisterLogsService.getUserCashRegisters();
      if (response.success) {
        setCashRegisters(response.data);
      }
    } catch (error: any) {
      console.error("Error loading cash registers:", error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);

      // Para cajeros: el backend filtra automaticamente por cashierId
      // Para admins: incluir el branchId de la sucursal activa si existe
      const filtersToSend = isCashier
        ? {
            ...filters,
            cashRegisterId: undefined, // Eliminar el filtro de caja para cajeros (el backend filtra por cashierId)
          }
        : {
            ...filters,
            ...(activeBranch?._id && { branchId: activeBranch._id }),
          };

      const response =
        await cashRegisterLogsService.getAllCashRegisterLogs(filtersToSend);

      if (response.success) {
        setLogs(response.data);
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el historial de cierres");
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      cashRegisterId: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
    });
    setTimeout(() => loadLogs(), 100);
  };

  const handleViewDetail = async (logId: string) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const response =
        await cashRegisterLogsService.getCashRegisterLogById(logId);
      if (response.success) {
        setSelectedLog(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el detalle");
      console.error("Error loading log detail:", error);
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-4 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="mb-1 font-bold text-2xl">
            Historial de Cierres de Caja
          </h2>
          <p className="text-muted-foreground">
            Consulta el historial completo de cierres de caja registradora
          </p>
        </div>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div
              className={`grid gap-4 ${isCashier ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-4"}`}
            >
              <div className="space-y-2">
                <Label className="font-semibold flex items-center">
                  <Calendar size={16} className="mr-2" />
                  Fecha Inicio
                </Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold flex items-center">
                  <Calendar size={16} className="mr-2" />
                  Fecha Fin
                </Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>

              {/* Ocultar selector de caja para cajeros - el backend filtra automaticamente por su sucursal */}
              {!isCashier && (
                <div className="space-y-2">
                  <Label className="font-semibold flex items-center">
                    <DollarSign size={16} className="mr-2" />
                    Caja Registradora
                  </Label>
                  <Select
                    value={filters.cashRegisterId}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        cashRegisterId: value === "all" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas las cajas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las cajas</SelectItem>
                      {cashRegisters.map((cashRegister) => (
                        <SelectItem
                          key={cashRegister._id}
                          value={cashRegister._id}
                        >
                          {cashRegister.name}
                          {cashRegister.branchId &&
                            ` - ${cashRegister.branchId.branchName}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  Buscar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1"
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                  FECHA CIERRE
                </TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                  CAJA
                </TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                  SUCURSAL
                </TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                  CAJERO
                </TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                  GERENTE
                </TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-right">
                  SALDO INICIAL
                </TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-right">
                  TOTAL VENTAS
                </TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-right">
                  TOTAL GASTOS
                </TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-right">
                  SALDO FINAL
                </TableHead>
                <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-center">
                  ACCIONES
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground mt-3">
                      Cargando historial...
                    </p>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <DollarSign
                      size={48}
                      className="text-muted-foreground mb-3 mx-auto"
                    />
                    <p className="text-muted-foreground">
                      No se encontraron cierres de caja
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log._id} className="border-b border-border/50">
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold">
                        {formatDate(log.closedAt)}
                      </div>
                      {log.openedAt && (
                        <small className="text-muted-foreground">
                          Abierto: {formatDate(log.openedAt)}
                        </small>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold">{log.cashRegisterName}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className="px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-800"
                      >
                        {log.branchId.branchName}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {log.cashierId ? (
                        <div>
                          <div className="font-semibold text-[13px]">
                            {log.cashierId.profile.fullName}
                          </div>
                          <small className="text-muted-foreground">
                            {log.cashierId.username}
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div>
                        <div className="font-semibold text-[13px]">
                          {log.managerId.profile.fullName}
                        </div>
                        <small className="text-muted-foreground">
                          {log.managerId.username}
                        </small>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span className="font-semibold">
                        {formatCurrency(log.totals.initialBalance)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(log.totals.totalSales)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span className="font-semibold text-red-600">
                        {formatCurrency(log.totals.totalExpenses)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span className="font-bold text-primary">
                        {formatCurrency(log.totals.finalBalance)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-8 h-8"
                        onClick={() => handleViewDetail(log._id)}
                        title="Ver detalle"
                      >
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="flex justify-between items-center p-4 border-t">
              <div className="text-muted-foreground">
                Mostrando {logs.length} de {pagination.total} registros
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft size={16} />
                </Button>

                {[...Array(pagination.pages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === pagination.pages ||
                    (pageNumber >= pagination.page - 1 &&
                      pageNumber <= pagination.page + 1)
                  ) {
                    return (
                      <Button
                        key={pageNumber}
                        variant={
                          pageNumber === pagination.page ? "default" : "outline"
                        }
                        size="icon-sm"
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  } else if (
                    pageNumber === pagination.page - 2 ||
                    pageNumber === pagination.page + 2
                  ) {
                    return (
                      <span key={pageNumber} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handlePageChange(pagination.pages)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <CashCountDetailModal
        open={showDetailModal}
        onOpenChange={(open) => {
          setShowDetailModal(open);
          if (!open) setSelectedLog(null);
        }}
        log={selectedLog}
        loading={loadingDetail}
      />
    </div>
  );
};

export default CashCountPage;
