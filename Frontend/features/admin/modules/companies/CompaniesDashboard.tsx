"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  MoreHorizontal,
  Building2,
  Store,
  UserCheck,
  ShoppingCart,
  DollarSign,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { companiesService } from "./services/companies";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { Company } from "./types";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface RecentOrder {
  _id: string;
  orderNumber: string;
  clientInfo: {
    name: string;
    lastName?: string;
    clientId?: {
      name: string;
      lastName: string;
    };
  };
  branchId: {
    _id: string;
    branchName: string;
  };
  cashier: {
    username: string;
    profile?: {
      name?: string;
      lastName?: string;
      fullName?: string;
    };
  };
  total: number;
  status: string;
  createdAt: string;
}

interface TopClient {
  clientId?: string;
  clientName: string;
  clientLastName?: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
  clientInfo?: {
    name: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
  };
}

interface TopBranch {
  _id: string;
  totalSales: number;
  orderCount: number;
  branchInfo?: {
    branchName: string;
    branchCode: string;
    companyId: {
      _id: string;
      tradeName?: string;
      legalName: string;
    };
  };
}

interface DashboardStats {
  companies: number;
  branches: number;
  clients: number;
  orders: number;
  totalSales: number;
  dailyRevenue: Array<{
    _id: { year: number; month: number; day: number };
    revenue: number;
    orderCount: number;
  }>;
  monthlyRevenue: Array<{
    _id: { year: number; month: number };
    revenue: number;
    orderCount: number;
  }>;
  weeklySales: Array<{
    _id: { week: number };
    revenue: number;
    orderCount: number;
  }>;
  ordersByStatus: Array<{
    _id: string;
    count: number;
  }>;
  salesPerformance: {
    pending: {
      count: number;
      percentage: string;
    };
    inProcess: {
      count: number;
      percentage: string;
    };
    completed: {
      count: number;
      percentage: string;
    };
  };
  recentOrders: RecentOrder[];
  topClients: TopClient[];
  topBranches: TopBranch[];
}

const CompaniesDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useUserSessionStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [filters, setFilters] = useState({
    startDate: getCurrentDate(),
    endDate: getCurrentDate(),
    companyId: "",
  });

  useEffect(() => {
    loadCompanies();
    loadDashboardData();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await companiesService.getAllCompanies({
        limit: 1000,
        isActive: true,
      });
      if (response.success && response.data) {
        setCompanies(response.data);
      }
    } catch (err: any) {
      console.error("Error loading companies:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadDashboardData = async (customFilters?: typeof filters) => {
    try {
      setLoading(true);
      setError(null);

      // Verificar que el usuario sea Distribuidor
      if (user?.role?.name !== "Distribuidor") {
        setError(
          "Solo los usuarios con rol Distribuidor pueden acceder a este dashboard"
        );
        setLoading(false);
        return;
      }

      const filtersToUse = customFilters || filters;

      const response = await companiesService.getDistributorDashboardStats({
        startDate: filtersToUse.startDate,
        endDate: filtersToUse.endDate,
        companyId: filtersToUse.companyId || undefined,
      });

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError("Error al cargar las estadísticas");
      }
    } catch (err: any) {
      console.error("Error loading dashboard:", err);
      setError(err.message || "Error al cargar las estadísticas del dashboard");
      toast.error("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = () => {
    loadDashboardData(filters);
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      startDate: getCurrentDate(),
      endDate: getCurrentDate(),
      companyId: "",
    };
    setFilters(defaultFilters);
    loadDashboardData(defaultFilters);
  };

  // Calcular tendencia de ingresos
  const calculateRevenueTrend = () => {
    if (!stats || !stats.dailyRevenue || stats.dailyRevenue.length < 2) {
      return { percentage: 0, isPositive: true };
    }

    const last7Days = stats.dailyRevenue.slice(-7);
    const previous7Days = stats.dailyRevenue.slice(-14, -7);

    const last7Total = last7Days.reduce((sum, day) => sum + day.revenue, 0);
    const previous7Total = previous7Days.reduce(
      (sum, day) => sum + day.revenue,
      0
    );

    if (previous7Total === 0) {
      return { percentage: 0, isPositive: true };
    }

    const percentage = ((last7Total - previous7Total) / previous7Total) * 100;
    return {
      percentage: Math.abs(percentage),
      isPositive: percentage >= 0,
    };
  };

  const revenueTrend = calculateRevenueTrend();

  // Preparar datos del gráfico de ingresos diarios
  const prepareChartData = () => {
    if (!stats || !stats.dailyRevenue) {
      return {
        categories: [],
        revenueData: [],
        ordersData: [],
      };
    }

    const categories = stats.dailyRevenue.map((day) => {
      const date = new Date(day._id.year, day._id.month - 1, day._id.day);
      return date.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      });
    });

    const revenueData = stats.dailyRevenue.map((day) => day.revenue);
    const ordersData = stats.dailyRevenue.map((day) => day.orderCount);

    return { categories, revenueData, ordersData };
  };

  const chartData = prepareChartData();

  // Revenue Chart Configuration
  const revenueChartOptions = {
    chart: {
      type: "area" as const,
      height: 350,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth" as const,
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        style: {
          fontSize: "11px",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatCurrency(val),
        style: {
          fontSize: "11px",
        },
      },
    },
    colors: ["#1ab394", "#4A90E2"],
    legend: {
      show: true,
      position: "top" as const,
      horizontalAlign: "right" as const,
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
  };

  const revenueChartSeries = [
    {
      name: "Ingresos",
      data: chartData.revenueData,
    },
    {
      name: "Órdenes",
      data: chartData.ordersData,
    },
  ];

  // Sales Performance Donut Chart - Usar datos reales
  const salesPerformanceOptions = {
    chart: {
      type: "donut" as const,
      height: 200,
    },
    labels: ["Completadas", "En Proceso", "Pendientes"],
    colors: ["#1ab394", "#4A90E2", "#f8ac59"],
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
        },
      },
    },
  };

  // Usar datos reales del backend
  const salesPerformanceSeries = stats?.salesPerformance
    ? [
        parseFloat(stats.salesPerformance.completed.percentage),
        parseFloat(stats.salesPerformance.inProcess.percentage),
        parseFloat(stats.salesPerformance.pending.percentage),
      ]
    : [0, 0, 0];

  // Debug: Log para verificar datos
  if (stats?.salesPerformance) {
    console.log("Sales Performance Data:", {
      completed: stats.salesPerformance.completed,
      inProcess: stats.salesPerformance.inProcess,
      pending: stats.salesPerformance.pending,
      series: salesPerformanceSeries,
    });
  }

  // Preparar datos de ventas semanales
  const prepareWeeklySalesData = () => {
    if (!stats || !stats.weeklySales || stats.weeklySales.length === 0) {
      return [];
    }

    const weekColors = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    ];

    return stats.weeklySales.map((week, index) => ({
      weekNumber: week._id.week,
      weekLabel: `Semana ${index + 1}`,
      revenue: week.revenue,
      orderCount: week.orderCount,
      color: weekColors[index % weekColors.length],
    }));
  };

  const weeklySalesData = prepareWeeklySalesData();

  // Formatear números con comas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-MX").format(num);
  };

  // Formatear moneda
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(num);
  };

  // Calcular tiempo transcurrido
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (loading) {
    return (
      <div
        className="flex justify-center items-center"
        style={{ minHeight: "400px" }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
        <Button variant="default" onClick={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container-fluid py-4">
        <Alert>
          <AlertDescription>No se pudieron cargar las estadísticas</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid py-2">
      {/* Filters Section */}
      <Card className="border-0 shadow-sm mb-2 rounded-[10px]">
        <CardContent className="p-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Fecha Inicial
                </Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Fecha Final
                </Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="md:col-span-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Empresa
                </Label>
                <Select
                  value={filters.companyId}
                  onValueChange={(value) =>
                    handleFilterChange("companyId", value)
                  }
                  disabled={loadingCompanies}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Todas las empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las empresas</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company._id} value={company._id}>
                        {company.tradeName || company.legalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <Button
                variant="default"
                onClick={handleSearch}
                disabled={loading}
                className="w-full rounded-lg"
              >
                <Search size={16} className="mr-1" />
                Buscar
              </Button>
            </div>
          </div>
          <div className="mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              disabled={loading}
              className="rounded-lg"
            >
              <RefreshCw size={14} className="mr-1" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Metrics Cards - Con datos reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        {/* Empresas Card */}
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="text-center p-3">
            <div className="mb-3">
              <div
                className="inline-flex p-3 rounded-full"
                style={{ backgroundColor: "#e3f2fd" }}
              >
                <Building2 size={24} style={{ color: "#4A90E2" }} />
              </div>
            </div>
            <h2 className="font-bold mb-2 text-3xl">
              {stats.companies}
            </h2>
            <div className="text-muted-foreground text-sm">
              <span>Empresas</span>
            </div>
          </CardContent>
        </Card>

        {/* Sucursales Card */}
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="text-center p-3">
            <div className="mb-3">
              <div
                className="inline-flex p-3 rounded-full"
                style={{ backgroundColor: "#e8f5e9" }}
              >
                <Store size={24} style={{ color: "#1ab394" }} />
              </div>
            </div>
            <h2 className="font-bold mb-2 text-3xl">
              {stats.branches}
            </h2>
            <div className="text-muted-foreground text-sm">
              <span>Sucursales</span>
            </div>
          </CardContent>
        </Card>

        {/* Clientes Card */}
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="text-center p-3">
            <div className="mb-3">
              <div
                className="inline-flex p-3 rounded-full"
                style={{ backgroundColor: "#fff3e0" }}
              >
                <UserCheck size={24} style={{ color: "#f8ac59" }} />
              </div>
            </div>
            <h2 className="font-bold mb-2 text-3xl">
              {formatNumber(stats.clients)}
            </h2>
            <div className="text-muted-foreground text-sm">
              <span>Clientes</span>
            </div>
          </CardContent>
        </Card>

        {/* Ventas Card */}
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="text-center p-3">
            <div className="mb-3">
              <div
                className="inline-flex p-3 rounded-full"
                style={{ backgroundColor: "#fce4ec" }}
              >
                <ShoppingCart size={24} style={{ color: "#e91e63" }} />
              </div>
            </div>
            <h2 className="font-bold mb-2 text-3xl">
              {formatNumber(stats.orders)}
            </h2>
            <div className="text-muted-foreground text-sm">
              <span>Órdenes</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className="border-0 shadow-sm rounded-xl lg:col-span-2">
          <CardContent className="p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h6 className="text-muted-foreground mb-1 text-sm">Ingresos Totales</h6>
                <h2 className="font-bold mb-0 text-2xl">
                  {formatCurrency(stats.totalSales)}
                </h2>
              </div>
              <div
                className="p-2 rounded-full"
                style={{ backgroundColor: "#e8f5e9" }}
              >
                <DollarSign size={24} style={{ color: "#1ab394" }} />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="default"
                className="px-2 py-1 flex items-center gap-1 rounded-md text-xs bg-green-500"
              >
                <TrendingUp size={12} />
                Total
              </Badge>
              <span className="text-muted-foreground text-sm">De todas las empresas</span>
            </div>
            <div className="flex justify-between text-center mt-3 pt-2 border-t">
              <div>
                <div className="text-muted-foreground text-sm">Empresas</div>
                <div className="font-semibold">{stats.companies}</div>
              </div>
              <div className="border-l pl-3">
                <div className="text-muted-foreground text-sm">Sucursales</div>
                <div className="font-semibold">{stats.branches}</div>
              </div>
              <div className="border-l pl-3">
                <div className="text-muted-foreground text-sm">Ventas</div>
                <div className="font-semibold">
                  {formatNumber(stats.orders)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica de Ingresos y Reportes Trimestrales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
        <div className="lg:col-span-8">
          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader className="bg-white border-0 py-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-bold mb-0">Ingresos Diarios</h5>
                  <p className="text-muted-foreground text-sm mb-0 mt-1">Últimos 30 días</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="mb-0 text-sm text-muted-foreground">Ingresos Totales</p>
                      <h4 className="font-bold mb-0">
                        {formatCurrency(stats.totalSales)}
                      </h4>
                    </div>
                    <Badge
                      variant={revenueTrend.isPositive ? "default" : "destructive"}
                      className="ml-2"
                    >
                      {revenueTrend.isPositive ? (
                        <TrendingUp size={12} className="mr-1" />
                      ) : (
                        <TrendingDown size={12} className="mr-1" />
                      )}
                      {revenueTrend.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-0 mt-1">
                    {revenueTrend.isPositive ? "AUMENTO" : "DISMINUCIÓN"} VS
                    SEMANA ANTERIOR
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Chart
                options={revenueChartOptions}
                series={revenueChartSeries}
                type="area"
                height={350}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="border-0 shadow-sm h-full rounded-xl">
            <CardHeader className="bg-white border-0 py-3 px-4">
              <div className="flex justify-between items-center">
                <h5 className="font-bold mb-0">Ventas Semanales</h5>
                <div className="flex gap-2">
                  <Badge variant="default" className="px-2 py-1">
                    MES ACTUAL
                  </Badge>
                  <Button
                    variant="link"
                    className="p-0 text-muted-foreground"
                    onClick={() => loadDashboardData()}
                  >
                    <RefreshCw size={14} />
                  </Button>
                  <Button variant="link" className="p-0 text-muted-foreground">
                    <MoreHorizontal size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {weeklySalesData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground text-sm font-normal pl-0">
                        SEMANA
                      </TableHead>
                      <TableHead className="text-muted-foreground text-sm font-normal text-right">
                        VENTAS
                      </TableHead>
                      <TableHead className="text-muted-foreground text-sm font-normal text-right pr-0">
                        INGRESOS
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklySalesData.map((week, index) => (
                      <TableRow key={index}>
                        <TableCell className="pl-0">
                          <div className="flex items-center gap-2">
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "8px",
                                background: week.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                            >
                              S{index + 1}
                            </div>
                            <div>
                              <div
                                className="font-semibold"
                                style={{ fontSize: "13px" }}
                              >
                                {week.weekLabel}
                              </div>
                              <div
                                className="text-muted-foreground"
                                style={{ fontSize: "10px" }}
                              >
                                {week.orderCount}{" "}
                                {week.orderCount === 1 ? "orden" : "órdenes"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-right font-semibold"
                          style={{ fontSize: "13px" }}
                        >
                          {week.orderCount}
                        </TableCell>
                        <TableCell
                          className="text-right pr-0"
                          style={{ fontSize: "13px" }}
                        >
                          <Badge variant="default" className="rounded-md bg-green-500">
                            {formatCurrency(week.revenue)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-0">
                    No hay datos de ventas semanales disponibles
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rendimiento de Ventas y Últimas Actualizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
        <div className="lg:col-span-5">
          <Card className="border-0 shadow-sm h-full rounded-xl">
            <CardHeader className="bg-white border-0 py-3 px-4">
              <div className="flex justify-between items-center">
                <h5 className="font-bold mb-0">Rendimiento de Ventas</h5>
                <div className="flex gap-2">
                  <Button variant="link" className="p-0 text-muted-foreground">
                    <RefreshCw size={14} />
                  </Button>
                  <Button variant="link" className="p-0 text-muted-foreground">
                    <MoreHorizontal size={14} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-center mb-4">
                <Chart
                  options={salesPerformanceOptions}
                  series={salesPerformanceSeries}
                  type="donut"
                  height={200}
                />
              </div>
              <div>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: "#1ab394",
                        }}
                      />
                      <span className="text-sm">Órdenes Completadas</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-semibold">
                      {stats?.salesPerformance?.completed.count || 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      stats?.salesPerformance?.completed.percentage
                        ? parseFloat(
                            stats.salesPerformance.completed.percentage
                          )
                        : 0
                    }
                    className="h-1.5"
                  />
                  <div className="text-right mt-1">
                    <small className="text-muted-foreground">
                      {stats?.salesPerformance?.completed.percentage || "0"}%
                    </small>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: "#4A90E2",
                        }}
                      />
                      <span className="text-sm">Órdenes en Proceso</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-semibold">
                      {stats?.salesPerformance?.inProcess.count || 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      stats?.salesPerformance?.inProcess.percentage
                        ? parseFloat(
                            stats.salesPerformance.inProcess.percentage
                          )
                        : 0
                    }
                    className="h-1.5"
                  />
                  <div className="text-right mt-1">
                    <small className="text-muted-foreground">
                      {stats?.salesPerformance?.inProcess.percentage || "0"}%
                    </small>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: "#f8ac59",
                        }}
                      />
                      <span className="text-sm">Órdenes Pendientes</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-semibold">
                      {stats?.salesPerformance?.pending.count || 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      stats?.salesPerformance?.pending.percentage
                        ? parseFloat(stats.salesPerformance.pending.percentage)
                        : 0
                    }
                    className="h-1.5"
                  />
                  <div className="text-right mt-1">
                    <small className="text-muted-foreground">
                      {stats?.salesPerformance?.pending.percentage || "0"}%
                    </small>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="border-0 shadow-sm h-full rounded-xl">
            <CardHeader className="bg-white border-0 py-3 px-4">
              <div className="flex justify-between items-center">
                <h5 className="font-bold mb-0">Últimas Órdenes</h5>
                <Badge variant="secondary" className="px-3 py-2">
                  Recientes
                </Badge>
              </div>
            </CardHeader>
            <CardContent
              className="p-4"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="space-y-0">
                  {stats.recentOrders.map((order, idx) => {
                    // Función auxiliar para obtener color según el status
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "completado":
                          return "#1ab394";
                        case "pendiente":
                          return "#4A90E2";
                        case "en-proceso":
                          return "#f8ac59";
                        case "cancelado":
                          return "#e91e63";
                        default:
                          return "#9c27b0";
                      }
                    };

                    // Función auxiliar para obtener background color según el status
                    const getStatusBgColor = (status: string) => {
                      switch (status) {
                        case "completado":
                          return "#e8f5e9";
                        case "pendiente":
                          return "#e3f2fd";
                        case "en-proceso":
                          return "#fff3e0";
                        case "cancelado":
                          return "#fce4ec";
                        default:
                          return "#f3e5f5";
                      }
                    };

                    // Función auxiliar para obtener texto del status
                    const getStatusText = (status: string) => {
                      switch (status) {
                        case "completado":
                          return "Completada";
                        case "pendiente":
                          return "Pendiente";
                        case "en-proceso":
                          return "En Proceso";
                        case "cancelado":
                          return "Cancelada";
                        case "sinAnticipo":
                          return "Sin Anticipo";
                        default:
                          return status;
                      }
                    };

                    // Obtener nombre del cliente
                    const clientName = order.clientInfo.clientId
                      ? `${order.clientInfo.clientId.name} ${
                          order.clientInfo.clientId.lastName || ""
                        }`
                      : `${order.clientInfo.name} ${
                          order.clientInfo.lastName || ""
                        }`;

                    // Obtener nombre del cajero
                    const cashierName =
                      order.cashier?.profile?.fullName ||
                      `${order.cashier?.profile?.name || ""} ${
                        order.cashier?.profile?.lastName || ""
                      }`.trim() ||
                      order.cashier?.username ||
                      "Usuario";

                    // Formatear fecha
                    const orderDate = new Date(order.createdAt);
                    const timeAgo = getTimeAgo(orderDate);

                    return (
                      <div
                        key={order._id}
                        className="border-0 px-0 py-3 border-b last:border-b-0"
                      >
                        <div className="flex gap-3">
                          <div
                            className="rounded flex items-center justify-center"
                            style={{
                              width: "40px",
                              height: "40px",
                              backgroundColor: getStatusBgColor(order.status),
                              flexShrink: 0,
                            }}
                          >
                            <ShoppingCart
                              size={18}
                              style={{ color: getStatusColor(order.status) }}
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h6
                                  className="mb-1 font-semibold"
                                  style={{ fontSize: "14px" }}
                                >
                                  Orden #{order.orderNumber}
                                </h6>
                                <p
                                  className="mb-2 text-sm text-muted-foreground"
                                  style={{ fontSize: "12px" }}
                                >
                                  Cliente: {clientName} •{" "}
                                  {order.branchId.branchName}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      order.status === "completado"
                                        ? "default"
                                        : order.status === "pendiente"
                                        ? "default"
                                        : order.status === "cancelado"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="rounded-md text-[10px]"
                                  >
                                    {getStatusText(order.status)}
                                  </Badge>
                                  <span
                                    className="text-muted-foreground"
                                    style={{ fontSize: "11px" }}
                                  >
                                    {cashierName}
                                  </span>
                                  <span
                                    className="text-muted-foreground"
                                    style={{ fontSize: "11px" }}
                                  >
                                    • {formatCurrency(order.total)}
                                  </span>
                                </div>
                              </div>
                              <span
                                className="text-muted-foreground"
                                style={{ fontSize: "11px" }}
                              >
                                {timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-0">
                    No hay órdenes recientes disponibles
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mensajes y Discusiones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5">
          <Card className="border-0 shadow-sm h-full rounded-xl">
            <CardHeader className="bg-white border-0 py-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-bold mb-1">Top 10 Clientes</h5>
                  <p className="text-muted-foreground text-sm mb-0">
                    Clientes que más han gastado
                  </p>
                </div>
                <Badge variant="default" className="px-2 py-1 bg-green-500">
                  TOP
                </Badge>
              </div>
            </CardHeader>
            <CardContent
              className="p-4"
              style={{ maxHeight: "450px", overflowY: "auto" }}
            >
              {stats?.topClients && stats.topClients.length > 0 ? (
                <div className="space-y-0">
                  {stats.topClients.map((client, idx) => {
                    // Colores para los avatares
                    const colors = [
                      "#1ab394",
                      "#4A90E2",
                      "#f8ac59",
                      "#e91e63",
                      "#9c27b0",
                      "#00bcd4",
                      "#ff9800",
                      "#795548",
                      "#607d8b",
                      "#8bc34a",
                    ];
                    const color = colors[idx % colors.length];

                    // Obtener iniciales del cliente
                    const firstName =
                      client.clientInfo?.name || client.clientName;
                    const lastName =
                      client.clientInfo?.lastName ||
                      client.clientLastName ||
                      "";
                    const initials = `${firstName.charAt(0)}${
                      lastName.charAt(0) || firstName.charAt(1) || ""
                    }`.toUpperCase();

                    // Nombre completo del cliente
                    const fullName = `${firstName} ${lastName}`.trim();

                    // Formatear última compra
                    const lastOrderDate = new Date(client.lastOrderDate);
                    const lastOrderTime = getTimeAgo(lastOrderDate);

                    return (
                      <div key={idx} className="border-0 px-0 py-3 border-b last:border-b-0">
                        <div className="flex gap-3 items-center">
                          <div
                            className="flex items-center gap-2"
                            style={{ minWidth: "50px" }}
                          >
                            {/* Ranking badge */}
                            <Badge
                              variant={
                                idx === 0
                                  ? "default"
                                  : idx === 1
                                  ? "secondary"
                                  : idx === 2
                                  ? "destructive"
                                  : "outline"
                              }
                              className="font-bold w-7 h-7 flex items-center justify-center rounded-full text-xs"
                              style={{
                                backgroundColor: idx === 0 ? "#ffc107" : idx === 1 ? "#6c757d" : idx === 2 ? "#dc3545" : undefined,
                              }}
                            >
                              {idx + 1}
                            </Badge>
                            {/* Avatar */}
                            <div
                              className="rounded-full flex items-center justify-center font-bold text-white"
                              style={{
                                width: "44px",
                                height: "44px",
                                backgroundColor: color,
                                flexShrink: 0,
                                fontSize: "13px",
                              }}
                            >
                              {initials}
                            </div>
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <h6
                                  className="mb-0 font-semibold"
                                  style={{ fontSize: "14px" }}
                                >
                                  {fullName}
                                </h6>
                                <p
                                  className="mb-0 text-muted-foreground"
                                  style={{ fontSize: "11px" }}
                                >
                                  {client.orderCount}{" "}
                                  {client.orderCount === 1
                                    ? "orden"
                                    : "órdenes"}
                                </p>
                              </div>
                              <div className="text-right">
                                <div
                                  className="font-bold"
                                  style={{ fontSize: "14px", color: "#1ab394" }}
                                >
                                  {formatCurrency(client.totalSpent)}
                                </div>
                                <span
                                  className="text-muted-foreground"
                                  style={{ fontSize: "10px" }}
                                >
                                  {lastOrderTime}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-0">No hay clientes disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="border-0 shadow-sm h-full rounded-xl">
            <CardHeader className="bg-white border-0 py-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-bold mb-1">Top 5 Sucursales del Mes</h5>
                  <p className="text-muted-foreground text-sm mb-0">
                    Sucursales con más ventas
                  </p>
                </div>
                <Badge variant="default" className="px-2 py-1">
                  MES ACTUAL
                </Badge>
              </div>
            </CardHeader>
            <CardContent
              className="p-4"
              style={{ maxHeight: "450px", overflowY: "auto" }}
            >
              {stats?.topBranches && stats.topBranches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="border-0 text-muted-foreground text-sm"
                        style={{ fontSize: "11px", fontWeight: "normal" }}
                      >
                        #
                      </TableHead>
                      <TableHead
                        className="border-0 text-muted-foreground text-sm"
                        style={{ fontSize: "11px", fontWeight: "normal" }}
                      >
                        SUCURSAL
                      </TableHead>
                      <TableHead
                        className="border-0 text-muted-foreground text-sm text-center"
                        style={{ fontSize: "11px", fontWeight: "normal" }}
                      >
                        EMPRESA
                      </TableHead>
                      <TableHead
                        className="border-0 text-muted-foreground text-sm text-center"
                        style={{ fontSize: "11px", fontWeight: "normal" }}
                      >
                        ÓRDENES
                      </TableHead>
                      <TableHead
                        className="border-0 text-muted-foreground text-sm text-right"
                        style={{ fontSize: "11px", fontWeight: "normal" }}
                      >
                        TOTAL VENTAS
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.topBranches.map((branch, idx) => {
                      const branchName =
                        branch.branchInfo?.branchName || "Sucursal";
                      const branchCode = branch.branchInfo?.branchCode || "";
                      const companyName =
                        branch.branchInfo?.companyId?.tradeName ||
                        branch.branchInfo?.companyId?.legalName ||
                        "Empresa";

                      // Colores para los rankings
                      const getRankingColor = (index: number) => {
                        if (index === 0) return "#ffc107"; // Oro
                        if (index === 1) return "#6c757d"; // Plata
                        if (index === 2) return "#dc3545"; // Bronce
                        return "#e9ecef"; // Gris claro
                      };

                      const getRankingTextColor = (index: number) => {
                        return index <= 2 ? "white" : "dark";
                      };

                      return (
                        <TableRow key={branch._id}>
                          <TableCell
                            className="align-middle"
                            style={{ width: "50px" }}
                          >
                            <Badge
                              style={{
                                backgroundColor: getRankingColor(idx),
                                color:
                                  getRankingTextColor(idx) === "white"
                                    ? "#fff"
                                    : "#000",
                                fontSize: "13px",
                                fontWeight: "bold",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                              }}
                            >
                              {idx + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle">
                            <div>
                              <div
                                className="font-semibold"
                                style={{ fontSize: "14px" }}
                              >
                                {branchName}
                              </div>
                              {branchCode && (
                                <div
                                  className="text-muted-foreground"
                                  style={{ fontSize: "11px" }}
                                >
                                  {branchCode}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            <Badge
                              variant="outline"
                              style={{ fontSize: "11px", fontWeight: "normal" }}
                            >
                              {companyName}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            <span
                              className="font-semibold"
                              style={{ fontSize: "14px" }}
                            >
                              {branch.orderCount}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-right">
                            <div
                              className="font-bold"
                              style={{ fontSize: "15px", color: "#1ab394" }}
                            >
                              {formatCurrency(branch.totalSales)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-0">
                    No hay ventas de sucursales en el mes actual
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompaniesDashboard;
