"use client";

import React, { useState, useEffect } from "react";
import { Form, Button, ButtonGroup } from "react-bootstrap";
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
    // Cargar sucursales solo para el rol Redes (los demás no lo necesitan)
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
    // Para cajeros y gerentes: no enviar branchId (el backend lo filtrará automáticamente)
    // Para rol Redes: usar el branchId seleccionado
    const finalBranchId = isAdministrator
      ? (activeBranch?._id || undefined)
      : (isCajero || isGerente)
      ? undefined // Cajeros y Gerentes no envían branchId, el backend lo filtra automáticamente
      : (branchId || undefined);

    onSearch({ startDate, endDate, viewMode, branchId: finalBranchId });
  };

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
      <div className="card-body p-3">
        <div className="row g-2 align-items-end">
          <div className={isAdministrator || isCajero || isGerente ? "col-md-4" : "col-md-3"}>
            <Form.Group className="mb-0">
              <Form.Label className="fw-semibold text-muted mb-1" style={{ fontSize: "13px" }}>
                Fecha Inicial <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-0 bg-light"
                style={{ borderRadius: "8px", padding: "8px 12px", fontSize: "14px" }}
              />
            </Form.Group>
          </div>

          <div className={isAdministrator || isCajero || isGerente ? "col-md-4" : "col-md-3"}>
            <Form.Group className="mb-0">
              <Form.Label className="fw-semibold text-muted mb-1" style={{ fontSize: "13px" }}>
                Fecha Final <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-0 bg-light"
                style={{ borderRadius: "8px", padding: "8px 12px", fontSize: "14px" }}
              />
            </Form.Group>
          </div>

          {/* Mostrar select de sucursal solo para el rol Redes */}
          {isRedes && (
            <div className="col-md-3">
              <Form.Group className="mb-0">
                <Form.Label className="fw-semibold text-muted mb-1" style={{ fontSize: "13px" }}>
                  Sucursal
                </Form.Label>
                <Form.Select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="border-0 bg-light"
                  style={{ borderRadius: "8px", padding: "8px 12px", fontSize: "14px" }}
                  disabled={loadingBranches}
                >
                  <option value="">Todas las sucursales</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branchName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          )}

          <div className={isAdministrator || isCajero || isGerente ? "col-md-4" : "col-md-3"}>
            <Button
              onClick={handleSearch}
              variant="primary"
              className="w-100"
              style={{
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Buscar
            </Button>
          </div>
        </div>

        <div className="row mt-2">
          <div className="col-12">
            <div className="d-flex justify-content-end">
              <ButtonGroup size="sm">
                <Button
                  variant={viewMode === "dia" ? "primary" : "outline-secondary"}
                  onClick={() => setViewMode("dia")}
                  style={{
                    borderRadius: "8px 0 0 8px",
                    fontWeight: "600",
                    fontSize: "13px",
                    padding: "6px 12px",
                  }}
                >
                  Día
                </Button>
                <Button
                  variant={viewMode === "semana" ? "primary" : "outline-secondary"}
                  onClick={() => setViewMode("semana")}
                  style={{
                    fontWeight: "600",
                    fontSize: "13px",
                    padding: "6px 12px",
                  }}
                >
                  Semana
                </Button>
                <Button
                  variant={viewMode === "mes" ? "primary" : "outline-secondary"}
                  onClick={() => setViewMode("mes")}
                  style={{
                    borderRadius: "0 8px 8px 0",
                    fontWeight: "600",
                    fontSize: "13px",
                    padding: "6px 12px",
                  }}
                >
                  Mes
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateFilters;
