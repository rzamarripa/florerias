"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2 } from "lucide-react";
import { companySalesService } from "./services/companySales";
import { BranchSalesData } from "./types";
import { formatCurrency } from "@/utils";
import { toast } from "react-toastify";
import SalesChart from "./components/SalesChart";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { branchesService } from "../branches/services/branches";

export default function CompanySalesPage() {
  const [loading, setLoading] = useState(false);
  const [branchesSales, setBranchesSales] = useState<BranchSalesData[]>([]);
  const userId = useUserSessionStore((state) => state.getUserId());

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Cargar datos de sucursales del usuario administrador
  const loadBranchesSales = async () => {
    try {
      setLoading(true);

      if (!userId) {
        toast.error("No se pudo obtener el usuario actual");
        return;
      }

      // Primero obtener las sucursales donde el usuario es administrador
      const branchesResponse = await branchesService.getAllBranches({
        managerId: userId,
        limit: 100
      });

      if (!branchesResponse.success || !branchesResponse.data?.length) {
        setBranchesSales([]);
        return;
      }

      // Para cada sucursal, obtener sus datos de ventas
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Obtener los IDs de las sucursales
      const branchIds = branchesResponse.data.map(branch => branch._id);

      // Llamar al endpoint para obtener las ventas de estas sucursales específicas
      const salesResponse = await companySalesService.getBranchesSales({
        branchIds,
        ...params
      });

      if (salesResponse.success && salesResponse.data) {
        setBranchesSales(salesResponse.data);
      }
    } catch (error) {
      console.error("Error al cargar ventas de sucursales:", error);
      toast.error("Error al cargar las ventas de sucursales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar datos del día actual al inicio
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    loadBranchesSales();
  }, []);

  const handleClearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    loadBranchesSales();
  };

  // Preparar datos para la gráfica con datos reales de sucursales
  const chartData = useMemo(() => {
    // Usar los nombres de las sucursales como etiquetas
    const labels = branchesSales.slice(0, 10).map(branch => {
      // Acortar nombres largos
      const name = `${branch.branchName} (${branch.branchCode})`;
      return name.length > 20 ? name.substring(0, 17) + '...' : name;
    });

    // Extraer datos reales de cada sucursal
    const salesData = branchesSales.slice(0, 10).map(branch => branch.totalSalesWithoutDelivery); // S/S
    const deliveryData = branchesSales.slice(0, 10).map(branch => branch.totalDeliveryService); // Servicio
    const paidData = branchesSales.slice(0, 10).map(branch => branch.totalPaid);
    const royaltiesData = branchesSales.slice(0, 10).map(branch => branch.royaltiesAmount);
    const brandAdvData = branchesSales.slice(0, 10).map(branch => branch.brandAdvertisingAmount);
    const branchAdvData = branchesSales.slice(0, 10).map(branch => branch.branchAdvertisingAmount);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Ventas S/S',
          data: salesData,
          borderColor: '#1ab394',
          backgroundColor: 'rgba(26, 179, 148, 0.1)',
        },
        {
          label: 'Servicio',
          data: deliveryData,
          borderColor: '#9b59b6',
          backgroundColor: 'rgba(155, 89, 182, 0.1)',
        },
        {
          label: 'Pagado',
          data: paidData,
          borderColor: '#f8ac59',
          backgroundColor: 'rgba(248, 172, 89, 0.1)',
        },
        {
          label: 'Regalías',
          data: royaltiesData,
          borderColor: '#ed5565',
          backgroundColor: 'rgba(237, 85, 101, 0.1)',
        },
        {
          label: 'Publicidad Marca',
          data: brandAdvData,
          borderColor: '#1c84c6',
          backgroundColor: 'rgba(28, 132, 198, 0.1)',
        },
        {
          label: 'Publicidad Sucursal',
          data: branchAdvData,
          borderColor: '#23c6c8',
          backgroundColor: 'rgba(35, 198, 200, 0.1)',
        }
      ]
    };
  }, [branchesSales]);

  return (
    <div className="container mx-auto py-1">
      {/* Header */}
      <div className="mb-1">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="mb-0 font-bold text-2xl">Ventas de Sucursales del Administrador</h2>
            <p className="text-muted-foreground mb-0 text-sm">
              Resumen de ventas por sucursal
            </p>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="shadow-sm mb-1 rounded-lg">
        <CardContent className="py-1 px-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                Fecha inicio
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-muted-foreground">
                Fecha fin
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={loadBranchesSales}
                disabled={loading}
                size="sm"
                className="px-3"
              >
                <Search size={16} className="mr-1" />
                Buscar
              </Button>

              <Button
                variant="outline"
                onClick={handleClearFilters}
                size="sm"
              >
                <X size={16} className="mr-1" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Chart */}
      {branchesSales.length > 0 && (
        <div className="mb-2">
          <SalesChart
            data={chartData}
            title="Ventas"
          />
        </div>
      )}

      {/* Main Table */}
      <Card className="shadow-sm rounded-lg">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center p-3">
              <Loader2 className="animate-spin text-primary mx-auto" size={24} />
              <span className="sr-only">Cargando...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className=" px-4 py-2 text-sm font-bold">
                      Sucursal
                    </TableHead>
                    <TableHead className=" text-center py-2 text-sm font-bold">
                      Código
                    </TableHead>
                    <TableHead className=" text-center py-2 text-sm font-bold">
                      Órdenes
                    </TableHead>
                    <TableHead className=" text-right px-3 py-2 text-sm font-bold">
                      Total Ventas
                    </TableHead>
                    <TableHead className=" text-right px-3 py-2 text-sm font-bold">
                      Servicio
                    </TableHead>
                    <TableHead className=" text-right px-3 py-2 text-sm font-bold">
                      S/S
                    </TableHead>
                    <TableHead className=" text-right px-3 py-2 text-sm font-bold">
                      Total Pagado
                    </TableHead>
                    <TableHead className=" text-right px-3 py-2 text-sm font-bold">
                      Regalías
                    </TableHead>
                    <TableHead className=" text-right px-3 py-2 text-sm font-bold">
                      Pub. Marca
                    </TableHead>
                    <TableHead className=" text-right px-3 py-2 text-sm font-bold">
                      Pub. Sucursal
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branchesSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-3 text-muted-foreground">
                        No se encontraron datos para el período seleccionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    branchesSales.map((branch) => (
                      <TableRow key={branch.branchId}>
                        <TableCell className="px-4 py-2">
                          <span className="font-semibold">
                            {branch.branchName}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Badge variant="secondary">
                            {branch.branchCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          {branch.totalOrders}
                        </TableCell>
                        <TableCell className="text-right px-3 py-2">
                          <span className="font-semibold">
                            {formatCurrency(branch.totalSales)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-3 py-2">
                          <span className="font-semibold">
                            {formatCurrency(branch.totalDeliveryService)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-3 py-2">
                          <span className="font-semibold text-green-500">
                            {formatCurrency(branch.totalSalesWithoutDelivery)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right px-3 py-2">
                          <div>
                            <span className="font-semibold">
                              {formatCurrency(branch.totalPaid)}
                            </span>
                            {branch.totalSalesWithoutDelivery > 0 && (
                              <div>
                                <small className="text-muted-foreground">
                                  {(
                                    (branch.totalPaid / branch.totalSalesWithoutDelivery) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </small>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-3 py-2">
                          {branch.royaltiesAmount === 0 ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <div>
                              <span className="font-semibold">
                                {formatCurrency(branch.royaltiesAmount)}
                              </span>
                              <div>
                                <small className="text-muted-foreground">
                                  {branch.royalties.toFixed(2)}%
                                </small>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-3 py-2">
                          <div>
                            <span className="font-semibold">
                              {formatCurrency(branch.brandAdvertisingAmount)}
                            </span>
                            <div>
                              <small className="text-muted-foreground">
                                {branch.brandAdvertising.toFixed(2)}%
                              </small>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-3 py-2">
                          <div>
                            <span className="font-semibold">
                              {formatCurrency(branch.branchAdvertisingAmount)}
                            </span>
                            <div>
                              <small className="text-muted-foreground">
                                {branch.branchAdvertising.toFixed(2)}%
                              </small>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
