"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Spinner } from "react-bootstrap";
import { Pencil, Trash2 } from "lucide-react";
import { expensesService } from "../services/expenses";
import { Expense } from "../types";
import { toast } from "react-toastify";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

interface CheckTransferTableProps {
  onEdit: (expense: Expense) => void;
  refreshTrigger?: number;
}

const CheckTransferTable: React.FC<CheckTransferTableProps> = ({
  onEdit,
  refreshTrigger = 0,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const { activeBranch } = useActiveBranchStore();
  const { hasRole } = useUserRoleStore();
  const isAdmin = hasRole("Administrador") || hasRole("Admin");

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const filters: any = {
        expenseType: "check_transfer",
        page: currentPage,
        limit: 10,
      };

      // Si es admin y tiene sucursal activa, filtrar por esa sucursal
      if (isAdmin && activeBranch) {
        filters.branchId = activeBranch._id;
        console.log(
          "🔍 [CheckTransfer] Filtrando por sucursal:",
          activeBranch.branchName,
          activeBranch._id
        );
      } else {
        console.log(
          "🔍 [CheckTransfer] Sin filtro - isAdmin:",
          isAdmin,
          "activeBranch:",
          activeBranch
        );
      }

      console.log("🔍 [CheckTransfer] Filtros enviados:", filters);
      const response = await expensesService.getAllExpenses(filters);

      if (response.success) {
        setExpenses(response.data);
        setTotalPages(response.pagination.pages);
        setTotal(response.pagination.total);
      }
    } catch (error) {
      console.error("Error al cargar gastos:", error);
      toast.error("Error al cargar los gastos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentPage, refreshTrigger, activeBranch]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este gasto?")) {
      return;
    }

    try {
      const response = await expensesService.deleteExpense(id);
      if (response.success) {
        toast.success("Gasto eliminado exitosamente");
        fetchExpenses();
      }
    } catch (error) {
      console.error("Error al eliminar gasto:", error);
      toast.error("Error al eliminar el gasto");
    }
  };

  const calculateTotal = (): number => {
    return expenses.reduce((sum, expense) => sum + expense.total, 0);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Cargando gastos...</p>
      </div>
    );
  }

  return (
    <div>
      <div
        className="table-responsive"
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Table hover className="mb-0">
          <thead style={{ backgroundColor: "#f8f9fa" }}>
            <tr>
              <th className="py-3 px-4 fw-semibold text-muted">No.</th>
              <th className="py-3 px-4 fw-semibold text-muted">Folio</th>
              <th className="py-3 px-4 fw-semibold text-muted">Fecha Pago</th>
              <th className="py-3 px-4 fw-semibold text-muted">Concepto</th>
              <th className="py-3 px-4 fw-semibold text-muted">Usuario</th>
              <th className="py-3 px-4 fw-semibold text-muted text-center">
                Total
              </th>
              <th className="py-3 px-4 fw-semibold text-muted text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-5 text-muted">
                  No hay gastos de Cheque/Transferencia registrados
                </td>
              </tr>
            ) : (
              <>
                {expenses.map((expense, index) => (
                  <tr key={expense._id}>
                    <td className="py-3 px-4">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>
                    <td className="py-3 px-4 fw-semibold">{expense.folio}</td>
                    <td className="py-3 px-4">
                      {new Date(expense.paymentDate).toLocaleDateString(
                        "es-MX"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {expense.concept?.name || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      {expense.user?.profile?.fullName ||
                        expense.user?.username}
                    </td>
                    <td className="py-3 px-4 text-end fw-semibold">
                      ${expense.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="d-flex gap-2 justify-content-center">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onEdit(expense)}
                          className="d-flex align-items-center gap-1"
                          style={{
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontWeight: "bold",
                          }}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(expense._id)}
                          className="d-flex align-items-center gap-1"
                          style={{
                            borderRadius: "6px",
                            padding: "4px 8px",
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                  <td colSpan={5} className="py-3 px-4 text-end">
                    Total
                  </td>
                  <td className="py-3 px-4 text-end">
                    ${calculateTotal().toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </>
            )}
          </tbody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-muted">
            Mostrando {expenses.length} de {total} gastos
          </span>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Anterior
            </Button>
            <span className="d-flex align-items-center px-3">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline-primary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckTransferTable;
