"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { cashRegistersService } from "../services/cashRegisters";
import { CashRegister } from "../types";
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

interface ExpenseModalProps {
  show: boolean;
  onHide: () => void;
  cashRegister: CashRegister;
  onExpenseRegistered: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  show,
  onHide,
  cashRegister,
  onExpenseRegistered,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    expenseConcept: "",
    amount: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.expenseConcept.trim()) {
      toast.error("El concepto del gasto es requerido");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser un numero positivo");
      return;
    }

    if (amount > cashRegister.currentBalance) {
      toast.error("El monto del gasto excede el saldo disponible en la caja");
      return;
    }

    try {
      setLoading(true);
      const response = await cashRegistersService.registerExpense(
        cashRegister._id,
        {
          expenseConcept: formData.expenseConcept.trim(),
          amount: amount,
        }
      );

      if (response.success) {
        toast.success(response.message || "Gasto registrado exitosamente");
        setFormData({ expenseConcept: "", amount: "" });
        onExpenseRegistered();
        onHide();
      }
    } catch (error: any) {
      toast.error(error.message || "Error al registrar el gasto");
      console.error("Error al registrar gasto:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ expenseConcept: "", amount: "" });
      onHide();
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Registrar Gasto</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <small className="text-muted-foreground">Caja:</small>
                  <div className="font-bold">{cashRegister.name}</div>
                </div>
                <div className="text-right">
                  <small className="text-muted-foreground">Saldo disponible:</small>
                  <div className="font-bold text-green-600 text-xl">
                    {formatCurrency(cashRegister.currentBalance)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">
                Concepto del gasto <span className="text-red-500">*</span>
              </Label>
              <Textarea
                name="expenseConcept"
                value={formData.expenseConcept}
                onChange={handleInputChange}
                placeholder="Ej: Compra de material de empaque, pago de servicio, etc."
                required
                disabled={loading}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">
                Monto <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Ingresa el monto del gasto (maximo:{" "}
                {formatCurrency(cashRegister.currentBalance)})
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                "Registrar Gasto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseModal;
