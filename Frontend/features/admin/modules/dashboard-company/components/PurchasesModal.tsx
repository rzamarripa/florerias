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
import { Purchase } from "../types";
import { ShoppingCart, Calendar, DollarSign, Package, Loader2 } from "lucide-react";

interface PurchasesModalProps {
  show: boolean;
  onHide: () => void;
  purchases: Purchase[];
  branchName: string;
  loading?: boolean;
}

const PurchasesModal: React.FC<PurchasesModalProps> = ({
  show,
  onHide,
  purchases,
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

  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-6xl">
        <DialogHeader className="bg-cyan-500 text-white p-4 -m-6 mb-0 rounded-t-lg">
          <DialogTitle className="flex items-center text-white">
            <ShoppingCart size={24} className="mr-2" />
            Compras de {branchName}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[600px] overflow-y-auto mt-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-3">Cargando compras...</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={48} className="text-muted-foreground mb-3 mx-auto" />
              <p className="text-muted-foreground">
                No hay compras registradas en el periodo seleccionado
              </p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="card border-0 h-full bg-cyan-50">
                  <div className="card-body text-center p-4">
                    <DollarSign size={24} className="text-cyan-500 mx-auto" />
                    <h5 className="mt-2 mb-0 font-bold text-cyan-500">
                      {formatCurrency(totalPurchases)}
                    </h5>
                    <p className="text-muted-foreground mb-0" style={{ fontSize: "12px" }}>
                      Total de Compras
                    </p>
                  </div>
                </div>
                <div className="card border-0 h-full bg-blue-50">
                  <div className="card-body text-center p-4">
                    <Package size={24} className="text-blue-500 mx-auto" />
                    <h5 className="mt-2 mb-0 font-bold text-blue-500">
                      {purchases.length}
                    </h5>
                    <p className="text-muted-foreground mb-0" style={{ fontSize: "12px" }}>
                      Compras Totales
                    </p>
                  </div>
                </div>
                <div className="card border-0 h-full bg-green-50">
                  <div className="card-body text-center p-4">
                    <DollarSign size={24} className="text-green-500 mx-auto" />
                    <h5 className="mt-2 mb-0 font-bold text-green-500">
                      {formatCurrency(totalPurchases / purchases.length)}
                    </h5>
                    <p className="text-muted-foreground mb-0" style={{ fontSize: "12px" }}>
                      Compra Promedio
                    </p>
                  </div>
                </div>
              </div>

              {/* Purchases table */}
              <Table>
                <TableHeader>
                  <TableRow style={{ borderBottom: "2px solid #dee2e6" }}>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Folio</TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Concepto</TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Proveedor</TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Usuario</TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>Importe</TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                      Metodo de Pago
                    </TableHead>
                    <TableHead style={{ fontSize: "13px", fontWeight: "600" }}>
                      Fecha de Pago
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase._id}>
                      <TableCell className="align-middle">
                        <span className="font-semibold" style={{ fontSize: "13px" }}>
                          #{purchase.folio}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div>
                          <p className="mb-0 font-semibold" style={{ fontSize: "13px" }}>
                            {purchase.concept?.name || "Sin concepto"}
                          </p>
                          {purchase.concept?.description && (
                            <p
                              className="mb-0 text-muted-foreground"
                              style={{ fontSize: "11px" }}
                            >
                              {purchase.concept.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        {purchase.provider ? (
                          <div>
                            <p className="mb-0 font-semibold" style={{ fontSize: "13px" }}>
                              {purchase.provider.tradeName || purchase.provider.legalName}
                            </p>
                            {purchase.provider.tradeName && purchase.provider.legalName && (
                              <p
                                className="mb-0 text-muted-foreground"
                                style={{ fontSize: "11px" }}
                              >
                                {purchase.provider.legalName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground" style={{ fontSize: "13px" }}>
                            Sin proveedor
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="align-middle">
                        <div>
                          <p className="mb-0 font-semibold" style={{ fontSize: "13px" }}>
                            {purchase.user.profile.fullName}
                          </p>
                          <p className="mb-0 text-muted-foreground" style={{ fontSize: "11px" }}>
                            @{purchase.user.username}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="font-bold text-cyan-500" style={{ fontSize: "14px" }}>
                          {formatCurrency(purchase.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <Badge
                          variant="secondary"
                          className="px-3 py-2"
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            borderRadius: "8px",
                          }}
                        >
                          {purchase.paymentMethod.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2 text-muted-foreground" />
                          <span style={{ fontSize: "12px" }}>
                            {formatDate(purchase.paymentDate)}
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
            Total: {purchases.length} compra{purchases.length !== 1 ? "s" : ""} | Monto
            total: {formatCurrency(totalPurchases)}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchasesModal;
