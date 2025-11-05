"use client";

import React, { useEffect, useState } from "react";
import { Table, Spinner, Badge } from "react-bootstrap";
import { financeService } from "../services/finance";
import { FinanceFilters, Expense } from "../types";
import { toast } from "react-toastify";

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
    const typeMap: Record<string, { variant: string; text: string }> = {
      check_transfer: { variant: "primary", text: "Cheque/Transferencia" },
      petty_cash: { variant: "success", text: "Caja Chica" },
    };

    const typeInfo = typeMap[expenseType] || {
      variant: "secondary",
      text: expenseType,
    };

    return (
      <Badge bg={typeInfo.variant} className="px-2 py-1">
        {typeInfo.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Cargando gastos...</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th className="px-4 py-3 fw-semibold text-muted">No.</th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    CONCEPTO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    TIPO DE GASTO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    SUCURSAL
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FECHA PAGO
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    REGISTRADO POR
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted text-end">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No se encontraron gastos
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense, index) => (
                    <tr
                      key={expense._id}
                      style={{ borderBottom: "1px solid #f1f3f5" }}
                    >
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">{expense.concept}</td>
                      <td className="px-4 py-3">
                        {getExpenseTypeBadge(expense.expenseType)}
                      </td>
                      <td className="px-4 py-3">{expense.branchName}</td>
                      <td className="px-4 py-3">
                        {formatDate(expense.paymentDate)}
                      </td>
                      <td className="px-4 py-3">{expense.userName}</td>
                      <td className="px-4 py-3 text-end fw-semibold">
                        {formatCurrency(expense.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesTable;
