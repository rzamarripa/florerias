"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { buysService } from "./services/buys";
import { Buy, BuyFilters } from "./types";
import BuyModal from "./components/BuyModal";
import BuyActions from "./components/BuyActions";
import { branchesService } from "../branches/services/branches";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BuysPage: React.FC = () => {
  const [buys, setBuys] = useState<Buy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"dia" | "semana" | "mes">("dia");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [userBranches, setUserBranches] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  const userId = useUserSessionStore((state) => state.getUserId());
  const { hasRole } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();
  const isAdmin = hasRole("Administrador") || hasRole("Admin");

  // Cargar sucursales del usuario (solo para no administradores)
  useEffect(() => {
    const loadUserBranches = async () => {
      try {
        if (!userId || isAdmin) return;
        const response = await branchesService.getUserBranches();
        if (response.data) {
          setUserBranches(response.data);
          // Si solo hay una sucursal, seleccionarla automaticamente
          if (response.data.length === 1) {
            setSelectedBranch(response.data[0]._id);
          }
        }
      } catch (error: any) {
        console.error("Error loading user branches:", error);
      }
    };

    loadUserBranches();
  }, [userId, isAdmin]);

  // Si es administrador con sucursal activa, usarla automaticamente
  useEffect(() => {
    if (isAdmin && activeBranch) {
      setSelectedBranch(activeBranch._id);
    } else if (isAdmin && !activeBranch) {
      setSelectedBranch(""); // Permitir busqueda sin filtro
    }
  }, [isAdmin, activeBranch]);

  const loadBuys = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: BuyFilters = {
        page,
        limit: pagination.limit,
      };

      if (startDate) {
        filters.startDate = startDate;
      }

      if (endDate) {
        filters.endDate = endDate;
      }

      if (selectedBranch) {
        filters.branchId = selectedBranch;
        console.log(
          "[Buys] Filtrando por sucursal selectedBranch:",
          selectedBranch
        );
      } else {
        console.log(
          "[Buys] Sin filtro de sucursal - selectedBranch:",
          selectedBranch
        );
      }

      console.log("[Buys] isAdmin:", isAdmin, "activeBranch:", activeBranch);
      console.log("[Buys] Filtros enviados:", filters);
      const response = await buysService.getAllBuys(filters);

      if (response.data) {
        // Filtrar por busqueda local si hay termino de busqueda
        let filteredBuys = response.data;
        if (searchTerm) {
          filteredBuys = response.data.filter(
            (buy) =>
              buy.folio.toString().includes(searchTerm.toLowerCase()) ||
              buy.concept?.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
          );
        }
        setBuys(filteredBuys);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las compras");
      console.error("Error loading buys:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Para administradores: cargar siempre (con o sin sucursal)
    // Para no administradores: cargar solo si hay sucursales
    if (isAdmin || userBranches.length > 0) {
      loadBuys(true, 1);
    }
  }, [startDate, endDate, selectedBranch, searchTerm, userBranches, isAdmin]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadBuys(true, page);
  };

  const handleBuySaved = () => {
    loadBuys(false);
  };

  const handleSearch = () => {
    loadBuys(true, 1);
  };

  // Opciones para los botones de periodo
  const handleViewModeChange = (mode: "dia" | "semana" | "mes") => {
    setViewMode(mode);
    const today = new Date();
    let start = new Date();

    switch (mode) {
      case "dia":
        start = today;
        break;
      case "semana":
        start = new Date(today.setDate(today.getDate() - 7));
        break;
      case "mes":
        start = new Date(today.setMonth(today.getMonth() - 1));
        break;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="container mx-auto py-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="mb-1 font-bold text-2xl">Compras</h2>
          <p className="text-muted-foreground mb-0">Gestiona las compras de la sucursal</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4"
        >
          <Plus size={20} />
          Agregar
        </Button>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3">
                <Label className="font-semibold mb-2">
                  Fecha Inicial *
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <Label className="font-semibold mb-2">
                  Fecha Final *
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="md:col-span-4">
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "dia" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleViewModeChange("dia")}
                    className="flex-1"
                  >
                    Dia
                  </Button>
                  <Button
                    variant={viewMode === "semana" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleViewModeChange("semana")}
                    className="flex-1"
                  >
                    Semana
                  </Button>
                  <Button
                    variant={viewMode === "mes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleViewModeChange("mes")}
                    className="flex-1"
                  >
                    Mes
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleSearch}
                  className="w-full"
                >
                  Buscar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por folio o concepto..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-3">Cargando compras...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">No.</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">ACCION</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">FECHA</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">SUCURSAL</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">FORMA PAGO</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">CONCEPTO</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">DESCRIPCION</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground text-right">IMPORTE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No se encontraron compras
                    </TableCell>
                  </TableRow>
                ) : (
                  buys.map((buy, index) => (
                    <TableRow key={buy._id}>
                      <TableCell className="px-2 py-2">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <BuyActions buy={buy} onBuySaved={handleBuySaved} />
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        {new Date(buy.paymentDate).toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        {buy.branch?.branchName || "N/A"}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        {buy.paymentMethod?.name || "N/A"}
                      </TableCell>
                      <TableCell className="px-2 py-2 font-semibold">
                        {buy.concept?.name || "N/A"}
                      </TableCell>
                      <TableCell className="px-2 py-2">{buy.description || "-"}</TableCell>
                      <TableCell className="px-2 py-2 text-right font-semibold">
                        $
                        {buy.amount.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && buys.length > 0 && (
            <div className="flex justify-between items-center px-4 py-2 border-t">
              <p className="text-muted-foreground text-sm">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                de {pagination.total} compras
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="rounded-lg"
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-3 py-1 text-sm">
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

      {/* Modal para crear compra */}
      <BuyModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={handleBuySaved}
        branchId={activeBranch?._id}
      />
    </div>
  );
};

export default BuysPage;
