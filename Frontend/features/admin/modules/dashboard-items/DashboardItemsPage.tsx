"use client";

import React, { useEffect, useState } from "react";
import { Card, Col, Row, Spinner } from "react-bootstrap";
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

  // Obtener el branch ID según el rol del usuario
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

  // Cargar órdenes y calcular métricas cuando se tenga el branchId
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!branchId) return;

      try {
        setLoading(true);

        // Obtener todas las órdenes de la sucursal
        const response = await dashboardItemsService.getOrders({
          branchId,
          limit: 1000, // Obtener todas las órdenes
        });

        if (response.data) {
          // Filtrar solo órdenes del mes actual
          const currentMonthOrders =
            dashboardItemsService.filterCurrentMonthOrders(response.data);
          setOrders(currentMonthOrders);

          // Calcular métricas (ahora es async)
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
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-muted" style={{ padding: "40px" }}>
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">Dashboard de Materiales e Items</h2>
          <p className="text-muted">
            Análisis de uso de materiales y productos en las órdenes
          </p>
        </Col>
      </Row>

      {/* Métricas principales */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted mb-0">Ganancias Insumos Extras</h6>
                  <small className="text-success">
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
              <small className="text-muted">This Month</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted mb-0">Gastos Insumos Extras</h6>
                  <small className="text-info">
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
              <small className="text-muted">This Month</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted mb-0">Gastos Insumos Produccion</h6>
                  <small className="text-success">
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
              <small className="text-muted">This Month</small>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted mb-0">Ganancia Neta Total</h6>
                  <small
                    className={
                      metrics.totalRevenue -
                        (metrics.netProfit + metrics.cashFlow) >=
                      0
                        ? "text-success"
                        : "text-danger"
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
              <small className="text-muted">This Month</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Reportes trimestrales y métricas adicionales */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  Reportes Semanales{" "}
                  <span className="badge bg-primary ms-2">Mes Actual</span>
                </h5>
              </div>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>SEMANA</th>
                      <th>INGRESOS</th>
                      <th>GASTOS</th>
                      <th>MARGEN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.quarterlyReports.map((report, index) => (
                      <tr key={index}>
                        <td>
                          <div>
                            <strong>{report.quarter}</strong>
                            <br />
                            <small className="text-muted">
                              {report.period}
                            </small>
                          </div>
                        </td>
                        <td className="text-success">
                          ${report.revenue.toFixed(2)}
                        </td>
                        <td className="text-danger">
                          ${report.expense.toFixed(2)}
                        </td>
                        <td
                          className={
                            report.margin >= 0
                              ? "text-success fw-bold"
                              : "text-danger fw-bold"
                          }
                        >
                          ${report.margin.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card
            className="border-0 shadow-sm h-100"
            style={{ backgroundColor: "#2196f3", color: "white" }}
          >
            <Card.Body>
              <h1 className="display-4 mb-3">{metrics.totalOrders}</h1>
              <h5>Orders</h5>
              <p className="mb-4" style={{ opacity: 0.9 }}>
                You have received {metrics.totalOrders} new orders, indicating a
                healthy sales trend over the past period.
              </p>
              <div className="d-flex justify-content-between align-items-end mt-4">
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
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h1 className="display-4 mb-3 text-primary">
                ${(metrics.totalProfit / 1000).toFixed(1)}k
              </h1>
              <h5>Profit</h5>
              <p className="text-muted mb-4">
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
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabla de Insumos por Orden */}
      <Row>
        <Col md={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="mb-1">Detalle de Insumos por Orden</h5>
                  <p className="text-muted mb-0">
                    Análisis detallado del uso de insumos en cada orden del mes
                    actual
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <div className="text-center px-3">
                    <h6 className="mb-0 text-primary">
                      {insumoDetails.length}
                    </h6>
                    <small className="text-muted">Total Insumos</small>
                  </div>
                  <div className="text-center px-3 border-start">
                    <h6 className="mb-0 text-success">
                      {insumoDetails.filter((i) => i.isExtra).length}
                    </h6>
                    <small className="text-muted">Extras</small>
                  </div>
                  <div className="text-center px-3 border-start">
                    <h6 className="mb-0 text-warning">
                      {insumoDetails.filter((i) => !i.isExtra).length}
                    </h6>
                    <small className="text-muted">Producción</small>
                  </div>
                </div>
              </div>
              <InsumosTable insumos={insumoDetails} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardItemsPage;
