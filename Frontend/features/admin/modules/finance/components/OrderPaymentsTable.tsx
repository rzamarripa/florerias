"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, OrderPayment } from "../types";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
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
    <div className="mb-4">
      <Card className="shadow-sm rounded-[15px]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">No.</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    FOLIO ORDEN
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    NO. ORDEN
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">CLIENTE</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    FECHA PAGO
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    FORMA PAGO
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    REGISTRADO POR
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-right">
                    MONTO
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
                      className="border-b border-muted/50 hover:bg-muted/30"
                    >
                      <TableCell className="px-4 py-3">{index + 1}</TableCell>
                      <TableCell className="px-4 py-3 font-semibold">
                        {payment.orderId?.orderNumber || "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {payment.orderId?.orderNumber || "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {payment.orderId?.clientInfo?.name || "Sin nombre"}
                      </TableCell>
                      <TableCell className="px-4 py-3">{formatDate(payment.date)}</TableCell>
                      <TableCell className="px-4 py-3">
                        {payment.paymentMethod?.name || "N/A"}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {payment.registeredBy?.profile?.fullName ||
                         (payment.registeredBy?.profile?.name && payment.registeredBy?.profile?.lastName
                           ? `${payment.registeredBy.profile.name} ${payment.registeredBy.profile.lastName}`
                           : "N/A")}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(payment.amount)}
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

export default OrderPaymentsTable;
