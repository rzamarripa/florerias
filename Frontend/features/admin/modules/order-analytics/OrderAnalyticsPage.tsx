"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Button, Form, Badge, Spinner } from "react-bootstrap";
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
    <Card className="border-0 shadow-sm h-100" style={{ overflow: "hidden" }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <p className="text-muted mb-2 fw-medium small">{title}</p>
            <h3 className="mb-0 fw-bold">{value}</h3>
            {trend !== undefined && (
              <div className="mt-2">
                <Badge
                  bg={trend >= 0 ? "success" : "danger"}
                  className="bg-opacity-10"
                  style={{
                    color: trend >= 0 ? "#10b981" : "#ef4444",
                  }}
                >
                  <TrendingUp size={12} className="me-1" />
                  {trend >= 0 ? "+" : ""}
                  {trend.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: bgColor,
            }}
          >
            <Icon size={28} color={color} strokeWidth={2} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  // Loading Skeleton
  if (loading && !dashboardData) {
    return (
      <div className="container-fluid py-4">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "400px" }}
        >
          <Spinner animation="border" variant="primary" />
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
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Dashboard Analítico</h2>
          <p className="text-muted mb-0">
            Análisis completo de ventas y rendimiento
          </p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2">
          <Download size={18} />
          Exportar Reporte
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-medium">
                  <Calendar size={14} className="me-1" />
                  Fecha Inicio
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-medium">
                  <Calendar size={14} className="me-1" />
                  Fecha Fin
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-medium">Período</Form.Label>
                <Form.Select
                  value={filters.period}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      period: e.target.value as any,
                    })
                  }
                >
                  <option value="day">Día</option>
                  <option value="week">Semana</option>
                  <option value="month">Mes</option>
                  <option value="year">Año</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button
                variant="primary"
                className="w-100"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                <Filter size={16} className="me-1" />
                {loading ? "Cargando..." : "Aplicar"}
              </Button>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={() => {
                  setFilters({
                    startDate: new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1
                    )
                      .toISOString()
                      .split("T")[0],
                    endDate: new Date().toISOString().split("T")[0],
                    period: "day",
                  });
                }}
              >
                Mes Actual
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col
          lg={20}
          md={6}
          sm={12}
          style={{ flex: "0 0 20%", maxWidth: "20%" }}
        >
          <StatCard
            title="Total Ventas"
            value={summary.totalSales}
            icon={ShoppingCart}
            color="#3b82f6"
            bgColor="#dbeafe"
            trend={dashboardData?.monthlyComparison?.percentageChange?.sales}
          />
        </Col>
        <Col
          lg={20}
          md={6}
          sm={12}
          style={{ flex: "0 0 20%", maxWidth: "20%" }}
        >
          <StatCard
            title="Ingresos"
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
            color="#10b981"
            bgColor="#d1fae5"
            trend={monthlyRevenueChange}
          />
        </Col>
        <Col
          lg={20}
          md={6}
          sm={12}
          style={{ flex: "0 0 20%", maxWidth: "20%" }}
        >
          <StatCard
            title="Ticket Promedio"
            value={formatCurrency(summary.averageTicket)}
            icon={TrendingUp}
            color="#8b5cf6"
            bgColor="#ede9fe"
          />
        </Col>
        <Col
          lg={20}
          md={6}
          sm={12}
          style={{ flex: "0 0 20%", maxWidth: "20%" }}
        >
          <StatCard
            title="Productos Vendidos"
            value={summary.totalProducts}
            icon={Package}
            color="#f59e0b"
            bgColor="#fef3c7"
          />
        </Col>
        <Col
          lg={20}
          md={6}
          sm={12}
          style={{ flex: "0 0 20%", maxWidth: "20%" }}
        >
          <Card
            className="border-0 shadow-sm h-100"
            style={{ overflow: "hidden" }}
          >
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <p className="text-muted mb-2 fw-medium small">
                    vs Mes Anterior
                  </p>
                  <h3 className="mb-0 fw-bold">
                    {monthlyRevenueChange >= 0 ? "+" : ""}
                    {monthlyRevenueChange.toFixed(1)}%
                  </h3>
                  <div className="mt-2">
                    <Badge
                      bg={monthlyRevenueChange >= 0 ? "success" : "danger"}
                      className="bg-opacity-10"
                      style={{
                        color:
                          monthlyRevenueChange >= 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      <TrendingUp size={12} className="me-1" />
                      {monthlyRevenueChange >= 0
                        ? "Crecimiento"
                        : "Disminución"}
                    </Badge>
                  </div>
                </div>
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
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
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        @media (max-width: 991px) {
          [style*="flex: 0 0 20%"] {
            flex: 0 0 50% !important;
            max-width: 50% !important;
          }
        }
        @media (max-width: 575px) {
          [style*="flex: 0 0 20%"] {
            flex: 0 0 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Charts Row 1 */}
      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Ventas Últimos 7 Días</h5>
                <div className="d-flex gap-3">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle me-2"
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: "#3b82f6",
                      }}
                    />
                    <small className="text-muted">Actual</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle me-2"
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: "#93c5fd",
                      }}
                    />
                    <small className="text-muted">Anterior</small>
                  </div>
                </div>
              </div>
              <div className="position-relative" style={{ height: "300px" }}>
                {dashboardData?.salesTrend &&
                dashboardData.salesTrend.length > 0 ? (
                  <SalesTrendChart data={dashboardData.salesTrend} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <TrendingUp size={48} className="mb-3 opacity-50" />
                      <p>No hay datos de ventas disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="fw-bold mb-3">Mes Actual vs Anterior</h5>
              <div className="position-relative" style={{ height: "300px" }}>
                {dashboardData?.monthlyComparison ? (
                  <MonthComparisonChart
                    data={dashboardData.monthlyComparison}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <Package size={48} className="mb-3 opacity-50" />
                      <p>No hay datos disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row className="g-3 mb-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="fw-bold mb-3">Ventas por Categoría</h5>
              <div className="position-relative" style={{ height: "300px" }}>
                {dashboardData?.salesByCategory &&
                dashboardData.salesByCategory.length > 0 ? (
                  <CategoryPieChart data={dashboardData.salesByCategory} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <Package size={48} className="mb-3 opacity-50" />
                      <p>No hay datos disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="fw-bold mb-3">Métodos de Pago</h5>
              <div className="position-relative" style={{ height: "300px" }}>
                {dashboardData?.salesByPaymentMethod &&
                dashboardData.salesByPaymentMethod.length > 0 ? (
                  <PaymentMethodChart
                    data={dashboardData.salesByPaymentMethod}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <DollarSign size={48} className="mb-3 opacity-50" />
                      <p>No hay datos disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <AlertTriangle size={20} className="text-warning me-2" />
                <h5 className="fw-bold mb-0">Stock Bajo</h5>
              </div>
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {dashboardData?.lowStockProducts?.length ? (
                  dashboardData.lowStockProducts.map((product, index) => (
                    <div
                      key={`low-stock-${index}-${product._id}`}
                      className="d-flex justify-content-between align-items-center py-2 border-bottom"
                    >
                      <div className="flex-grow-1">
                        <div className="fw-medium">{product.name}</div>
                        <small className="text-muted">
                          Mínimo: {product.minStock}
                        </small>
                      </div>
                      <Badge bg="warning" text="dark">
                        {product.currentStock}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-5">
                    <Package size={48} className="mb-2 opacity-50" />
                    <p className="mb-0">Sin productos con stock bajo</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 3 */}
      <Row className="g-3 mb-4">
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="fw-bold mb-3">Ventas por Hora del Día</h5>
              <div className="position-relative" style={{ height: "280px" }}>
                {dashboardData?.salesByHour &&
                dashboardData.salesByHour.length > 0 ? (
                  <SalesByHourChart data={dashboardData.salesByHour} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <Calendar size={48} className="mb-3 opacity-50" />
                      <p>No hay datos disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="fw-bold mb-3">Ventas por Día de la Semana</h5>
              <div className="position-relative" style={{ height: "280px" }}>
                {dashboardData?.salesByDayOfWeek &&
                dashboardData.salesByDayOfWeek.length > 0 ? (
                  <SalesByDayChart data={dashboardData.salesByDayOfWeek} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <Calendar size={48} className="mb-3 opacity-50" />
                      <p>No hay datos disponibles</p>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bottom Row */}
      <Row className="g-3">
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h5 className="fw-bold mb-3">Top Productos Más Vendidos</h5>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {dashboardData?.topProducts?.length ? (
                  dashboardData.topProducts
                    .slice(0, 5)
                    .map((product, index) => (
                      <div
                        key={`top-product-${index}-${product._id}`}
                        className="d-flex justify-content-between align-items-center py-3 border-bottom"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary"
                            style={{ width: "40px", height: "40px" }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="fw-medium">{product.name}</div>
                            <small className="text-muted">
                              Cantidad: {product.quantity}
                            </small>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold">
                            {formatCurrency(product.revenue)}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center text-muted py-5">
                    <Package size={48} className="mb-2 opacity-50" />
                    <p className="mb-0">No hay datos disponibles</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <Award size={20} className="text-primary me-2" />
                <h5 className="fw-bold mb-0">Ranking de Cajeros</h5>
              </div>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {dashboardData?.cashierRanking?.length ? (
                  dashboardData.cashierRanking
                    .slice(0, 5)
                    .map((cashier, index) => (
                      <div
                        key={`cashier-ranking-${index}-${cashier._id}`}
                        className="d-flex justify-content-between align-items-center py-3 border-bottom"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center fw-bold text-white`}
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
                            <div className="fw-medium">{cashier.name}</div>
                            <small className="text-muted">
                              {cashier.salesCount} ventas
                            </small>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-success">
                            {formatCurrency(cashier.totalRevenue)}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center text-muted py-5">
                    <Award size={48} className="mb-2 opacity-50" />
                    <p className="mb-0">No hay datos disponibles</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Selección de Sucursal */}
      <BranchSelectionModal
        show={showBranchSelectionModal}
        onHide={closeBranchSelectionModal}
        isRequired={isRequiredSelection}
        onNoBranchesFound={handleNoBranchesFound}
      />

      {/* Modal de Creación de Sucursal */}
      <BranchModal
        show={showCreateBranchModal}
        onHide={closeCreateBranchModal}
        userCompany={userCompany}
        onBranchSaved={() => {
          // El modal se cerrará automáticamente y reabrirá el de selección
          // gracias a la lógica en BranchModal (reopenBranchSelectionAfterCreate)
        }}
      />
    </div>
  );
};

export default OrderAnalyticsPage;
