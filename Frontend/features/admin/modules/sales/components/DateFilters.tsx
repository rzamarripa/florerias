"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { branchesService } from "@/features/admin/modules/branches/services/branches";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

interface DateFiltersProps {
  onSearch: (filters: {
    startDate: string;
    endDate: string;
    viewMode: "dia" | "semana" | "mes";
    branchId?: string;
  }) => void;
}

const DateFilters: React.FC<DateFiltersProps> = ({ onSearch }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"dia" | "semana" | "mes">("dia");
  const [branchId, setBranchId] = useState<string>("");
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const { activeBranch } = useActiveBranchStore();
  const { role } = useUserRoleStore();
  const isAdministrator = role?.toLowerCase() === "administrador";
  const isRedes = role?.toLowerCase() === "redes";
  const isCajero = role?.toLowerCase() === "cajero";
  const isGerente = role?.toLowerCase() === "gerente";

  useEffect(() => {
    // Cargar sucursales solo para el rol Redes (los demas no lo necesitan)
    if (isRedes) {
      loadUserBranches();
    }
  }, [isRedes]);

  const loadUserBranches = async () => {
    try {
      setLoadingBranches(true);

      // Si es usuario Redes, usar endpoint especial
      if (isRedes) {
        const response = await branchesService.getBranchesForRedesUser();
        if (response.success) {
          setBranches(response.data);
        }
      } else {
        // Para otros roles (Gerente, Cajero), usar endpoint normal
        const response = await branchesService.getUserBranches();
        if (response.success) {
          setBranches(response.data);
        }
      }
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleSearch = () => {
    // Para administradores: usar sucursal activa del store, o undefined si no hay
    // Para cajeros y gerentes: no enviar branchId (el backend lo filtrara automaticamente)
    // Para rol Redes: usar el branchId seleccionado
    const finalBranchId = isAdministrator
      ? (activeBranch?._id || undefined)
      : (isCajero || isGerente)
      ? undefined // Cajeros y Gerentes no envian branchId, el backend lo filtra automaticamente
      : (branchId || undefined);

    onSearch({ startDate, endDate, viewMode, branchId: finalBranchId });
  };

  return (
    <Card className="shadow-sm mb-2 rounded-xl">
      <CardContent className="p-2">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
          <div className={isAdministrator || isCajero || isGerente ? "md:col-span-4" : "md:col-span-3"}>
            <div className="space-y-1">
              <Label className="font-semibold text-muted-foreground text-xs">
                Fecha Inicial <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className=" bg-gray-100 rounded-lg"
              />
            </div>
          </div>

          <div className={isAdministrator || isCajero || isGerente ? "md:col-span-4" : "md:col-span-3"}>
            <div className="space-y-1">
              <Label className="font-semibold text-muted-foreground text-xs">
                Fecha Final <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className=" bg-gray-100 rounded-lg"
              />
            </div>
          </div>

          {/* Mostrar select de sucursal solo para el rol Redes */}
          {isRedes && (
            <div className="md:col-span-3">
              <div className="space-y-1">
                <Label className="font-semibold text-muted-foreground text-xs">
                  Sucursal
                </Label>
                <Select
                  value={branchId}
                  onValueChange={setBranchId}
                  disabled={loadingBranches}
                >
                  <SelectTrigger className=" bg-gray-100 rounded-lg">
                    <SelectValue placeholder="Todas las sucursales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las sucursales</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className={isAdministrator || isCajero || isGerente ? "md:col-span-4" : "md:col-span-3"}>
            <Button
              onClick={handleSearch}
              className="w-full rounded-lg font-semibold"
            >
              Buscar
            </Button>
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <div className="inline-flex rounded-lg overflow-hidden border">
            <Button
              variant={viewMode === "dia" ? "default" : "outline"}
              onClick={() => setViewMode("dia")}
              className="rounded-none font-semibold text-xs px-3 py-1.5"
              size="sm"
            >
              Dia
            </Button>
            <Button
              variant={viewMode === "semana" ? "default" : "outline"}
              onClick={() => setViewMode("semana")}
              className="rounded-none border-x font-semibold text-xs px-3 py-1.5"
              size="sm"
            >
              Semana
            </Button>
            <Button
              variant={viewMode === "mes" ? "default" : "outline"}
              onClick={() => setViewMode("mes")}
              className="rounded-none font-semibold text-xs px-3 py-1.5"
              size="sm"
            >
              Mes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateFilters;
