"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { X, Save, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Company } from "../types";
import { companiesService } from "../services/companies";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Branch {
  _id: string;
  branchName: string;
  branchCode?: string;
  rfc: string;
  address: {
    city: string;
    state: string;
  };
  manager: {
    name: string;
    email: string;
    phone: string;
  };
  isActive: boolean;
}

interface BranchOption {
  value: string;
  label: string;
  branch: Branch;
}

interface BranchesModalProps {
  show: boolean;
  onHide: () => void;
  company: Company;
  onBranchesUpdated?: () => void;
}

const BranchesModal: React.FC<BranchesModalProps> = ({
  show,
  onHide,
  company,
  onBranchesUpdated,
}) => {
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      loadBranches();
    }
  }, [show]);

  // Actualizar las opciones seleccionadas cuando cambian las sucursales o la empresa
  useEffect(() => {
    if (allBranches.length > 0) {
      const currentBranchIds =
        company.branches?.map((b: any) => (typeof b === "string" ? b : b._id)) || [];
      setSelectedBranchIds(currentBranchIds);

      const options = currentBranchIds
        .map((id) => {
          const branch = allBranches.find((b) => b._id === id);
          if (branch) {
            return {
              value: branch._id,
              label: `${branch.branchName}${branch.branchCode ? ` (${branch.branchCode})` : ""} - ${branch.address.city}, ${branch.address.state}`,
              branch,
            };
          }
          return null;
        })
        .filter((opt): opt is BranchOption => opt !== null);

      setSelectedOptions(options);
    }
  }, [allBranches, company]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      // Obtener todas las sucursales activas
      const response = await companiesService.getAllBranches({ isActive: true });
      setAllBranches(response.data || []);
    } catch (err: any) {
      console.error("Error al cargar sucursales:", err);
      setError(err.message || "Error al cargar las sucursales");
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelection = (newValue: readonly BranchOption[]) => {
    setSelectedOptions(newValue as BranchOption[]);
    setSelectedBranchIds(newValue.map((opt) => opt.value));
  };

  const getBranchOptions = (): BranchOption[] => {
    return allBranches.map((branch) => ({
      value: branch._id,
      label: `${branch.branchName}${branch.branchCode ? ` (${branch.branchCode})` : ""} - ${branch.address.city}, ${branch.address.state}`,
      branch,
    }));
  };

  const handleRemoveBranch = (branchId: string) => {
    const newSelectedIds = selectedBranchIds.filter((id) => id !== branchId);
    const newSelectedOptions = selectedOptions.filter((opt) => opt.value !== branchId);
    setSelectedBranchIds(newSelectedIds);
    setSelectedOptions(newSelectedOptions);
  };

  const getSelectedBranches = (): Branch[] => {
    return allBranches.filter((branch) => selectedBranchIds.includes(branch._id));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await companiesService.updateCompanyBranches(company._id, selectedBranchIds);
      toast.success("Sucursales actualizadas exitosamente");
      onBranchesUpdated?.();
      onHide();
    } catch (err: any) {
      const errorMessage = err.message || "Error al actualizar las sucursales";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onHide();
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !saving && !open && handleClose()}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Agregar Sucursales - {company.legalName}
          </DialogTitle>
          <DialogDescription>
            Selecciona las sucursales que deseas asignar a esta empresa
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-1">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground mt-3">Cargando sucursales...</p>
              </div>
            ) : (
              <>
                {/* Multiselect de Sucursales con React-Select */}
                <div className="space-y-2">
                  <Label className="font-semibold">Seleccionar Sucursales</Label>
                  <Select
                    isMulti
                    options={getBranchOptions()}
                    value={selectedOptions}
                    onChange={handleBranchSelection}
                    placeholder="Selecciona sucursales..."
                    noOptionsMessage={() => "No hay sucursales disponibles"}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "42px",
                        borderColor: "hsl(var(--border))",
                        "&:hover": {
                          borderColor: "hsl(var(--border))",
                        },
                      }),
                      menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                      }),
                    }}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                  />
                </div>

                {/* Tabla de Sucursales Seleccionadas */}
                <div>
                  <h6 className="font-semibold mb-3">
                    Sucursales Asignadas ({getSelectedBranches().length})
                  </h6>
                  {getSelectedBranches().length === 0 ? (
                    <Alert>
                      <AlertDescription>
                        No hay sucursales asignadas. Selecciona sucursales del listado
                        superior.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>RFC</TableHead>
                          <TableHead>Ciudad</TableHead>
                          <TableHead>Gerente</TableHead>
                          <TableHead className="w-16 text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSelectedBranches().map((branch) => (
                          <TableRow key={branch._id}>
                            <TableCell className="font-medium">{branch.branchName}</TableCell>
                            <TableCell>{branch.branchCode || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{branch.rfc}</Badge>
                            </TableCell>
                            <TableCell>
                              {branch.address.city}, {branch.address.state}
                            </TableCell>
                            <TableCell>{branch.manager.name}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveBranch(branch._id)}
                                title="Quitar sucursal"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BranchesModal;
