"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, OrderPayment } from "../types";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderPaymentsTableProps {
  filters: FinanceFilters;
}

const OrderPaymentsTable: React.FC<OrderPaymentsTableProps> = ({ filters }) => {
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log("OrderPaymentsTable useEffect - filters:", filters);
    // Siempre cargar, el backend resolverá las sucursales automáticamente
    loadOrderPayments();
  }, [filters]);

  const loadOrderPayments = async () => {
    try {
      setLoading(true);
      console.log("Filters being sent:", filters);
      const response = await financeService.getOrderPaymentsByBranch(filters);
      console.log("Response received:", response);
      console.log("Response data:", response.data);
      if (response.data) {
        setPayments(response.data);
        console.log("Payments set to state:", response.data);
      } else {
        console.log("No data in response");
        setPayments([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar pagos de órdenes");
      console.error("Error loading order payments:", error);
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
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-3">Cargando pagos realizados...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">No.</TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">
              Folio orden
            </TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">
              No. orden
            </TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">Cliente</TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">
              Fecha pago
            </TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">
              Forma pago
            </TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">
              Registrado por
            </TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground text-right">
              Monto
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                No se encontraron pagos realizados
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment, index) => (
              <TableRow
                key={payment._id}
                className="hover:bg-muted/30"
              >
                <TableCell className="py-3 px-4">{index + 1}</TableCell>
                <TableCell className="py-3 px-4 font-semibold">
                  {payment.orderId?.orderNumber || "N/A"}
                </TableCell>
                <TableCell className="py-3 px-4">
                  {payment.orderId?.orderNumber || "N/A"}
                </TableCell>
                <TableCell className="py-3 px-4">
                  {payment.orderId?.clientInfo?.name || "Sin nombre"}
                </TableCell>
                <TableCell className="py-3 px-4">{formatDate(payment.date)}</TableCell>
                <TableCell className="py-3 px-4">
                  {payment.paymentMethod?.name || "N/A"}
                </TableCell>
                <TableCell className="py-3 px-4">
                  {payment.registeredBy?.profile?.fullName ||
                   (payment.registeredBy?.profile?.name && payment.registeredBy?.profile?.lastName
                     ? `${payment.registeredBy.profile.name} ${payment.registeredBy.profile.lastName}`
                     : "N/A")}
                </TableCell>
                <TableCell className="py-3 px-4 text-right font-semibold">
                  {formatCurrency(payment.amount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderPaymentsTable;
