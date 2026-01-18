"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { salesService } from "../services/sales";
import { useOrderSocket } from "@/hooks/useOrderSocket";

interface SalesStatsProps {
  filters: {
    startDate: string;
    endDate: string;
    branchId?: string;
  };
}

interface StatCardProps {
  title: string;
  count: number;
  amount: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  amount,
  icon,
  bgColor,
  iconColor,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  return (
    <div className="flex-1 min-w-[180px]">
      <Card
        className="shadow-sm h-full rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h6
              className="text-muted-foreground mb-0 font-semibold text-xs uppercase tracking-wide"
            >
              {title}
            </h6>
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl"
              style={{ background: bgColor }}
            >
              <div style={{ color: iconColor }}>{icon}</div>
            </div>
          </div>
          <h2
            className="mb-2 font-bold text-3xl leading-tight"
            style={{ color: "#2c3e50" }}
          >
            {count.toLocaleString("es-MX")}
          </h2>
          <div
            className="flex items-center justify-between pt-2 border-t"
          >
            <span
              className="text-muted-foreground text-xs font-medium"
            >
              Monto Total
            </span>
            <span
              className="font-bold text-sm"
              style={{ color: iconColor }}
            >
              {formatCurrency(amount)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SalesStats: React.FC<SalesStatsProps> = ({ filters }) => {
  const [stats, setStats] = useState({
    totalSales: { count: 0, amount: 0 },
    pendingPayment: { count: 0, amount: 0 },
    paidSales: { count: 0, amount: 0 },
    cancelledSales: { count: 0, amount: 0 },
    averageTicket: { count: 0, amount: 0 },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await salesService.getSalesSummary({
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: filters.branchId,
      });

      if (response.success) {
        const data = response.data;

        // Calcular ticket promedio
        const averageTicketAmount =
          data.totalSales.count > 0
            ? data.totalSales.amount / data.totalSales.count
            : 0;

        setStats({
          ...data,
          averageTicket: {
            count: data.totalSales.count,
            amount: averageTicketAmount,
          },
        });
      }
    } catch (error) {
      console.error("Error al cargar estadisticas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Escuchar cambios en tiempo real y recargar stats
  useOrderSocket({
    filters: {
      startDate: filters.startDate,
      endDate: filters.endDate,
      branchId: filters.branchId,
    },
    onOrderCreated: () => {
      // Recargar estadisticas cuando se crea una orden
      loadStats();
    },
    onOrderUpdated: () => {
      // Recargar estadisticas cuando se actualiza una orden
      loadStats();
    },
    onOrderDeleted: () => {
      // Recargar estadisticas cuando se elimina una orden
      loadStats();
    },
  });

  if (loading) {
    return (
      <div className="flex flex-wrap gap-3 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 min-w-[180px]">
            <Card
              className="shadow-sm h-full rounded-xl"
              style={{ minHeight: "160px" }}
            >
              <CardContent className="p-4 flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <StatCard
        title="Ventas Totales"
        count={stats.totalSales.count}
        amount={stats.totalSales.amount}
        icon={<ShoppingCart className="h-6 w-6" />}
        bgColor="rgba(26, 188, 156, 0.1)"
        iconColor="#1ABC9C"
      />
      <StatCard
        title="Pendientes de Pago"
        count={stats.pendingPayment.count}
        amount={stats.pendingPayment.amount}
        icon={<Clock className="h-6 w-6" />}
        bgColor="rgba(243, 156, 18, 0.1)"
        iconColor="#F39C12"
      />
      <StatCard
        title="Ventas Pagadas"
        count={stats.paidSales.count}
        amount={stats.paidSales.amount}
        icon={<CheckCircle className="h-6 w-6" />}
        bgColor="rgba(52, 152, 219, 0.1)"
        iconColor="#3498DB"
      />
      <StatCard
        title="Ventas Canceladas"
        count={stats.cancelledSales.count}
        amount={stats.cancelledSales.amount}
        icon={<XCircle className="h-6 w-6" />}
        bgColor="rgba(231, 76, 60, 0.1)"
        iconColor="#E74C3C"
      />
      <StatCard
        title="Ticket Promedio"
        count={stats.averageTicket.count}
        amount={stats.averageTicket.amount}
        icon={<TrendingUp className="h-6 w-6" />}
        bgColor="rgba(155, 89, 182, 0.1)"
        iconColor="#9B59B6"
      />
    </div>
  );
};

export default SalesStats;
