"use client";

import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { expensesService } from "../services/expenses";
import { Expense } from "../types";
import { toast } from "react-toastify";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

interface PettyCashTableProps {
  onEdit: (expense: Expense) => void;
  refreshTrigger?: number;
}

const PettyCashTable: React.FC<PettyCashTableProps> = ({
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
        expenseType: "petty_cash",
        page: currentPage,
        limit: 10,
      };

      // Si es admin y tiene sucursal activa, filtrar por esa sucursal
      if (isAdmin && activeBranch) {
        filters.branchId = activeBranch._id;
      }

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
    if (!window.confirm("Estas seguro de eliminar este gasto?")) {
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
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="mt-2 text-muted-foreground">Cargando gastos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl overflow-hidden shadow-sm border">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="py-3 px-4 font-semibold text-muted-foreground">No.</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-muted-foreground">Folio</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-muted-foreground">Fecha Pago</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-muted-foreground">Concepto</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-muted-foreground">Usuario</TableHead>
              <TableHead className="py-3 px-4 font-semibold text-muted-foreground text-center">
                Total
              </TableHead>
              <TableHead className="py-3 px-4 font-semibold text-muted-foreground text-center">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No hay gastos de Caja Chica registrados
                </TableCell>
              </TableRow>
            ) : (
              <>
                {expenses.map((expense, index) => (
                  <TableRow key={expense._id} className="hover:bg-gray-50">
                    <TableCell className="py-3 px-4">
                      {(currentPage - 1) * 10 + index + 1}
                    </TableCell>
                    <TableCell className="py-3 px-4 font-semibold">{expense.folio}</TableCell>
                    <TableCell className="py-3 px-4">
                      {new Date(expense.paymentDate).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {expense.concept?.name || "N/A"}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      {expense.user?.profile?.fullName || expense.user?.username}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-semibold">
                      ${expense.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onEdit(expense)}
                          className="flex items-center gap-1 rounded-md px-2 py-1"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(expense._id)}
                          className="flex items-center gap-1 rounded-md px-2 py-1"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell colSpan={5} className="py-3 px-4 text-right">
                    Total
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    ${calculateTotal().toFixed(2)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginacion */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-3">
          <span className="text-muted-foreground">
            Mostrando {expenses.length} de {total} gastos
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3">
              Pagina {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
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

export default PettyCashTable;
