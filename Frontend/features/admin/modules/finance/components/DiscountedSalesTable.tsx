"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, DiscountedSale } from "../types";
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

interface DiscountedSalesTableProps {
  filters: FinanceFilters;
}

const DiscountedSalesTable: React.FC<DiscountedSalesTableProps> = ({ filters }) => {
  const [sales, setSales] = useState<DiscountedSale[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log("DiscountedSalesTable useEffect - filters:", filters);
    loadDiscountedSales();
  }, [filters]);

  const loadDiscountedSales = async () => {
    try {
      setLoading(true);
      console.log("Loading discounted sales with filters:", filters);
      const response = await financeService.getDiscountedSales(filters);
      console.log("Response received:", response);
      if (response.data) {
        setSales(response.data);
        console.log("Sales set to state:", response.data);
      } else {
        console.log("No data in response");
        setSales([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar ventas con descuento");
      console.error("Error loading discounted sales:", error);
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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string; text: string }> = {
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", text: "Pendiente" },
      completed: { variant: "secondary", className: "bg-green-100 text-green-800 hover:bg-green-100", text: "Completada" },
      cancelled: { variant: "destructive", text: "Cancelada" },
      in_progress: { variant: "secondary", className: "bg-blue-100 text-blue-800 hover:bg-blue-100", text: "En Proceso" },
    };

    const statusInfo = statusMap[status] || { variant: "outline" as const, text: status };

    return (
      <Badge variant={statusInfo.variant} className={`px-2 py-1 ${statusInfo.className || ""}`}>
        {statusInfo.text}
      </Badge>
    );
  };

  const formatDiscountType = (discountType: string) => {
    return discountType === "percentage" ? "%" : "$";
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-3">Cargando ventas con descuento...</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <Card className="border-0 shadow-sm rounded-[15px]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">No.</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    NO. ORDEN
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">CLIENTE</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">SUCURSAL</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    FECHA
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    SUBTOTAL
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    DESCUENTO
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground text-right">
                    TOTAL
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    ESTADO
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No se encontraron ventas con descuento
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale, index) => (
                    <TableRow
                      key={sale._id}
                      className="border-b border-muted/50 hover:bg-muted/30"
                    >
                      <TableCell className="px-4 py-3">{index + 1}</TableCell>
                      <TableCell className="px-4 py-3 font-semibold">
                        {sale.orderNumber}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {sale.clientName}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {sale.branchName}
                      </TableCell>
                      <TableCell className="px-4 py-3">{formatDate(sale.createdAt)}</TableCell>
                      <TableCell className="px-4 py-3">
                        {formatCurrency(sale.subtotal)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-destructive font-semibold">
                          -{formatCurrency(sale.discount)}{" "}
                          {sale.discountType && `(${formatDiscountType(sale.discountType)})`}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {getStatusBadge(sale.status)}
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

export default DiscountedSalesTable;
