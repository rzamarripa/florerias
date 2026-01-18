"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, Expense } from "../types";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExpensesTableProps {
  filters: FinanceFilters;
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({ filters }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log("ExpensesTable useEffect - filters:", filters);
    loadExpenses();
  }, [filters]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      console.log("Loading expenses with filters:", filters);
      const response = await financeService.getExpensesByBranch(filters);
      console.log("Response received:", response);
      if (response.data) {
        setExpenses(response.data);
        console.log("Expenses set to state:", response.data);
      } else {
        console.log("No data in response");
        setExpenses([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar gastos");
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getExpenseTypeBadge = (expenseType: string) => {
    const typeMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; text: string }> = {
      check_transfer: { variant: "default", text: "Cheque/Transferencia" },
      petty_cash: { variant: "secondary", text: "Caja Chica" },
    };

    const typeInfo = typeMap[expenseType] || {
      variant: "outline" as const,
      text: expenseType,
    };

    return (
      <Badge variant={typeInfo.variant} className="px-2 py-1">
        {typeInfo.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-3">Cargando gastos...</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <Card className="shadow-sm rounded-[15px]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">No.</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    CONCEPTO
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    TIPO DE GASTO
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    SUCURSAL
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    FECHA PAGO
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    REGISTRADO POR
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-right">
                    TOTAL
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No se encontraron gastos
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense, index) => (
                    <TableRow
                      key={expense._id}
                      className="border-b border-muted/50 hover:bg-muted/30"
                    >
                      <TableCell className="px-4 py-3">{index + 1}</TableCell>
                      <TableCell className="px-4 py-3">{expense.concept}</TableCell>
                      <TableCell className="px-4 py-3">
                        {getExpenseTypeBadge(expense.expenseType)}
                      </TableCell>
                      <TableCell className="px-4 py-3">{expense.branchName}</TableCell>
                      <TableCell className="px-4 py-3">
                        {formatDate(expense.paymentDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3">{expense.userName}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(expense.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesTable;
