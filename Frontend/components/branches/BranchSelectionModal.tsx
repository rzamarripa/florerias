"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Branch, useActiveBranchStore } from "@/stores/activeBranchStore";
import BranchCard from "./BranchCard";
import { TbSearch, TbX, TbAlertTriangle } from "react-icons/tb";
import { branchesService } from "@/features/admin/modules/branches/services/branches";
import { Loader2 } from "lucide-react";

interface BranchSelectionModalProps {
  show: boolean;
  onHide: () => void;
  isRequired?: boolean;
  onNoBranchesFound?: () => void;
}

const BranchSelectionModal = ({
  show,
  onHide,
  isRequired = false,
  onNoBranchesFound,
}: BranchSelectionModalProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const { activeBranch, setActiveBranch } = useActiveBranchStore();

  useEffect(() => {
    const fetchBranches = async () => {
      if (!show) return;

      setLoading(true);
      setError(null);

      try {
        const result = await branchesService.getUserBranches();
        if (result.success) {
          setBranches(result.data);

          if (result.data.length === 0) {
            setLoading(false);
            if (onNoBranchesFound) {
              onNoBranchesFound();
            }
            onHide();
            return;
          }

          if (activeBranch) {
            setSelectedBranch(activeBranch);
          }
        } else {
          throw new Error("Error al cargar las sucursales");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [show, activeBranch]);

  const filteredBranches = useMemo(() => {
    if (!searchTerm.trim()) return branches;

    return branches.filter((branch) =>
      branch.branchName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branches, searchTerm]);

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
  };

  const handleConfirm = () => {
    if (selectedBranch) {
      setActiveBranch(selectedBranch);
      onHide();
    }
  };

  const handleCancel = () => {
    if (isRequired && !activeBranch && branches.length > 0) {
      return;
    }
    setSelectedBranch(activeBranch);
    setSearchTerm("");
    onHide();
  };

  const canClose = !(isRequired && !activeBranch);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && canClose && onHide()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isRequired && !activeBranch
              ? "⚠️ Selección Obligatoria de Sucursal"
              : "Seleccionar Sucursal"}
          </DialogTitle>
          {!canClose && (
            <DialogDescription>
              Es obligatorio seleccionar una sucursal para continuar.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          {isRequired && !activeBranch && (
            <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50">
              <TbAlertTriangle className="h-5 w-5 text-yellow-500" />
              <AlertTitle className="font-bold">Acción Requerida</AlertTitle>
              <AlertDescription>
                Es <strong>obligatorio</strong> seleccionar una sucursal para
                poder acceder a las funcionalidades del sistema con el usuario
                Administrador.
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-4">
            <div className="relative">
              <TbSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <Input
                type="text"
                placeholder="Buscar sucursal por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                >
                  <TbX size={20} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="mt-3 text-muted-foreground">Cargando sucursales...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredBranches.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchTerm
                  ? "No se encontraron sucursales que coincidan con la búsqueda"
                  : "No tienes sucursales asignadas"}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBranches.map((branch) => (
                <BranchCard
                  key={branch._id}
                  branch={branch}
                  isActive={selectedBranch?._id === branch._id}
                  onSelect={handleSelectBranch}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          {canClose && (
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!selectedBranch || loading}
          >
            Confirmar Selección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BranchSelectionModal;
