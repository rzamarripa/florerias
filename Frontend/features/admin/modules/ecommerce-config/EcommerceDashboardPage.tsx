"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  Filter,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ordersService } from "@/features/admin/modules/orders/services/orders";
import { Order } from "@/features/admin/modules/orders/types";
import { toast } from "react-toastify";

// Colores para el PieChart de estados
const STATUS_COLORS: Record<string, string> = {
  pendiente: "#f59e0b",
  "en-proceso": "#3b82f6",
  completado: "#10b981",
  cancelado: "#ef4444",
  sinAnticipo: "#8b5cf6",
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  "en-proceso": "En Proceso",
  completado: "Completado",
  cancelado: "Cancelado",
  sinAnticipo: "Sin Anticipo",
};

const BAR_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

const EcommerceDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersService.getAllOrders({
        eOrder: true,
        limit: 1000,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar órdenes e-commerce");
      console.error("Error loading ecommerce orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadOrders();
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  // Calcular estadísticas desde las órdenes
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalProducts = orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity || 0), 0),
      0
    );
    return { totalOrders, totalRevenue, averageTicket, totalProducts };
  }, [orders]);

  // Tendencia de ventas agrupada por día
  const salesTrend = useMemo(() => {
    const byDay: Record<string, { date: string; amount: number; count: number }> = {};
    orders.forEach((o) => {
      const date = o.createdAt.split("T")[0];
      if (!byDay[date]) byDay[date] = { date, amount: 0, count: 0 };
      byDay[date].amount += o.total || 0;
      byDay[date].count += 1;
    });
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);

  // Distribución por estado
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      const status = o.status || "pendiente";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
      color: STATUS_COLORS[status] || "#6b7280",
    }));
  }, [orders]);

  // Top 5 productos más vendidos
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.productName || "Sin nombre";
        if (!productMap[key]) productMap[key] = { name: key, quantity: 0, revenue: 0 };
        productMap[key].quantity += item.quantity || 0;
        productMap[key].revenue += item.amount || 0;
      });
    });
    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  // Órdenes recientes (últimas 10)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [orders]);

  // StatCard component (mismo patrón que OrderAnalyticsPage)
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: any;
    color: string;
    bgColor: string;
  }> = ({ title, value, icon: Icon, color, bgColor }) => (
    <Card className="shadow-sm h-full overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <p className="text-muted-foreground mb-2 font-medium text-sm">{title}</p>
            <h3 className="mb-0 font-bold text-2xl">{value}</h3>
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pendiente: { bg: "#fef3c7", text: "#d97706" },
      "en-proceso": { bg: "#dbeafe", text: "#2563eb" },
      completado: { bg: "#d1fae5", text: "#059669" },
      cancelado: { bg: "#fee2e2", text: "#dc2626" },
      sinAnticipo: { bg: "#ede9fe", text: "#7c3aed" },
    };
    const c = colors[status] || { bg: "#f3f4f6", text: "#6b7280" };
    return (
      <Badge style={{ backgroundColor: c.bg, color: c.text }}>
        {STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="py-4">
        <div className="flex justify-center items-center" style={{ minHeight: "400px" }}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="font-bold text-2xl mb-1">Dashboard E-commerce</h2>
          <p className="text-muted-foreground mb-0">
            Resumen de ventas y pedidos de tu tienda en línea
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
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
                  setFilters({
                    startDate: firstDay.toISOString().split("T")[0],
                    endDate: now.toISOString().split("T")[0],
                  });
                }}
              >
                Mes Actual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Total Pedidos"
          value={stats.totalOrders}
          icon={ShoppingCart}
          color="#3b82f6"
          bgColor="#dbeafe"
        />
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="#10b981"
          bgColor="#d1fae5"
        />
        <StatCard
          title="Ticket Promedio"
          value={formatCurrency(stats.averageTicket)}
          icon={TrendingUp}
          color="#8b5cf6"
          bgColor="#ede9fe"
        />
        <StatCard
          title="Productos Vendidos"
          value={stats.totalProducts}
          icon={Package}
          color="#f59e0b"
          bgColor="#fef3c7"
        />
      </div>

      {/* Charts Row 1: Sales Trend + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full">
            <CardContent className="p-4">
              <h5 className="font-bold mb-3">Tendencia de Ventas</h5>
              <div className="relative" style={{ height: "300px" }}>
                {salesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={salesTrend.map((item) => ({
                        date: new Date(`${item.date}T12:00:00`).toLocaleDateString(
                          "es-MX",
                          { day: "2-digit", month: "short" }
                        ),
                        ventas: item.amount,
                        pedidos: item.count,
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
                        tick={{ fill: "#6b7280" }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: "12px" }}
                        tick={{ fill: "#6b7280" }}
                        tickFormatter={(v) => formatCurrency(v)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value: number, name: string) => [
                          name === "ventas" ? formatCurrency(value) : value,
                          name === "ventas" ? "Ventas" : "Pedidos",
                        ]}
                        labelStyle={{ color: "#1f2937", fontWeight: "600" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="ventas"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorVentas)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
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
          <Card className="shadow-sm h-full">
            <CardContent className="p-4">
              <h5 className="font-bold mb-3">Estado de Pedidos</h5>
              <div className="relative" style={{ height: "300px" }}>
                {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [value, "Pedidos"]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px" }}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
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

      {/* Charts Row 2: Top Products + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <div>
          <Card className="shadow-sm h-full">
            <CardContent className="p-4">
              <h5 className="font-bold mb-3">Top 5 Productos</h5>
              <div className="relative" style={{ height: "300px" }}>
                {topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProducts}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" style={{ fontSize: "12px" }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        style={{ fontSize: "11px" }}
                        tick={{ fill: "#6b7280" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, name: string) => [
                          name === "revenue" ? formatCurrency(value) : value,
                          name === "revenue" ? "Ingresos" : "Cantidad",
                        ]}
                      />
                      <Bar dataKey="quantity" name="quantity" radius={[0, 4, 4, 0]}>
                        {topProducts.map((_, index) => (
                          <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
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

        <div className="lg:col-span-2">
          <Card className="shadow-sm h-full">
            <CardContent className="p-4">
              <h5 className="font-bold mb-3">Pedidos Recientes</h5>
              {recentOrders.length > 0 ? (
                <div className="overflow-auto" style={{ maxHeight: "300px" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                          # Pedido
                        </th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                          Cliente
                        </th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                          Total
                        </th>
                        <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                          Estado
                        </th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-medium">
                          Fecha
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order._id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 px-2 font-medium">
                            {order.orderNumber || "-"}
                          </td>
                          <td className="py-2 px-2">
                            {order.clientInfo?.name || "Sin nombre"}
                          </td>
                          <td className="py-2 px-2 text-right font-medium">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="py-2 px-2 text-right text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="text-center">
                    <ShoppingCart size={48} className="mb-3 opacity-50 mx-auto" />
                    <p>No hay pedidos recientes</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EcommerceDashboardPage;
