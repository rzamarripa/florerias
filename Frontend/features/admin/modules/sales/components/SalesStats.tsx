"use client";

import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { salesService } from "../services/sales";
import { useOrderSocket } from "@/hooks/useOrderSocket";
import { Col } from "react-bootstrap";

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
    <div className="col-xl col-lg-4 col-md-6 col-sm-6 mb-3">
      <div
        className="card border-0 shadow-sm h-100"
        style={{
          borderRadius: "12px",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        }}
      >
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6
              className="text-muted mb-0 fw-semibold"
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {title}
            </h6>
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "12px",
                background: bgColor,
              }}
            >
              <div style={{ color: iconColor }}>{icon}</div>
            </div>
          </div>
          <h2
            className="mb-2 fw-bold"
            style={{ fontSize: "32px", color: "#2c3e50", lineHeight: "1.2" }}
          >
            {count.toLocaleString("es-MX")}
          </h2>
          <div
            className="d-flex align-items-center justify-content-between pt-2"
            style={{ borderTop: "1px solid #f1f3f5" }}
          >
            <span
              className="text-muted"
              style={{ fontSize: "11px", fontWeight: "500" }}
            >
              Monto Total
            </span>
            <span
              className="fw-bold"
              style={{ fontSize: "14px", color: iconColor }}
            >
              {formatCurrency(amount)}
            </span>
          </div>
        </div>
      </div>
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
      console.error("Error al cargar estadísticas:", error);
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
      // Recargar estadísticas cuando se crea una orden
      loadStats();
    },
    onOrderUpdated: () => {
      // Recargar estadísticas cuando se actualiza una orden
      loadStats();
    },
    onOrderDeleted: () => {
      // Recargar estadísticas cuando se elimina una orden
      loadStats();
    },
  });

  if (loading) {
    return (
      <div className="row g-3 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="col-xl-2 col-lg-4 col-md-6 col-sm-6 mb-3">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "12px", minHeight: "160px" }}
            >
              <div className="card-body p-4 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="row g-3 mb-4">
      <StatCard
        title="Ventas Totales"
        count={stats.totalSales.count}
        amount={stats.totalSales.amount}
        icon={<ShoppingCart size={24} />}
        bgColor="rgba(26, 188, 156, 0.1)"
        iconColor="#1ABC9C"
      />
      <StatCard
        title="Pendientes de Pago"
        count={stats.pendingPayment.count}
        amount={stats.pendingPayment.amount}
        icon={<Clock size={24} />}
        bgColor="rgba(243, 156, 18, 0.1)"
        iconColor="#F39C12"
      />
      <StatCard
        title="Ventas Pagadas"
        count={stats.paidSales.count}
        amount={stats.paidSales.amount}
        icon={<CheckCircle size={24} />}
        bgColor="rgba(52, 152, 219, 0.1)"
        iconColor="#3498DB"
      />
      <StatCard
        title="Ventas Canceladas"
        count={stats.cancelledSales.count}
        amount={stats.cancelledSales.amount}
        icon={<XCircle size={24} />}
        bgColor="rgba(231, 76, 60, 0.1)"
        iconColor="#E74C3C"
      />
      <StatCard
        title="Ticket Promedio"
        count={stats.averageTicket.count}
        amount={stats.averageTicket.amount}
        icon={<TrendingUp size={24} />}
        bgColor="rgba(155, 89, 182, 0.1)"
        iconColor="#9B59B6"
      />
    </div>
  );
};

export default SalesStats;
