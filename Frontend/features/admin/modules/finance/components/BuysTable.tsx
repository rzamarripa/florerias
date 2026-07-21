"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, Buy } from "../types";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BuysTableProps {
  filters: FinanceFilters;
}

const BuysTable: React.FC<BuysTableProps> = ({ filters }) => {
  const [buys, setBuys] = useState<Buy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log("BuysTable useEffect - filters:", filters);
    loadBuys();
  }, [filters]);

  const loadBuys = async () => {
    try {
      setLoading(true);
      console.log("Loading buys with filters:", filters);
      const response = await financeService.getBuysByBranch(filters);
      console.log("Response received:", response);
      if (response.data) {
        setBuys(response.data);
        console.log("Buys set to state:", response.data);
      } else {
        console.log("No data in response");
        setBuys([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar compras");
      console.error("Error loading buys:", error);
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground mt-3">Cargando compras...</p>
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
              Concepto
            </TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">
              Descripción
            </TableHead>
            <TableHead className="py-3 px-4 font-semibold text-muted-foreground">
              Sucursal
            </TableHead>
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
              Importe
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buys.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                No se encontraron compras
              </TableCell>
            </TableRow>
          ) : (
            buys.map((buy, index) => (
              <TableRow
                key={buy._id}
                className="hover:bg-muted/30"
              >
                <TableCell className="py-3 px-4">{index + 1}</TableCell>
                <TableCell className="py-3 px-4">{buy.concept}</TableCell>
                <TableCell className="py-3 px-4">
                  <span className="text-muted-foreground text-[13px]">
                    {buy.description || "Sin descripción"}
                  </span>
                </TableCell>
                <TableCell className="py-3 px-4">{buy.branchName}</TableCell>
                <TableCell className="py-3 px-4">
                  {formatDate(buy.paymentDate)}
                </TableCell>
                <TableCell className="py-3 px-4">{buy.paymentMethod}</TableCell>
                <TableCell className="py-3 px-4">{buy.userName}</TableCell>
                <TableCell className="py-3 px-4 text-right font-semibold">
                  {formatCurrency(buy.amount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default BuysTable;
