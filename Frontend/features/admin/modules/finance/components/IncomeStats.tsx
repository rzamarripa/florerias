"use client";

import React, { useEffect, useState } from "react";
import { Row, Col, Card, Spinner } from "react-bootstrap";
import { CreditCard, DollarSign, Wallet, Building2, Banknote } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, IncomeStats as IncomeStatsType } from "../types";
import { toast } from "react-toastify";

interface IncomeStatsProps {
  filters: FinanceFilters;
}

const IncomeStats: React.FC<IncomeStatsProps> = ({ filters }) => {
  const [stats, setStats] = useState<IncomeStatsType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await financeService.getIncomeStats(filters);
      if (response.data) {
        setStats(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar estadísticas de ingresos");
      console.error("Error loading income stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Cargando ingresos...</p>
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return null;
  }

  // Función para obtener el ícono y colores según el nombre del método de pago
  const getPaymentMethodStyle = (methodName: string, index: number) => {
    const name = methodName.toLowerCase();

    if (name.includes("transferencia")) {
      return {
        icon: Building2,
        color: "#0d6efd",
        bgColor: "#cfe2ff"
      };
    } else if (name.includes("efectivo")) {
      return {
        icon: DollarSign,
        color: "#28a745",
        bgColor: "#d4edda"
      };
    } else if (name.includes("tarjeta")) {
      return {
        icon: CreditCard,
        color: "#17a2b8",
        bgColor: "#d1ecf1"
      };
    } else if (name.includes("deposito") || name.includes("depósito")) {
      return {
        icon: Wallet,
        color: "#fd7e14",
        bgColor: "#ffe5d0"
      };
    } else if (name.includes("cheque")) {
      return {
        icon: Banknote,
        color: "#6f42c1",
        bgColor: "#e2d9f3"
      };
    } else {
      // Colores por defecto basados en el índice
      const colors = [
        { color: "#0dcaf0", bgColor: "#cff4fc" },
        { color: "#d63384", bgColor: "#f7d6e6" },
        { color: "#20c997", bgColor: "#d2f4ea" },
        { color: "#ffc107", bgColor: "#fff3cd" },
      ];
      const colorSet = colors[index % colors.length];
      return {
        icon: Wallet,
        ...colorSet
      };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const IncomeCard = ({
    title,
    value,
    icon: Icon,
    color,
    bgColor,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
  }) => (
    <Card
      className="border-0 shadow-sm h-100"
      style={{
        borderRadius: "15px",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.05)";
      }}
    >
      <Card.Body className="p-2">
        <p className="mb-2 fw-semibold " style={{ fontSize: "18px" }}>
          {title}
        </p>
        <div className="d-flex justify-content-between align-items-start ">
          <div
            className="p-3 rounded-circle"
            style={{ backgroundColor: bgColor }}
          >
            <Icon size={24} color={color} />
          </div>
          <h3 className=" mb-1" style={{ fontSize: "28px" }}>
            {formatCurrency(value)}
          </h3>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="my-5">
      <h5 className="fw-bold mb-3">Ingresos por Método de Pago</h5>
      <Row className="g-3">
        {stats.map((stat, index) => {
          const style = getPaymentMethodStyle(stat.paymentMethodName, index);
          return (
            <Col key={stat.paymentMethodId} md={3} sm={6}>
              <IncomeCard
                title={stat.paymentMethodName}
                value={stat.total}
                icon={style.icon}
                color={style.color}
                bgColor={style.bgColor}
              />
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default IncomeStats;
