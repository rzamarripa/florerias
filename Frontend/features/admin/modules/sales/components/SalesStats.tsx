"use client";

import React, { useEffect, useState } from "react";
import { ShoppingCart, Clock, CheckCircle, XCircle } from "lucide-react";
import { salesService } from "../services/sales";

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

const StatCard: React.FC<StatCardProps> = ({ title, count, amount, icon, bgColor, iconColor }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  return (
    <div className="col-lg-3 col-md-6">
      <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="text-muted mb-0 fw-normal" style={{ fontSize: "13px" }}>
                {title}
              </h6>
            </div>
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: bgColor,
              }}
            >
              <div style={{ color: iconColor }}>
                {icon}
              </div>
            </div>
          </div>
          <h2 className="mb-1 fw-bold" style={{ fontSize: "28px" }}>
            {count}
          </h2>
          <div className="d-flex align-items-center">
            <span className="text-muted" style={{ fontSize: "12px" }}>
              Total {title}
            </span>
            <span className="ms-auto fw-semibold" style={{ fontSize: "13px", color: "#495057" }}>
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
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="row g-3 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", height: "140px" }}>
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
    </div>
  );
};

export default SalesStats;
