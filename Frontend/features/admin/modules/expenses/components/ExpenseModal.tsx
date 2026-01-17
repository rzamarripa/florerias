"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { expensesService } from "../services/expenses";
import { Expense, CreateExpenseData, UpdateExpenseData } from "../types";
import { cashRegistersService } from "../../cash-registers/services/cashRegisters";
import { expenseConceptsService } from "../../expenseConcepts/services/expenseConcepts";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { toast } from "react-toastify";

interface ExpenseModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  expense?: Expense | null;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  show,
  onHide,
  onSuccess,
  expense,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCashRegisters, setLoadingCashRegisters] = useState<boolean>(false);
  const [loadingConcepts, setLoadingConcepts] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    concept: "",
    total: "",
    expenseType: "check_transfer" as "check_transfer" | "petty_cash",
    cashRegisterId: "",
    branchId: "",
  });

  const [cashRegisters, setCashRegisters] = useState<any[]>([]);
  const [expenseConcepts, setExpenseConcepts] = useState<any[]>([]);

  const { hasRole } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();

  const isAdmin = hasRole("Administrador") || hasRole("Admin");
  const isManager = hasRole("Gerente") || hasRole("Manager");

  // Si es administrador con sucursal activa, usarla automaticamente
  useEffect(() => {
    if (show && isAdmin && activeBranch) {
      setFormData((prev) => ({ ...prev, branchId: activeBranch._id }));
    }
  }, [show, isAdmin, activeBranch]);

  // Cargar cajas cuando se selecciona tipo "petty_cash"
  useEffect(() => {
    if (show && formData.expenseType === "petty_cash") {
      if (isManager) {
        // Si es gerente, cargar sus cajas directamente
        loadCashRegistersByManager();
      } else if (isAdmin && (formData.branchId || activeBranch)) {
        // Si es admin y ya selecciono una sucursal o tiene sucursal activa, cargar las cajas de esa sucursal
        const branchIdToUse = formData.branchId || activeBranch?._id;
        if (branchIdToUse) {
          loadCashRegistersByBranch(branchIdToUse);
        }
      }
    }
  }, [show, formData.expenseType, formData.branchId, isAdmin, isManager, activeBranch]);

  // Cargar conceptos de gasto cuando se abre el modal
  useEffect(() => {
    if (show) {
      loadExpenseConcepts();
    }
  }, [show]);

  useEffect(() => {
    if (expense) {
      setFormData({
        paymentDate: new Date(expense.paymentDate).toISOString().split("T")[0],
        concept: expense.concept?._id || "",
        total: expense.total.toString(),
        expenseType: expense.expenseType,
        cashRegisterId: expense.cashRegister?._id || "",
        branchId: "",
      });
    } else {
      setFormData({
        paymentDate: new Date().toISOString().split("T")[0],
        concept: "",
        total: "",
        expenseType: "check_transfer",
        cashRegisterId: "",
        branchId: "",
      });
    }
  }, [expense, show]);

  const loadCashRegistersByManager = async () => {
    try {
      setLoadingCashRegisters(true);
      const response = await cashRegistersService.getAllCashRegisters({
        isActive: true,
        limit: 1000,
      });
      if (response.success) {
        setCashRegisters(response.data);
      }
    } catch (error) {
      console.error("Error loading cash registers:", error);
      toast.error("Error al cargar las cajas");
    } finally {
      setLoadingCashRegisters(false);
    }
  };

  const loadCashRegistersByBranch = async (branchId: string) => {
    try {
      setLoadingCashRegisters(true);
      const response = await cashRegistersService.getAllCashRegisters({
        branchId,
        isActive: true,
        limit: 1000,
      });
      if (response.success) {
        setCashRegisters(response.data);
      }
    } catch (error) {
      console.error("Error loading cash registers:", error);
      toast.error("Error al cargar las cajas");
    } finally {
      setLoadingCashRegisters(false);
    }
  };

  const loadExpenseConcepts = async () => {
    try {
      setLoadingConcepts(true);
      const response = await expenseConceptsService.getAllExpenseConcepts({
        isActive: true,
        limit: 1000,
      });
      if (response.success) {
        setExpenseConcepts(response.data);
      }
    } catch (error) {
      console.error("Error loading expense concepts:", error);
      toast.error("Error al cargar los conceptos de gastos");
    } finally {
      setLoadingConcepts(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paymentDate || !formData.concept || !formData.total) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const totalValue = parseFloat(formData.total);
    if (isNaN(totalValue) || totalValue <= 0) {
      toast.error("El total debe ser un numero mayor a 0");
      return;
    }

    // Validar caja chica
    if (formData.expenseType === "petty_cash") {
      if (isAdmin && !formData.branchId && !activeBranch) {
        toast.error("Por favor selecciona una sucursal");
        return;
      }
      if (!formData.cashRegisterId) {
        toast.error("Por favor selecciona una caja registradora");
        return;
      }
    }

    try {
      setLoading(true);

      if (expense) {
        // Actualizar gasto existente
        const updateData: UpdateExpenseData = {
          paymentDate: formData.paymentDate,
          concept: formData.concept,
          total: totalValue,
          expenseType: formData.expenseType,
          ...(formData.expenseType === "petty_cash" && {
            cashRegisterId: formData.cashRegisterId,
          }),
        };

        const response = await expensesService.updateExpense(
          expense._id,
          updateData
        );

        if (response.success) {
          toast.success("Gasto actualizado exitosamente");
          onSuccess();
          onHide();
        }
      } else {
        // Crear nuevo gasto
        const createData: CreateExpenseData = {
          paymentDate: formData.paymentDate,
          concept: formData.concept,
          total: totalValue,
          expenseType: formData.expenseType,
          ...(formData.expenseType === "petty_cash" && {
            cashRegisterId: formData.cashRegisterId,
          }),
          // Enviar branchId si el usuario es administrador con sucursal activa
          ...(isAdmin && activeBranch && {
            branchId: activeBranch._id,
          }),
        };

        const response = await expensesService.createExpense(createData);

        if (response.success) {
          toast.success("Gasto creado exitosamente");
          onSuccess();
          onHide();
        }
      }
    } catch (error: any) {
      console.error("Error al guardar gasto:", error);
      toast.error(
        error?.message || "Error al guardar el gasto. Por favor intenta de nuevo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && !loading && onHide()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="bg-primary text-primary-foreground -m-6 mb-0 p-6 rounded-t-lg">
          <DialogTitle className="font-bold text-white">
            {expense ? "Editar Gasto" : "Nuevo Gasto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Gasto */}
              <div className="space-y-2">
                <Label className="font-semibold">
                  Tipo de Gasto <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.expenseType}
                  onValueChange={(value: "check_transfer" | "petty_cash") => {
                    setFormData((prev) => ({
                      ...prev,
                      expenseType: value,
                      ...(value !== "petty_cash" && {
                        cashRegisterId: "",
                        branchId: "",
                      }),
                    }));
                    if (value !== "petty_cash") {
                      setCashRegisters([]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full rounded-lg border-2 border-gray-200">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check_transfer">Cheque / Transferencia</SelectItem>
                    <SelectItem value="petty_cash">Caja Chica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sucursal (solo para Admin con petty_cash) */}
              {formData.expenseType === "petty_cash" && isAdmin && activeBranch && (
                <div className="space-y-2">
                  <Label className="font-semibold">
                    Sucursal <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={activeBranch.branchName}
                    disabled
                    readOnly
                    className="rounded-lg border-2 border-gray-200 bg-gray-50"
                  />
                  <p className="text-sm text-muted-foreground">
                    Sucursal activa asignada
                  </p>
                </div>
              )}
            </div>

            {/* Alerta si no tiene sucursal seleccionada */}
            {formData.expenseType === "petty_cash" && isAdmin && !activeBranch && (
              <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <AlertDescription>
                  <strong>Sucursal no seleccionada:</strong> Debes seleccionar una sucursal desde el menu lateral antes de crear un gasto de caja chica.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Caja Registradora (para petty_cash) */}
              {formData.expenseType === "petty_cash" &&
                ((isManager) || (isAdmin && (formData.branchId || activeBranch))) && (
                  <div className="space-y-2">
                    <Label className="font-semibold">
                      Caja Registradora <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.cashRegisterId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, cashRegisterId: value }))
                      }
                      disabled={loadingCashRegisters}
                    >
                      <SelectTrigger className="w-full rounded-lg border-2 border-gray-200">
                        <SelectValue
                          placeholder={
                            loadingCashRegisters
                              ? "Cargando cajas..."
                              : "Selecciona una caja"
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
                  </div>
                )}

              {/* Fecha de Pago */}
              <div className="space-y-2">
                <Label className="font-semibold">
                  Fecha de Pago <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  required
                  className="rounded-lg border-2 border-gray-200"
                />
              </div>
            </div>

            {/* Concepto */}
            <div className="space-y-2">
              <Label className="font-semibold">
                Concepto <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.concept}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, concept: value }))
                }
                disabled={loadingConcepts}
              >
                <SelectTrigger className="w-full rounded-lg border-2 border-gray-200">
                  <SelectValue
                    placeholder={
                      loadingConcepts
                        ? "Cargando conceptos..."
                        : "Selecciona un concepto"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total */}
              <div className="space-y-2">
                <Label className="font-semibold">
                  Total <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="total"
                  value={formData.total}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="rounded-lg border-2 border-gray-200"
                />
              </div>

              {expense && (
                /* Folio (solo lectura en edicion) */
                <div className="space-y-2">
                  <Label className="font-semibold">Folio</Label>
                  <Input
                    type="text"
                    value={expense.folio}
                    disabled
                    className="rounded-lg border-2 border-gray-200 bg-gray-50"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t-2 border-gray-100 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={onHide}
              disabled={loading}
              className="rounded-lg px-5 py-2 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (isAdmin && !activeBranch && formData.expenseType === "petty_cash")}
              className="rounded-lg px-5 py-2 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : expense ? (
                "Actualizar Gasto"
              ) : (
                "Crear Gasto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;
