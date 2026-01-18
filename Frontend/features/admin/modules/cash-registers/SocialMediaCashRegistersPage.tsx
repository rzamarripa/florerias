"use client";

import React, { useEffect, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Wallet, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { cashRegistersService } from "./services/cashRegisters";
import { CashRegister } from "./types";
import CashRegisterActions from "./components/CashRegisterActions";
import CashRegisterModal from "./components/CashRegisterModal";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { Button } from "@/components/ui/button";
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

const SocialMediaCashRegistersPage: React.FC = () => {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const { getIsAdmin, getIsManager, getIsSocialMedia } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();
  const isAdmin = getIsAdmin();
  const isManager = getIsManager();
  const isSocialMedia = getIsSocialMedia();

  const loadCashRegisters = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: any = {
        page,
        limit: pagination.limit,
      };

      // Para administradores: usar activeBranch del store
      // Para usuarios de redes y gerentes: el backend filtra automaticamente segun el usuario
      if (isAdmin && activeBranch) {
        filters.branchId = activeBranch._id;
      }

      const response = await cashRegistersService.getSocialMediaCashRegisters(
        filters
      );

      if (response.data) {
        setCashRegisters(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(
        error.message || "Error al cargar las cajas de redes sociales"
      );
      console.error("Error loading social media cash registers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar cajas de redes sociales cuando cambia activeBranch
  useEffect(() => {
    loadCashRegisters(true, 1);
  }, [activeBranch]);

  const handlePageChange = (page: number) => {
    loadCashRegisters(true, page);
  };

  const handleCashRegisterUpdated = () => {
    loadCashRegisters(false);
  };

  const getBranchName = (cashRegister: CashRegister): string => {
    if (typeof cashRegister.branchId === "string") {
      return "N/A";
    }
    return cashRegister.branchId.branchName;
  };

  const getSocialMediaUserName = (cashRegister: CashRegister): string => {
    if (!cashRegister.cashierId) {
      return "Sin asignar";
    }
    if (typeof cashRegister.cashierId === "string") {
      return "N/A";
    }
    return cashRegister.cashierId.profile.fullName;
  };

  const getManagerName = (cashRegister: CashRegister): string => {
    if (typeof cashRegister.managerId === "string") {
      return "N/A";
    }
    return cashRegister.managerId.profile.fullName;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="mb-1 font-bold text-2xl">
            {isAdmin || isManager
              ? "Cajas de Redes Sociales"
              : "Mis Cajas de Redes Sociales"}
          </h2>
          <p className="text-muted-foreground mb-0">
            {isAdmin
              ? "Gestiona las cajas de redes sociales del sistema"
              : isManager
              ? "Gestiona las cajas de redes sociales de tu sucursal"
              : isSocialMedia
              ? "Visualiza todas las cajas de redes sociales de tus sucursales asignadas"
              : "Visualiza las cajas de redes sociales donde eres gerente"}
          </p>
        </div>
        {(isAdmin || isManager) && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4"
          >
            <Plus size={20} />
            Nueva Caja Redes
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="shadow-sm rounded-[15px]">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-3">
                Cargando cajas de redes sociales...
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">#</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">NOMBRE</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">SUCURSAL</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">USUARIO REDES</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">GERENTE</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">SALDO ACTUAL</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">ULTIMO CIERRE</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">ESTADO</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-center">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashRegisters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <Wallet size={48} className="mb-3 opacity-50 mx-auto" />
                      <p className="mb-0">
                        No se encontraron cajas de redes sociales
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  cashRegisters.map((cashRegister, index) => (
                    <TableRow key={cashRegister._id}>
                      <TableCell className="px-4 py-3">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-semibold">
                        {cashRegister.name}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {getBranchName(cashRegister)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="font-semibold">
                          {getSocialMediaUserName(cashRegister)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="font-semibold">
                          {getManagerName(cashRegister)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="font-bold text-green-600">
                          {formatCurrency(cashRegister.currentBalance)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <small className="text-muted-foreground">
                          {formatDate(cashRegister.lastOpen)}
                        </small>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              cashRegister.isOpen
                                ? "bg-green-500 text-white hover:bg-green-500"
                                : "bg-gray-500 text-white hover:bg-gray-500"
                            }`}
                          >
                            {cashRegister.isOpen ? "Abierta" : "Cerrada"}
                          </Badge>
                          <Badge
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              cashRegister.isActive
                                ? "bg-primary text-primary-foreground hover:bg-primary"
                                : "bg-destructive text-white hover:bg-destructive"
                            }`}
                          >
                            {cashRegister.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                          <Badge
                            className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white hover:bg-yellow-500"
                          >
                            Redes Sociales
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <CashRegisterActions
                          cashRegister={cashRegister}
                          onCashRegisterUpdated={handleCashRegisterUpdated}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && cashRegisters.length > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-t">
              <p className="text-muted-foreground mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                de {pagination.total} cajas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="rounded-lg"
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-3 py-1">
                  Pagina {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
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

      {/* Create Modal */}
      {(isAdmin || isManager) && (
        <CashRegisterModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onCashRegisterSaved={handleCashRegisterUpdated}
          isSocialMediaBox={true}
        />
      )}
    </div>
  );
};

export default SocialMediaCashRegistersPage;
