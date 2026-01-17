"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
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
import { Badge } from "@/components/ui/badge";
import { Expense } from "../types";
import { TrendingDown, Calendar, DollarSign, FileText, Loader2 } from "lucide-react";

interface ExpensesModalProps {
  show: boolean;
  onHide: () => void;
  expenses: Expense[];
  branchName: string;
  loading?: boolean;
}

const ExpensesModal: React.FC<ExpensesModalProps> = ({
  show,
  onHide,
  expenses,
  branchName,
  loading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getExpenseTypeBadge = (type: string) => {
    const typeConfig: Record<string, { className: string; label: string }> = {
      check_transfer: { className: "bg-cyan-500", label: "Cheque/Transferencia" },
      petty_cash: { className: "bg-yellow-500", label: "Caja Chica" },
    };

    const config = typeConfig[type] || { className: "bg-gray-500", label: type };

    return (
      <Badge
        className={`px-3 py-2 ${config.className}`}
        style={{
          fontSize: "11px",
          fontWeight: "600",
          borderRadius: "8px",
        }}
      >
        {config.label}
      </Badge>
    );
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.total, 0);

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-6xl">
        <DialogHeader className="bg-red-500 text-white p-4 -m-6 mb-0 rounded-t-lg">
          <DialogTitle className="flex items-center text-white">
            <TrendingDown size={24} className="mr-2" />
            Gastos de {branchName}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[600px] overflow-y-auto mt-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-3">Cargando gastos...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown size={48} className="text-muted-foreground mb-3 mx-auto" />
              <p className="text-muted-foreground">
                No hay gastos registrados en el periodo seleccionado
              </p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="card border-0 h-full bg-red-50">
                  <div className="card-body text-center p-4">
                    <DollarSign size={24} className="text-red-500 mx-auto" />
                    <h5 className="mt-2 mb-0 font-bold text-red-500">
                      {formatCurrency(totalExpenses)}
                    </h5>
                    <p className="text-muted-foreground mb-0" style={{ fontSize: "12px" }}>
                      Total de Gastos
                    </p>
                  </div>
                </div>
                <div className="card border-0 h-full bg-blue-50">
                  <div className="card-body text-center p-4">
                    <FileText size={24} className="text-blue-500 mx-auto" />
                    <h5 className="mt-2 mb-0 font-bold text-blue-500">
                      {expenses.length}
                    </h5>
                    <p className="text-muted-foreground mb-0" style={{ fontSize: "12px" }}>
                      Gastos Totales
                    </p>
                  </div>
                </div>
                <div className="card border-0 h-full bg-cyan-50">
                  <div className="card-body text-center p-4">
                    <DollarSign size={24} className="text-cyan-500 mx-auto" />
                    <h5 className="mt-2 mb-0 font-bold text-cyan-500">
                      {formatCurrency(totalExpenses / expenses.length)}
                    </h5>
                    <p className="text-muted-foreground mb-0" style={{ fontSize: "12px" }}>
                      Gasto Promedio
                    </p>
                  </div>
                </div>
              </div>

              {/* Expenses table */}
              <Table>
                <TableHeader>
                  <TableRow style={{ borderBottom: "2px solid #dee2e6" }}>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Folio</TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Concepto</TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Usuario</TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Total</TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Tipo</TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                      Fecha de Pago
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell className="align-middle">
                        <span className="font-semibold" style={{ fontSize: "13px" }}>
                          #{expense.folio}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div>
                          <p className="mb-0 font-semibold" style={{ fontSize: "13px" }}>
                            {expense.concept?.name || "Sin concepto"}
                          </p>
                          {expense.concept?.description && (
                            <p
                              className="mb-0 text-muted-foreground"
                              style={{ fontSize: "11px" }}
                            >
                              {expense.concept.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div>
                          <p className="mb-0 font-semibold" style={{ fontSize: "13px" }}>
                            {expense.user.profile.fullName}
                          </p>
                          <p className="mb-0 text-muted-foreground" style={{ fontSize: "11px" }}>
                            @{expense.user.username}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="font-bold text-red-500" style={{ fontSize: "14px" }}>
                          {formatCurrency(expense.total)}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        {getExpenseTypeBadge(expense.expenseType)}
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-muted-foreground" />
                          <span style={{ fontSize: "12px" }}>
                            {formatDate(expense.paymentDate)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>
        <DialogFooter>
          <p className="text-muted-foreground mb-0 mr-auto" style={{ fontSize: "13px" }}>
            Total: {expenses.length} gasto{expenses.length !== 1 ? "s" : ""} | Monto
            total: {formatCurrency(totalExpenses)}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpensesModal;
