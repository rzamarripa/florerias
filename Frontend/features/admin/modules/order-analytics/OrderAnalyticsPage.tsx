"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  Download,
  Filter,
  AlertTriangle,
  Award,
  Loader2,
} from "lucide-react";
import { orderAnalyticsService } from "./services/orderAnalytics";
import { AnalyticsDashboardData, AnalyticsFilters } from "./types";
import { toast } from "react-toastify";
import SalesTrendChart from "./components/SalesTrendChart";
import CategoryPieChart from "./components/CategoryPieChart";
import PaymentMethodChart from "./components/PaymentMethodChart";
import SalesByHourChart from "./components/SalesByHourChart";
import SalesByDayChart from "./components/SalesByDayChart";
import MonthComparisonChart from "./components/MonthComparisonChart";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useBranchModalStore } from "@/stores/branchModalStore";
import BranchSelectionModal from "@/components/branches/BranchSelectionModal";
import BranchModal from "@/features/admin/modules/branches/components/BranchModal";
import { companiesService } from "@/features/admin/modules/companies/services/companies";

const OrderAnalyticsPage: React.FC = () => {
  const activeBranch = useActiveBranchStore((state) => state.activeBranch);
  const userRole = useUserRoleStore((state) => state.role);

  const {
    showBranchSelectionModal,
    showCreateBranchModal,
    isRequiredSelection,
    openBranchSelectionModal,
    closeBranchSelectionModal,
    openCreateBranchModal,
    closeCreateBranchModal,
  } = useBranchModalStore();

  const [loading, setLoading] = useState<boolean>(false);
  const [dashboardData, setDashboardData] =
    useState<AnalyticsDashboardData | null>(null);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    period: "day",
    branchId: activeBranch?._id || undefined,
  });

  // Actualizar branchId cuando cambie la sucursal activa
  useEffect(() => {
    if (activeBranch?._id) {
      setFilters((prev) => ({ ...prev, branchId: activeBranch._id }));
    }
  }, [activeBranch]);

  // Cargar empresa del usuario administrador
  useEffect(() => {
    const loadUserCompany = async () => {
      const isAdmin = userRole?.toLowerCase() === "administrador";
      if (!isAdmin) return;

      try {
        const company = await companiesService.getMyCompany();
        console.log("empresa de admin: ", company);
        setUserCompany(company || null);
      } catch (error) {
        console.error("Error al cargar empresa del usuario:", error);
        setUserCompany(null);
      }
    };

    loadUserCompany();
  }, [userRole]);

  // Efecto para mostrar modal de selección si es Administrador sin sucursal
  useEffect(() => {
    const isAdmin = userRole?.toLowerCase() === "administrador";

    // Verificar directamente desde el store persistente
    const currentActiveBranch = useActiveBranchStore.getState().activeBranch;

    // Si es Administrador y no tiene sucursal activa, abrir modal de selección
    if (isAdmin && !currentActiveBranch) {
      // El modal de selección se encargará de verificar si hay sucursales
      // y llamará a handleNoBranchesFound si no las hay
      openBranchSelectionModal(true);
    } else if (currentActiveBranch) {
      // Si hay sucursal activa, cerrar los modales
      console.log("ya hay sucursal activa");
      console.log("cerrando");
      closeBranchSelectionModal();
      closeCreateBranchModal();
    }
  }, [
    userRole,
    activeBranch,
    openBranchSelectionModal,
    closeBranchSelectionModal,
    closeCreateBranchModal,
  ]);

  // Callback cuando no se encuentran sucursales en el modal de selección
  const handleNoBranchesFound = useCallback(() => {
    toast.warning(
      "Crea una sucursal para que puedas acceder a las funciones del sistema",
      {
        autoClose: 5000,
        position: "top-center",
      }
    );
    // Abrir el modal de creación
    openCreateBranchModal();
  }, [openCreateBranchModal]);

  // Cargar datos solo cuando hay sucursal activa (para Administradores)
  useEffect(() => {
    console.log("cargando datos: ", activeBranch);
    const isAdmin =
      userRole?.toLowerCase() === "administrador" ||
      userRole?.toLowerCase() === "admin";

    // Si es administrador, solo cargar si hay sucursal activa
    if (isAdmin) {
      console.log("es admin");
      if (activeBranch) {
        console.log("hay sucursal activa");
        loadDashboardData();
      }
      console.log("no hay sucursal activa");
    } else {
      // Para otros roles (Gerente), cargar normalmente
      loadDashboardData();
    }
  }, [activeBranch]);

  const loadDashboardData = async () => {
    // Validación adicional: no cargar si es admin sin sucursal
    const isAdmin =
      userRole?.toLowerCase() === "administrador" ||
      userRole?.toLowerCase() === "admin";
    if (isAdmin && !activeBranch) {
      console.log("No se pueden cargar datos sin sucursal activa");
      return;
    }

    try {
      setLoading(true);
      const response = await orderAnalyticsService.getDashboardData(filters);
      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar datos analíticos");
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadDashboardData();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  // Stat Card Component
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: any;
    color: string;
    bgColor: string;
    trend?: number;
  }> = ({ title, value, icon: Icon, color, bgColor, trend }) => (
    <Card className="border-0 shadow-sm h-full overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <p className="text-muted-foreground mb-2 font-medium text-sm">{title}</p>
            <h3 className="mb-0 font-bold text-2xl">{value}</h3>
            {trend !== undefined && (
              <div className="mt-2">
                <Badge
                  variant={trend >= 0 ? "default" : "destructive"}
                  className="bg-opacity-10"
                  style={{
                    backgroundColor: trend >= 0 ? "#dcfce7" : "#fee2e2",
                    color: trend >= 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {trend >= 0 ? "+" : ""}
                  {trend.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: bgColor,
            }}
          >
            <Icon size={28} color={color} strokeWidth={2} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Loading Skeleton
  if (loading && !dashboardData) {
    return (
      <div className="container mx-auto py-4">
        <div
          className="flex justify-center items-center"
          style={{ minHeight: "400px" }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {
    totalSales: 0,
    totalRevenue: 0,
    averageTicket: 0,
    totalProducts: 0,
    percentageChange: 0,
  };

  // Usar el cambio porcentual de la comparación mensual para mayor precisión
  const monthlyRevenueChange =
    dashboardData?.monthlyComparison?.percentageChange?.revenue || 0;

  return (
    <div className="container mx-auto py-4 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-bold text-2xl mb-1">Dashboard Analítico</h2>
          <p className="text-muted-foreground mb-0">
            Análisis completo de ventas y rendimiento
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar Reporte
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Fecha Inicio
              </Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Fecha Fin
              </Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Periodo</Label>
              <Select
                value={filters.period}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    period: value as any,
                  })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mes</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                className="w-full"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                <Filter className="w-4 h-4 mr-1" />
                {loading ? "Cargando..." : "Aplicar"}
              </Button>
            </div>
            <div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const now = new Date();
                  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  setFilters({
                    startDate: firstDay.toISOString().split("T")[0],
                    endDate: lastDay.toISOString().split("T")[0],
                    period: "day",
                  });
                }}
              >
                Mes Actual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard
          title="Total Ventas"
          value={summary.totalSales}
          icon={ShoppingCart}
          color="#3b82f6"
          bgColor="#dbeafe"
          trend={dashboardData?.monthlyComparison?.percentageChange?.sales}
        />
        <StatCard
          title="Ingresos"
          value={formatCurrency(summary.totalRevenue)}
          icon={DollarSign}
          color="#10b981"
          bgColor="#d1fae5"
          trend={monthlyRevenueChange}
        />
        <StatCard
          title="Ticket Promedio"
          value={formatCurrency(summary.averageTicket)}
          icon={TrendingUp}
          color="#8b5cf6"
          bgColor="#ede9fe"
        />
        <StatCard
          title="Productos Vendidos"
          value={summary.totalProducts}
          icon={Package}
          color="#f59e0b"
          bgColor="#fef3c7"
        />
        <Card className="border-0 shadow-sm h-full overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <p className="text-muted-foreground mb-2 font-medium text-sm">
                  vs Mes Anterior
                </p>
                <h3 className="mb-0 font-bold text-2xl">
                  {monthlyRevenueChange >= 0 ? "+" : ""}
                  {monthlyRevenueChange.toFixed(1)}%
                </h3>
                <div className="mt-2">
                  <Badge
                    variant={monthlyRevenueChange >= 0 ? "default" : "destructive"}
                    className="bg-opacity-10"
                    style={{
                      backgroundColor: monthlyRevenueChange >= 0 ? "#dcfce7" : "#fee2e2",
                      color: monthlyRevenueChange >= 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {monthlyRevenueChange >= 0 ? "Crecimiento" : "Disminucion"}
                  </Badge>
                </div>
              </div>
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: "56px",
                  height: "56px",
                  backgroundColor:
                    monthlyRevenueChange >= 0 ? "#d1fae5" : "#fee2e2",
                }}
              >
                <TrendingUp
                  size={28}
                  color={monthlyRevenueChange >= 0 ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  style={{
                    transform:
                      monthlyRevenueChange >= 0
                        ? "rotate(0deg)"
                        : "rotate(180deg)",
                    transition: "transform 0.3s ease",
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm h-full">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-bold mb-0">Ventas Ultimos 7 Dias</h5>
                <div className="flex gap-3">
                  <div className="flex items-center">
                    <div
                      className="rounded-full mr-2"
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: "#3b82f6",
                      }}
                    />
                    <small className="text-muted-foreground">Actual</small>
                  </div>
                  <div className="flex items-center">
                    <div
                      className="rounded-full mr-2"
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: "#93c5fd",
                      }}
                    />
                    <small className="text-muted-foreground">Anterior</small>
                  </div>
                </div>
              </div>
              <div className="relative" style={{ height: "300px" }}>
                {dashboardData?.salesTrend &&
                dashboardData.salesTrend.length > 0 ? (
                  <SalesTrendChart data={dashboardData.salesTrend} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp size={48} className="mb-3 opacity-50 mx-auto" />
                      <p>No hay datos de ventas disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-0 shadow-sm h-full">
            <CardContent className="p-4">
              <h5 className="font-bold mb-3">Mes Actual vs Anterior</h5>
              <div className="relative" style={{ height: "300px" }}>
                {dashboardData?.monthlyComparison ? (
                  <MonthComparisonChart
                    data={dashboardData.monthlyComparison}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Package size={48} className="mb-3 opacity-50 mx-auto" />
                      <p>No hay datos disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <Card className="border-0 shadow-sm h-full">
          <CardContent className="p-4">
            <h5 className="font-bold mb-3">Ventas por Categoria</h5>
            <div className="relative" style={{ height: "300px" }}>
              {dashboardData?.salesByCategory &&
              dashboardData.salesByCategory.length > 0 ? (
                <CategoryPieChart data={dashboardData.salesByCategory} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Package size={48} className="mb-3 opacity-50 mx-auto" />
                    <p>No hay datos disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm h-full">
          <CardContent className="p-4">
            <h5 className="font-bold mb-3">Metodos de Pago</h5>
            <div className="relative" style={{ height: "300px" }}>
              {dashboardData?.salesByPaymentMethod &&
              dashboardData.salesByPaymentMethod.length > 0 ? (
                <PaymentMethodChart
                  data={dashboardData.salesByPaymentMethod}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <DollarSign size={48} className="mb-3 opacity-50 mx-auto" />
                    <p>No hay datos disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm h-full">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
              <h5 className="font-bold mb-0">Stock Bajo</h5>
            </div>
            <div style={{ maxHeight: "280px", overflowY: "auto" }}>
              {dashboardData?.lowStockProducts?.length ? (
                dashboardData.lowStockProducts.map((product, index) => (
                  <div
                    key={`low-stock-${index}-${product._id}`}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <div className="flex-grow">
                      <div className="font-medium">{product.name}</div>
                      <small className="text-muted-foreground">
                        Minimo: {product.minStock}
                      </small>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      {product.currentStock}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-5">
                  <Package size={48} className="mb-2 opacity-50 mx-auto" />
                  <p className="mb-0">Sin productos con stock bajo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <Card className="border-0 shadow-sm h-full">
          <CardContent className="p-4">
            <h5 className="font-bold mb-3">Ventas por Hora del Dia</h5>
            <div className="relative" style={{ height: "280px" }}>
              {dashboardData?.salesByHour &&
              dashboardData.salesByHour.length > 0 ? (
                <SalesByHourChart data={dashboardData.salesByHour} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Calendar size={48} className="mb-3 opacity-50 mx-auto" />
                    <p>No hay datos disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm h-full">
          <CardContent className="p-4">
            <h5 className="font-bold mb-3">Ventas por Dia de la Semana</h5>
            <div className="relative" style={{ height: "280px" }}>
              {dashboardData?.salesByDayOfWeek &&
              dashboardData.salesByDayOfWeek.length > 0 ? (
                <SalesByDayChart data={dashboardData.salesByDayOfWeek} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Calendar size={48} className="mb-3 opacity-50 mx-auto" />
                    <p>No hay datos disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm h-full">
          <CardContent className="p-4">
            <h5 className="font-bold mb-3">Top Productos Mas Vendidos</h5>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {dashboardData?.topProducts?.length ? (
                dashboardData.topProducts
                  .slice(0, 5)
                  .map((product, index) => (
                    <div
                      key={`top-product-${index}-${product._id}`}
                      className="flex justify-between items-center py-3 border-b"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full bg-primary/10 flex items-center justify-content-center font-bold text-primary"
                          style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <small className="text-muted-foreground">
                            Cantidad: {product.quantity}
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="font-bold">
                          {formatCurrency(product.revenue)}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center text-muted-foreground py-5">
                  <Package size={48} className="mb-2 opacity-50 mx-auto" />
                  <p className="mb-0">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm h-full">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Award className="w-5 h-5 text-primary mr-2" />
              <h5 className="font-bold mb-0">Ranking de Cajeros</h5>
            </div>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {dashboardData?.cashierRanking?.length ? (
                dashboardData.cashierRanking
                  .slice(0, 5)
                  .map((cashier, index) => (
                    <div
                      key={`cashier-ranking-${index}-${cashier._id}`}
                      className="flex justify-between items-center py-3 border-b"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="rounded-full flex items-center justify-center font-bold text-white"
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor:
                              index === 0
                                ? "#f59e0b"
                                : index === 1
                                ? "#9ca3af"
                                : index === 2
                                ? "#cd7f32"
                                : "#6b7280",
                          }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{cashier.name}</div>
                          <small className="text-muted-foreground">
                            {cashier.salesCount} ventas
                          </small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="font-bold text-green-600">
                          {formatCurrency(cashier.totalRevenue)}
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center text-muted-foreground py-5">
                  <Award size={48} className="mb-2 opacity-50 mx-auto" />
                  <p className="mb-0">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Seleccion de Sucursal */}
      <BranchSelectionModal
        show={showBranchSelectionModal}
        onHide={closeBranchSelectionModal}
        isRequired={isRequiredSelection}
        onNoBranchesFound={handleNoBranchesFound}
      />

      {/* Modal de Creacion de Sucursal */}
      <BranchModal
        show={showCreateBranchModal}
        onHide={closeCreateBranchModal}
        userCompany={userCompany}
        onBranchSaved={() => {
          // El modal se cerrara automaticamente y reabrira el de seleccion
          // gracias a la logica en BranchModal (reopenBranchSelectionAfterCreate)
        }}
      />
    </div>
  );
};

export default OrderAnalyticsPage;
