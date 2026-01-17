"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { buysService } from "../services/buys";
import { Buy, CreateBuyData } from "../types";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";
import { PaymentMethod } from "../../payment-methods/types";
import { providersService } from "../../providers/services/providers";
import { Provider } from "../../providers/types";
import { expenseConceptsService } from "../../expenseConcepts/services/expenseConcepts";
import { ExpenseConcept } from "../../expenseConcepts/types";
import { cashRegistersService } from "../../cash-registers/services/cashRegisters";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BuyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  buy?: Buy;
  branchId?: string;
}

const BuyModal: React.FC<BuyModalProps> = ({ open, onOpenChange, onSuccess, buy, branchId }) => {
  const [loading, setLoading] = useState(false);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [loadingCashRegisters, setLoadingCashRegisters] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [expenseConcepts, setExpenseConcepts] = useState<ExpenseConcept[]>([]);
  const [cashRegisters, setCashRegisters] = useState<any[]>([]);
  const [formData, setFormData] = useState<CreateBuyData>({
    paymentDate: new Date().toISOString().split("T")[0],
    concept: "",
    amount: 0,
    paymentMethod: "",
    provider: "",
    description: "",
    cashRegister: "",
  });

  const { activeBranch } = useActiveBranchStore();
  const { hasRole } = useUserRoleStore();
  const isEditing = !!buy;

  const isAdmin = hasRole("Administrador") || hasRole("Admin");
  const isManager = hasRole("Gerente") || hasRole("Manager");

  // Cargar metodos de pago, proveedores y conceptos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingConcepts(true);
        const [paymentMethodsResponse, providersResponse, conceptsResponse] = await Promise.all([
          paymentMethodsService.getAllPaymentMethods({ status: true }),
          providersService.getAllProviders({ page: 1, limit: 1000, isActive: true }),
          expenseConceptsService.getAllExpenseConcepts({ isActive: true, limit: 1000 })
        ]);

        if (paymentMethodsResponse.data) {
          setPaymentMethods(paymentMethodsResponse.data);
        }

        if (providersResponse.data) {
          setProviders(providersResponse.data);
        }

        if (conceptsResponse.success) {
          setExpenseConcepts(conceptsResponse.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setLoadingConcepts(false);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Cargar cajas cuando el metodo de pago sea efectivo
  useEffect(() => {
    const loadCashRegisters = async () => {
      if (!open || !formData.paymentMethod) return;

      const selectedPaymentMethod = paymentMethods.find(pm => pm._id === formData.paymentMethod);
      const isEffectivo = selectedPaymentMethod?.name?.toLowerCase().includes('efectivo') || false;

      if (isEffectivo) {
        try {
          setLoadingCashRegisters(true);

          // Si es gerente, buscar por managerId (sin filtro, el backend filtrara por usuario)
          if (isManager) {
            const response = await cashRegistersService.getAllCashRegisters({
              isActive: true,
              isOpen: true,
              limit: 1000,
            });
            if (response.success) {
              setCashRegisters(response.data);
            }
          }
          // Si es admin, buscar por branchId
          else if (isAdmin) {
            const branchIdToUse = branchId || activeBranch?._id;

            if (branchIdToUse) {
              const response = await cashRegistersService.getAllCashRegisters({
                branchId: branchIdToUse,
                isActive: true,
                isOpen: true,
                limit: 1000,
              });
              if (response.success) {
                setCashRegisters(response.data);
              }
            }
          }
        } catch (error) {
          console.error("Error loading cash registers:", error);
          toast.error("Error al cargar las cajas");
        } finally {
          setLoadingCashRegisters(false);
        }
      } else {
        setCashRegisters([]);
        setFormData(prev => ({ ...prev, cashRegister: "" }));
      }
    };

    loadCashRegisters();
  }, [open, formData.paymentMethod, paymentMethods, branchId, activeBranch, isManager, isAdmin]);

  // Cargar datos del buy si esta editando
  useEffect(() => {
    if (buy) {
      setFormData({
        paymentDate: buy.paymentDate.split("T")[0],
        concept: buy.concept?._id || "",
        amount: buy.amount,
        paymentMethod: typeof buy.paymentMethod === "string"
          ? buy.paymentMethod
          : buy.paymentMethod._id,
        provider: buy.provider ? (typeof buy.provider === "string" ? buy.provider : buy.provider._id) : "",
        description: buy.description || "",
        cashRegister: "",
      });
    } else {
      setFormData({
        paymentDate: new Date().toISOString().split("T")[0],
        concept: "",
        amount: 0,
        paymentMethod: "",
        provider: "",
        description: "",
        cashRegister: "",
      });
    }
  }, [buy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.concept) {
      toast.error("El concepto es obligatorio");
      return;
    }

    if (!formData.paymentMethod) {
      toast.error("Selecciona una forma de pago");
      return;
    }

    if (formData.amount <= 0) {
      toast.error("El importe debe ser mayor a 0");
      return;
    }

    try {
      setLoading(true);

      if (isEditing && buy) {
        await buysService.updateBuy(buy._id, formData);
        toast.success("Compra actualizada exitosamente");
      } else {
        // Incluir el branchId en la creacion si se proporciona
        const createData = branchId ? { ...formData, branch: branchId } : formData;
        await buysService.createBuy(createData);
        toast.success("Compra creada exitosamente");
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la compra");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      paymentDate: new Date().toISOString().split("T")[0],
      concept: "",
      amount: 0,
      paymentMethod: "",
      provider: "",
      description: "",
      cashRegister: "",
    });
    setCashRegisters([]);
    onOpenChange(false);
  };

  const selectedPaymentMethod = paymentMethods.find(pm => pm._id === formData.paymentMethod);
  const isEffectivo = selectedPaymentMethod?.name?.toLowerCase().includes('efectivo') || false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-bold">
            {isEditing ? "Editar Compra" : "Nueva Compra"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">
                  Fecha de Pago <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentDate: e.target.value })
                  }
                  required
                  className="bg-muted/50 border-0"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">
                  Forma de Pago <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger className="bg-muted/50 border-0 w-full">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm._id} value={pm._id}>
                        {pm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Caja Registradora (solo para efectivo) */}
            {isEffectivo && (
              <div className="space-y-2">
                <Label className="font-semibold">
                  Caja Registradora (Opcional)
                </Label>
                <Select
                  value={formData.cashRegister}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cashRegister: value })
                  }
                  disabled={loadingCashRegisters || cashRegisters.length === 0}
                >
                  <SelectTrigger className="bg-muted/50 border-0 w-full">
                    <SelectValue
                      placeholder={
                        loadingCashRegisters
                          ? "Cargando cajas..."
                          : cashRegisters.length === 0
                          ? "No hay cajas disponibles"
                          : "Seleccionar caja (opcional)..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cashRegisters.map((cashRegister) => (
                      <SelectItem key={cashRegister._id} value={cashRegister._id}>
                        {cashRegister.name} - Saldo: $
                        {cashRegister.currentBalance.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Si seleccionas una caja, el monto se descontara automaticamente
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-semibold">Proveedor</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) =>
                  setFormData({ ...formData, provider: value })
                }
              >
                <SelectTrigger className="bg-muted/50 border-0 w-full">
                  <SelectValue placeholder="Seleccionar proveedor (opcional)..." />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider._id} value={provider._id}>
                      {provider.tradeName} - {provider.rfc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">
                Concepto <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.concept}
                onValueChange={(value) =>
                  setFormData({ ...formData, concept: value })
                }
                disabled={loadingConcepts}
              >
                <SelectTrigger className="bg-muted/50 border-0 w-full">
                  <SelectValue
                    placeholder={
                      loadingConcepts ? "Cargando conceptos..." : "Seleccionar concepto..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {expenseConcepts.map((concept) => (
                    <SelectItem key={concept._id} value={concept._id}>
                      {concept.name}
                      {concept.description && ` - ${concept.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">
                Importe <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                required
                className="bg-muted/50 border-0"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Descripcion</Label>
              <Textarea
                rows={3}
                placeholder="Descripcion adicional de la compra..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-muted/50 border-0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BuyModal;
