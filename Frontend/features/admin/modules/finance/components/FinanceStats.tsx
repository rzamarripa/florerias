"use client";

import React, { useEffect, useState } from "react";
import { Row, Col, Card, Spinner } from "react-bootstrap";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { financeService } from "../services/finance";
import { FinanceFilters, FinanceStats as FinanceStatsType } from "../types";
import { toast } from "react-toastify";

interface FinanceStatsProps {
  filters: FinanceFilters;
}

const FinanceStats: React.FC<FinanceStatsProps> = ({ filters }) => {
  const [stats, setStats] = useState<FinanceStatsType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await financeService.getFinanceStats(filters);
      if (response.data) {
        setStats(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar estadísticas");
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Cargando estadísticas...</p>
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

  const StatCard = ({
    title,
    subtitle,
    value,
    icon: Icon,
    iconBg,
    iconColor,
  }: {
    title: string;
    subtitle: string;
    value: number;
    icon: any;
    iconBg: string;
    iconColor: string;
  }) => (
    <Card
      className="border-0"
      style={{
        borderRadius: "4px",
        boxShadow: "0 1px 1px rgba(0,0,0,.05)",
        backgroundColor: "#fff",
      }}
    >
      <Card.Body style={{ padding: "10px" }}>
        <div
          className="mb-2"
          style={{
            fontSize: "20px",
            color: "#464545",
            fontWeight: "400",
            marginTop: "8px",
          }}
        >
          {title}
        </div>
        <div className="d-flex align-items-center justify-content-start mb-3 gap-2">
          <div
            style={{
              width: "40px",
              height: "30px",
              borderRadius: "8px",
              backgroundColor: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={20} color={iconColor} strokeWidth={2} />
          </div>
          <h2
            className="mb-1"
            style={{
              fontSize: "25px",
              fontWeight: "400",
              color: "#4b4a4a",
              lineHeight: "1.2",
            }}
          >
            {formatCurrency(value)}
          </h2>
        </div>
        <div
          className="d-flex align-items-center justify-content-between"
          style={{
            marginTop: "15px",
            paddingTop: "15px",
            borderTop: "1px solid #f2f2f2",
          }}
        >
          <span style={{ fontSize: "12px", color: "#999" }}>{subtitle}</span>
          <span
            style={{ fontSize: "12px", fontWeight: "600", color: "#2e2e2e" }}
          >
            {formatCurrency(value)}
          </span>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className=" my-3">
      <h5 className="fw-bold mb-3">Totales</h5>
      <Row className="g-3 ">
        <Col md={4}>
          <StatCard
            title="Florería"
            subtitle="Total Florería"
            value={stats.totalFloreria}
            icon={DollarSign}
            iconBg="#e8f4fd"
            iconColor="#5c9fd8"
          />
        </Col>
        <Col md={4}>
          <StatCard
            title="Eventos"
            subtitle="Total Eventos"
            value={stats.totalEventos}
            icon={DollarSign}
            iconBg="#e8f8f0"
            iconColor="#28a745"
          />
        </Col>
        <Col md={4}>
          <StatCard
            title="Gastos"
            subtitle="Total Gastos"
            value={stats.totalGastos}
            icon={TrendingDown}
            iconBg="#ffe8e8"
            iconColor="#dc3545"
          />
        </Col>
      </Row>

      <Row className="g-3">
        <Col md={4}>
          <StatCard
            title="Compras"
            subtitle="Total Compras"
            value={stats.totalCompras}
            icon={TrendingDown}
            iconBg="#fff4e6"
            iconColor="#fd7e14"
          />
        </Col>
        <Col md={8}>
          <Card
            className="border-0 bg-primary text-white"
            style={{
              borderRadius: "4px",
              boxShadow: "0 1px 1px rgba(0,0,0,.05)",
            }}
          >
            <Card.Body style={{ padding: "12px" }}>
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div
                  className="bg-white bg-opacity-25"
                  style={{
                    width: "45px",
                    height: "45px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp size={20} color="#fff" strokeWidth={2} />
                </div>
                <h2
                  className="mb-1"
                  style={{
                    fontSize: "32px",
                    fontWeight: "500",
                    lineHeight: "1.2",
                  }}
                >
                  {formatCurrency(stats.utilidad)}
                </h2>
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "400",
                  marginTop: "8px",
                  opacity: "0.9",
                }}
              >
                Utilidad Total
              </div>
              <div
                className="border-top border-white border-opacity-25"
                style={{
                  fontSize: "12px",
                  opacity: "0.7",
                  marginTop: "15px",
                  paddingTop: "15px",
                }}
              >
                (Florería + Eventos) - (Gastos + Compras)
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FinanceStats;
