"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CloseConfirmDialogProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (remainingBalance: number) => void;
  currentBalance: number;
  isClosing: boolean;
}

const CloseConfirmDialog: React.FC<CloseConfirmDialogProps> = ({
  show,
  onHide,
  onConfirm,
  currentBalance,
  isClosing,
}) => {
  const [remainingBalance, setRemainingBalance] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      setRemainingBalance("");
      setError("");
    }
  }, [show]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const handleInputChange = (value: string) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^\d.]/g, "");
    setRemainingBalance(sanitized);
    setError("");
  };

  const handleConfirm = () => {
    const parsed = parseFloat(remainingBalance);

    // Validations
    if (!remainingBalance || isNaN(parsed)) {
      setError("Por favor ingresa un monto valido");
      return;
    }

    if (parsed < 0) {
      setError("El saldo no puede ser negativo");
      return;
    }

    if (parsed > currentBalance) {
      setError(
        `El saldo restante no puede ser mayor al saldo actual de ${formatCurrency(
          currentBalance
        )}`
      );
      return;
    }

    onConfirm(parsed);
  };

  const withdrawAmount = remainingBalance
    ? currentBalance - parseFloat(remainingBalance)
    : 0;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && !isClosing && onHide()}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isClosing}>
        <DialogHeader>
          <DialogTitle className="font-bold">Cerrar Caja Registradora</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertTriangle size={20} className="text-blue-600" />
            <AlertDescription className="ml-2">
              <strong>Importante:</strong> Ingresa el saldo que quedara en la
              caja despues del cierre. Este sera el saldo inicial para la
              proxima apertura.
            </AlertDescription>
          </Alert>

          <div className="p-3 rounded-lg bg-muted">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Saldo actual de la caja:</span>
              <span className="font-bold text-xl text-primary">
                {formatCurrency(currentBalance)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">
              Cuanto saldo quedara en la caja?
            </Label>
            <div className="relative">
              <DollarSign
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                placeholder="0.00"
                value={remainingBalance}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={isClosing}
                className={`pl-10 text-lg font-medium ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Ingresa solo numeros (ejemplo: 500 o 1500.50)
            </p>
          </div>

          {remainingBalance && !error && parseFloat(remainingBalance) >= 0 && (
            <div
              className={`p-3 rounded-lg border ${
                withdrawAmount > 0
                  ? "bg-yellow-50 border-yellow-300"
                  : "bg-cyan-50 border-cyan-300"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">
                  {withdrawAmount > 0 ? "Se retirara:" : "Saldo final:"}
                </span>
                <span className="font-bold text-xl">
                  {formatCurrency(withdrawAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onHide}
            disabled={isClosing}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isClosing || !remainingBalance}
          >
            {isClosing ? "Cerrando..." : "Confirmar y Cerrar Caja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseConfirmDialog;
