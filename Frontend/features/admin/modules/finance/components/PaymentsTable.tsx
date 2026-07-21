"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, Payment } from "../types";
import { toast } from "react-toastify";

interface PaymentsTableProps {
  filters: FinanceFilters;
}

const PaymentsTable: React.FC<PaymentsTableProps> = ({ filters }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await financeService.getPayments(filters);
      if (response.data) {
        setPayments(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar listado de cobros");
      console.error("Error loading payments:", error);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-3">Cargando cobros realizados...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h5 className="font-bold mb-3 text-lg">Listado de Cobros Realizados</h5>
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">No.</TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">Folio</TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">
              Fecha pago
            </TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">
              Forma pago
            </TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">Cliente</TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">Usuario</TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground text-right">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                No se encontraron cobros realizados
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment, index) => (
              <TableRow
                key={payment._id}
                className="hover:bg-muted/30"
              >
                <TableCell className="py-3 px-4">{index + 1}</TableCell>
                <TableCell className="py-3 px-4 font-semibold">{payment.folio}</TableCell>
                <TableCell className="py-3 px-4">
                  {formatDate(payment.paymentDate)}
                </TableCell>
                <TableCell className="py-3 px-4">{payment.paymentMethod}</TableCell>
                <TableCell className="py-3 px-4">{payment.client}</TableCell>
                <TableCell className="py-3 px-4">{payment.user}</TableCell>
                <TableCell className="py-3 px-4 text-right font-semibold">
                  {formatCurrency(payment.total)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentsTable;
