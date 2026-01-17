"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, Buy } from "../types";
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
    <div className="mb-4">
      <Card className="border-0 shadow-sm rounded-[15px]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">No.</TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    CONCEPTO
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    DESCRIPCIÓN
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground">
                    SUCURSAL
                  </TableHead>
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
                    IMPORTE
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
                      className="border-b border-muted/50 hover:bg-muted/30"
                    >
                      <TableCell className="px-4 py-3">{index + 1}</TableCell>
                      <TableCell className="px-4 py-3">{buy.concept}</TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-muted-foreground text-[13px]">
                          {buy.description || "Sin descripción"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">{buy.branchName}</TableCell>
                      <TableCell className="px-4 py-3">
                        {formatDate(buy.paymentDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3">{buy.paymentMethod}</TableCell>
                      <TableCell className="px-4 py-3">{buy.userName}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(buy.amount)}
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

export default BuysTable;
