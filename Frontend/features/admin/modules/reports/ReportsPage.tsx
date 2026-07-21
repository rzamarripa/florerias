"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Calendar,
  Filter,
  Loader2,
  Package,
  Tag,
  Download,
} from "lucide-react";
import { toast } from "react-toastify";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { reportsService } from "./services/reports";
import {
  ReportFilters,
  SalesByCategoryRow,
  SalesByProductRow,
  ReportTotals,
} from "./types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value || 0);

const getDefaultFilters = (): ReportFilters => {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const iso = (d: Date) => d.toISOString().split("T")[0];
  return {
    startDate: iso(first),
    endDate: iso(today),
  };
};

const toCsv = (headers: string[], rows: (string | number)[][]) => {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
};

const downloadCsv = (name: string, csv: string) => {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

const ReportsPage: React.FC = () => {
  const activeBranch = useActiveBranchStore((s) => s.activeBranch);
  const userRole = useUserRoleStore((s) => s.role);
  const isAdmin = userRole?.toLowerCase() === "administrador";

  const [filters, setFilters] = useState<ReportFilters>(getDefaultFilters());
  const [tab, setTab] = useState<"product" | "category">("product");

  const [loadingProduct, setLoadingProduct] = useState(false);
  const [productRows, setProductRows] = useState<SalesByProductRow[]>([]);
  const [productTotals, setProductTotals] = useState<ReportTotals>({
    quantity: 0,
    amount: 0,
  });

  const [loadingCategory, setLoadingCategory] = useState(false);
  const [categoryRows, setCategoryRows] = useState<SalesByCategoryRow[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<ReportTotals>({
    quantity: 0,
    amount: 0,
  });

  const effectiveFilters = useMemo<ReportFilters>(() => {
    return {
      ...filters,
      branchId: isAdmin ? activeBranch?._id : undefined,
    };
  }, [filters, isAdmin, activeBranch]);

  const canQuery = isAdmin ? !!activeBranch?._id : true;

  const loadProductReport = async () => {
    if (!canQuery) {
      toast.warning("Selecciona una sucursal para ver el reporte");
      return;
    }
    try {
      setLoadingProduct(true);
      const res = await reportsService.getSalesByProduct(effectiveFilters);
      setProductRows(res.data.rows);
      setProductTotals(res.data.totals);
    } catch (error: any) {
      toast.error(error.message || "Error al generar el reporte por producto");
    } finally {
      setLoadingProduct(false);
    }
  };

  const loadCategoryReport = async () => {
    if (!canQuery) {
      toast.warning("Selecciona una sucursal para ver el reporte");
      return;
    }
    try {
      setLoadingCategory(true);
      const res = await reportsService.getSalesByCategory(effectiveFilters);
      setCategoryRows(res.data.rows);
      setCategoryTotals(res.data.totals);
    } catch (error: any) {
      toast.error(error.message || "Error al generar el reporte por categoría");
    } finally {
      setLoadingCategory(false);
    }
  };

  useEffect(() => {
    if (!canQuery) return;
    if (tab === "product") {
      loadProductReport();
    } else {
      loadCategoryReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, activeBranch?._id]);

  const handleApply = () => {
    if (tab === "product") loadProductReport();
    else loadCategoryReport();
  };

  const exportProductCsv = () => {
    const csv = toCsv(
      ["Producto", "Cantidad", "Órdenes", "Total"],
      productRows.map((r) => [
        r.productName,
        r.quantity,
        r.ordersCount,
        r.amount.toFixed(2),
      ])
    );
    downloadCsv(
      `ventas-por-producto_${filters.startDate}_${filters.endDate}.csv`,
      csv
    );
  };

  const exportCategoryCsv = () => {
    const csv = toCsv(
      ["Categoría", "Cantidad", "Órdenes", "Total"],
      categoryRows.map((r) => [
        r.categoryName,
        r.quantity,
        r.ordersCount,
        r.amount.toFixed(2),
      ])
    );
    downloadCsv(
      `ventas-por-categoria_${filters.startDate}_${filters.endDate}.csv`,
      csv
    );
  };

  return (
    <div className="py-4 px-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-bold text-2xl mb-1">Reportes</h2>
        <p className="text-muted-foreground mb-0">
          Consulta ventas por producto y por categoría en un rango de fechas
          {isAdmin && activeBranch?.branchName && (
            <>
              {" "}
              — Sucursal:{" "}
              <span className="font-medium text-foreground">
                {activeBranch.branchName}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-sm mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Fecha inicial
              </Label>
              <Input
                type="date"
                value={filters.startDate}
                max={filters.endDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, startDate: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Fecha final
              </Label>
              <Input
                type="date"
                value={filters.endDate}
                min={filters.startDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, endDate: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Button
                className="w-full"
                onClick={handleApply}
                disabled={loadingProduct || loadingCategory || !canQuery}
              >
                <Filter className="w-4 h-4 mr-1" />
                Aplicar
              </Button>
            </div>
            <div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setFilters(getDefaultFilters())}
              >
                Mes actual
              </Button>
            </div>
          </div>
          {isAdmin && !activeBranch?._id && (
            <p className="mt-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
              Selecciona una sucursal activa para consultar los reportes.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "product" | "category")}>
        <TabsList className="mb-3">
          <TabsTrigger value="product" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Ventas por Producto
          </TabsTrigger>
          <TabsTrigger value="category" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Ventas por Categoría
          </TabsTrigger>
        </TabsList>

        {/* Reporte por producto */}
        <TabsContent value="product">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h5 className="font-bold mb-0">Ventas por Producto</h5>
                  <Badge variant="outline">
                    {productRows.length} productos
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportProductCsv}
                  disabled={loadingProduct || productRows.length === 0}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar CSV
                </Button>
              </div>

              {loadingProduct ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : productRows.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  <Package size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="mb-0">Sin ventas en el rango seleccionado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Órdenes</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productRows.map((r, i) => (
                        <TableRow key={`${r.productId ?? "sin-id"}-${i}`}>
                          <TableCell className="font-medium">
                            {r.productName}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.ordersCount}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(r.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/40">
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {productTotals.quantity}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(productTotals.amount)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reporte por categoría */}
        <TabsContent value="category">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h5 className="font-bold mb-0">Ventas por Categoría</h5>
                  <Badge variant="outline">
                    {categoryRows.length} categorías
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCategoryCsv}
                  disabled={loadingCategory || categoryRows.length === 0}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar CSV
                </Button>
              </div>

              {loadingCategory ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : categoryRows.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  <Tag size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="mb-0">Sin ventas en el rango seleccionado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Órdenes</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryRows.map((r, i) => (
                        <TableRow key={`${r.categoryId ?? "sin-id"}-${i}`}>
                          <TableCell className="font-medium">
                            {r.categoryName}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.ordersCount}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(r.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/40">
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">
                          {categoryTotals.quantity}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(categoryTotals.amount)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
