"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { dashboardItemsService } from "./services/dashboardItems";
import { DashboardMetrics, Order, InsumoDetail } from "./types";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { apiCall } from "@/utils/api";
import InsumosTable from "./components/InsumosTable";

const DashboardItemsPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [insumoDetails, setInsumoDetails] = useState<InsumoDetail[]>([]);

  const { activeBranch } = useActiveBranchStore();
  const { getIsAdmin, getIsManager } = useUserRoleStore();
  const { getUserId } = useUserSessionStore();

  // Obtener el branch ID segun el rol del usuario
  useEffect(() => {
    const fetchBranchId = async () => {
      try {
        const isAdmin = getIsAdmin();
        const isManager = getIsManager();

        if (isAdmin) {
          // Para administrador, obtener del storage active-branch
          if (activeBranch?._id) {
            setBranchId(activeBranch._id);
          } else {
            toast.error("Por favor selecciona una sucursal");
            setLoading(false);
          }
        } else if (isManager) {
          // Para gerente, buscar su sucursal en cv_branches
          const userId = getUserId();
          if (userId) {
            try {
              // Buscar sucursales donde el usuario es gerente
              const response = await apiCall<{
                success: boolean;
                data: Array<{ _id: string }>;
              }>(`/branches?manager=${userId}`);

              // apiCall ya devuelve la respuesta desenvuelta
              if (
                "data" in response &&
                Array.isArray(response.data) &&
                response.data.length > 0
              ) {
                setBranchId(response.data[0]._id);
              } else {
                toast.error("No tienes una sucursal asignada como gerente");
                setLoading(false);
              }
            } catch (error) {
              console.error("Error fetching manager branch:", error);
              toast.error("Error al obtener la sucursal del gerente");
              setLoading(false);
            }
          }
        } else {
          toast.error("No tienes permisos para acceder a este dashboard");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in fetchBranchId:", error);
        setLoading(false);
      }
    };

    fetchBranchId();
  }, [activeBranch, getIsAdmin, getIsManager, getUserId]);

  // Cargar ordenes y calcular metricas cuando se tenga el branchId
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!branchId) return;

      try {
        setLoading(true);

        // Obtener todas las ordenes de la sucursal
        const response = await dashboardItemsService.getOrders({
          branchId,
          limit: 1000, // Obtener todas las ordenes
        });

        if (response.data) {
          // Filtrar solo ordenes del mes actual
          const currentMonthOrders =
            dashboardItemsService.filterCurrentMonthOrders(response.data);
          setOrders(currentMonthOrders);

          // Calcular metricas (ahora es async)
          const calculatedMetrics =
            await dashboardItemsService.calculateDashboardMetrics(
              currentMonthOrders
            );
          setMetrics(calculatedMetrics);

          // Extraer detalles de insumos
          const insumos = await dashboardItemsService.extractInsumoDetails(
            currentMonthOrders,
            branchId
          );
          setInsumoDetails(insumos);
        }
      } catch (error: any) {
        toast.error(error.message || "Error al cargar los datos del dashboard");
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [branchId]);

  if (loading) {
    return (
      <div
        className="flex justify-center items-center"
        style={{ minHeight: "400px" }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-muted-foreground" style={{ padding: "40px" }}>
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="mb-4">
        <div>
          <h2 className="mb-3">Dashboard de Materiales e Items</h2>
          <p className="text-muted-foreground">
            Analisis de uso de materiales y productos en las ordenes
          </p>
        </div>
      </div>

      {/* Metricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <Card className="shadow-sm h-full">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h6 className="text-muted-foreground mb-0">Ganancias Insumos Extras</h6>
                <small className="text-green-500">
                  {metrics.totalOrdersChange}
                </small>
              </div>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "#f0f8ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#4a90e2",
                  }}
                />
              </div>
            </div>
            <h3 className="mb-0">
              ${(metrics.totalRevenue / 1000).toFixed(1)}K
            </h3>
            <small className="text-muted-foreground">This Month</small>
          </CardContent>
        </Card>

        <Card className="shadow-sm h-full">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h6 className="text-muted-foreground mb-0">Gastos Insumos Extras</h6>
                <small className="text-cyan-500">
                  {metrics.totalProfitStatus}
                </small>
              </div>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "#e8f5e9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#66bb6a",
                  }}
                />
              </div>
            </div>
            <h3 className="mb-0">
              ${(metrics.netProfit / 1000).toFixed(1)}K
            </h3>
            <small className="text-muted-foreground">This Month</small>
          </CardContent>
        </Card>

        <Card className="shadow-sm h-full">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h6 className="text-muted-foreground mb-0">Gastos Insumos Produccion</h6>
                <small className="text-green-500">
                  {metrics.cashFlowChange}
                </small>
              </div>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "#f3e5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#ab47bc",
                  }}
                />
              </div>
            </div>
            <h3 className="mb-0">${(metrics.cashFlow / 1000).toFixed(1)}K</h3>
            <small className="text-muted-foreground">This Month</small>
          </CardContent>
        </Card>

        <Card className="shadow-sm h-full">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h6 className="text-muted-foreground mb-0">Ganancia Neta Total</h6>
                <small
                  className={
                    metrics.totalRevenue -
                      (metrics.netProfit + metrics.cashFlow) >=
                    0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {metrics.totalRevenue -
                    (metrics.netProfit + metrics.cashFlow) >=
                  0
                    ? "Positivo"
                    : "Negativo"}
                </small>
              </div>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "#fff8e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#ffa726",
                  }}
                />
              </div>
            </div>
            <h3 className="mb-0">
              $
              {(
                (metrics.totalRevenue -
                  (metrics.netProfit + metrics.cashFlow)) /
                1000
              ).toFixed(1)}
              K
            </h3>
            <small className="text-muted-foreground">This Month</small>
          </CardContent>
        </Card>
      </div>

      {/* Reportes trimestrales y metricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
        <div className="md:col-span-6">
          <Card className="shadow-sm h-full">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="mb-0">
                  Reportes Semanales{" "}
                  <Badge variant="default" className="ml-2">Mes Actual</Badge>
                </h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2">SEMANA</th>
                      <th className="text-left p-2">INGRESOS</th>
                      <th className="text-left p-2">GASTOS</th>
                      <th className="text-left p-2">MARGEN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.quarterlyReports.map((report, index) => (
                      <tr key={index}>
                        <td className="p-2">
                          <div>
                            <strong>{report.quarter}</strong>
                            <br />
                            <small className="text-muted-foreground">
                              {report.period}
                            </small>
                          </div>
                        </td>
                        <td className="text-green-500 p-2">
                          ${report.revenue.toFixed(2)}
                        </td>
                        <td className="text-red-500 p-2">
                          ${report.expense.toFixed(2)}
                        </td>
                        <td
                          className={`p-2 font-bold ${
                            report.margin >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          ${report.margin.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card
            className="shadow-sm h-full"
            style={{ backgroundColor: "#2196f3", color: "white" }}
          >
            <CardContent className="p-4">
              <h1 className="text-5xl mb-3">{metrics.totalOrders}</h1>
              <h5>Orders</h5>
              <p className="mb-4" style={{ opacity: 0.9 }}>
                You have received {metrics.totalOrders} new orders, indicating a
                healthy sales trend over the past period.
              </p>
              <div className="flex justify-between items-end mt-4">
                {metrics.ordersOverTime.map((period, index) => (
                  <div
                    key={index}
                    style={{
                      width: "12%",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        height: `${
                          (period.count /
                            Math.max(
                              ...metrics.ordersOverTime.map((p) => p.count)
                            )) *
                          100
                        }px`,
                        backgroundColor: "rgba(255,255,255,0.8)",
                        borderRadius: "4px 4px 0 0",
                        marginBottom: "5px",
                        minHeight: "20px",
                      }}
                    />
                    <small style={{ fontSize: "10px", opacity: 0.8 }}>
                      {period.period}
                    </small>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="shadow-sm h-full">
            <CardContent className="p-4">
              <h1 className="text-5xl mb-3 text-blue-500">
                ${(metrics.totalProfit / 1000).toFixed(1)}k
              </h1>
              <h5>Profit</h5>
              <p className="text-muted-foreground mb-4">
                Your total profit reached $
                {(metrics.totalProfit / 1000).toFixed(1)}k this month, showing
                stable and positive business growth.
              </p>
              <div style={{ height: "80px", position: "relative" }}>
                <svg
                  width="100%"
                  height="100%"
                  style={{ position: "absolute", bottom: 0 }}
                >
                  <polyline
                    fill="none"
                    stroke="#2196f3"
                    strokeWidth="2"
                    points={metrics.profitOverTime
                      .slice(-10)
                      .map((p, i, arr) => {
                        const x = (i / (arr.length - 1)) * 100;
                        const maxProfit = Math.max(
                          ...arr.map((pt) => pt.profit)
                        );
                        const y = 80 - (p.profit / maxProfit) * 60;
                        return `${x}%,${y}`;
                      })
                      .join(" ")}
                  />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabla de Insumos por Orden */}
      <div className="grid grid-cols-1">
        <div className="col-span-1">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h5 className="mb-1">Detalle de Insumos por Orden</h5>
                  <p className="text-muted-foreground mb-0">
                    Analisis detallado del uso de insumos en cada orden del mes
                    actual
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="text-center px-3">
                    <h6 className="mb-0 text-blue-500">
                      {insumoDetails.length}
                    </h6>
                    <small className="text-muted-foreground">Total Insumos</small>
                  </div>
                  <div className="text-center px-3 border-l">
                    <h6 className="mb-0 text-green-500">
                      {insumoDetails.filter((i) => i.isExtra).length}
                    </h6>
                    <small className="text-muted-foreground">Extras</small>
                  </div>
                  <div className="text-center px-3 border-l">
                    <h6 className="mb-0 text-yellow-500">
                      {insumoDetails.filter((i) => !i.isExtra).length}
                    </h6>
                    <small className="text-muted-foreground">Produccion</small>
                  </div>
                </div>
              </div>
              <InsumosTable insumos={insumoDetails} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardItemsPage;
