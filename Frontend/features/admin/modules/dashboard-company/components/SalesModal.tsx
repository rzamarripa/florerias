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
import { Sale } from "../types";
import { ShoppingCart, Calendar, DollarSign, Loader2 } from "lucide-react";

interface SalesModalProps {
  show: boolean;
  onHide: () => void;
  sales: Sale[];
  branchName: string;
  loading?: boolean;
}

const SalesModal: React.FC<SalesModalProps> = ({
  show,
  onHide,
  sales,
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
    > = {
      pendiente: { variant: "secondary", label: "Pendiente" },
      "en-proceso": { variant: "default", label: "En Proceso" },
      completado: { variant: "default", label: "Completado" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };

    const config = statusConfig[status] || statusConfig.pendiente;

    return (
      <Badge
        variant={config.variant}
        className="px-3 py-2"
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

  const getChannelBadge = (channel: string) => {
    const channelConfig: Record<
      string,
      { className: string; label: string }
    > = {
      tienda: { className: "bg-blue-500", label: "Tienda" },
      whatsapp: { className: "bg-green-500", label: "WhatsApp" },
      facebook: { className: "bg-cyan-500", label: "Facebook" },
    };

    const config = channelConfig[channel] || channelConfig.tienda;

    return (
      <Badge
        className={`px-2 py-1 ${config.className}`}
        style={{
          fontSize: "11px",
          fontWeight: "600",
          borderRadius: "6px",
        }}
      >
        {config.label}
      </Badge>
    );
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-6xl">
        <DialogHeader className="bg-green-500 text-white p-4 -m-6 mb-0 rounded-t-lg">
          <DialogTitle className="flex items-center text-white">
            <ShoppingCart size={24} className="mr-2" />
            Ventas de {branchName}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[600px] overflow-y-auto mt-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-3">Cargando ventas...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="text-muted-foreground mb-3 mx-auto" />
              <p className="text-muted-foreground">
                No hay ventas registradas en el periodo seleccionado
              </p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="card border-0 h-full bg-green-50">
                  <div className="card-body text-center p-4">
                    <DollarSign size={24} className="text-green-500 mx-auto" />
                    <h5 className="mt-2 mb-0 font-bold text-green-500">
                      {formatCurrency(totalSales)}
                    </h5>
                    <p className="text-muted-foreground mb-0" style={{ fontSize: "12px" }}>
                      Total de Ventas
                    </p>
                  </div>
                </div>
                <div className="card border-0 h-full bg-blue-50">
                  <div className="card-body text-center p-4">
                    <ShoppingCart size={24} className="text-blue-500 mx-auto" />
                    <h5 className="mt-2 mb-0 font-bold text-blue-500">
                      {sales.length}
                    </h5>
                    <p className="text-muted-foreground mb-0" style={{ fontSize: "12px" }}>
                      Ordenes Totales
                    </p>
                  </div>
                </div>
                <div className="card border-0 h-full bg-cyan-50">
                  <div className="card-body text-center p-4">
                    <DollarSign size={24} className="text-cyan-500 mx-auto" />
                    <h5 className="mt-2 mb-0 font-bold text-cyan-500">
                      {formatCurrency(totalSales / sales.length)}
                    </h5>
                    <p className="text-muted-foreground mb-0" style={{ fontSize: "12px" }}>
                      Ticket Promedio
                    </p>
                  </div>
                </div>
              </div>

              {/* Sales table */}
              <Table>
                <TableHeader>
                  <TableRow style={{ borderBottom: "2px solid #dee2e6" }}>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                      Folio
                    </TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                      Cliente
                    </TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                      Canal
                    </TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                      Total
                    </TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                      Metodo de Pago
                    </TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                      Fecha
                    </TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                      Estado
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell className="align-middle">
                        <span
                          className="font-semibold"
                          style={{ fontSize: "13px" }}
                        >
                          {sale.orderNumber}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div>
                          <p className="mb-0 font-semibold" style={{ fontSize: "13px" }}>
                            {sale.clientInfo.name}
                          </p>
                          {sale.clientInfo.phone && (
                            <p
                              className="mb-0 text-muted-foreground"
                              style={{ fontSize: "11px" }}
                            >
                              {sale.clientInfo.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        {getChannelBadge(sale.salesChannel)}
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="font-bold text-green-500" style={{ fontSize: "14px" }}>
                          {formatCurrency(sale.total)}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span style={{ fontSize: "13px" }}>
                          {sale.paymentMethod.name}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-muted-foreground" />
                          <span style={{ fontSize: "12px" }}>
                            {formatDate(sale.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">{getStatusBadge(sale.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>
        <DialogFooter>
          <p className="text-muted-foreground mb-0 mr-auto" style={{ fontSize: "13px" }}>
            Total: {sales.length} venta{sales.length !== 1 ? "s" : ""} | Monto
            total: {formatCurrency(totalSales)}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SalesModal;
