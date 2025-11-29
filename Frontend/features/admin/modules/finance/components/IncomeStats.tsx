"use client";

import React, { useEffect, useState } from "react";
import { Row, Col, Card, Spinner } from "react-bootstrap";
import { CreditCard, DollarSign, Wallet, Building2 } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, IncomeStats as IncomeStatsType } from "../types";
import { toast } from "react-toastify";

interface IncomeStatsProps {
  filters: FinanceFilters;
}

const IncomeStats: React.FC<IncomeStatsProps> = ({ filters }) => {
  const [stats, setStats] = useState<IncomeStatsType | null>(null);
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

  if (!stats) {
    return null;
  }

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
      <h5 className="fw-bold mb-3">Ingresos</h5>
      <Row className="g-3">
        <Col md={3}>
          <IncomeCard
            title="Transferencia"
            value={stats.transferencia}
            icon={Building2}
            color="#0d6efd"
            bgColor="#cfe2ff"
          />
        </Col>
        <Col md={3}>
          <IncomeCard
            title="Efectivo"
            value={stats.efectivo}
            icon={DollarSign}
            color="#28a745"
            bgColor="#d4edda"
          />
        </Col>
        <Col md={3}>
          <IncomeCard
            title="Tarjeta"
            value={stats.tarjeta}
            icon={CreditCard}
            color="#17a2b8"
            bgColor="#d1ecf1"
          />
        </Col>
        <Col md={3}>
          <IncomeCard
            title="Depósito"
            value={stats.deposito}
            icon={Wallet}
            color="#fd7e14"
            bgColor="#ffe5d0"
          />
        </Col>
      </Row>
    </div>
  );
};

export default IncomeStats;
