"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Form, Spinner, Row, Col } from "react-bootstrap";
import { Search, X } from "lucide-react";
import { companySalesService } from "./services/companySales";
import { BranchSalesData } from "./types";
import { formatCurrency } from "@/utils";
import { toast } from "react-toastify";
import SalesChart from "./components/SalesChart";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { branchesService } from "../branches/services/branches";

export default function CompanySalesPage() {
  const [loading, setLoading] = useState(false);
  const [branchesSales, setBranchesSales] = useState<BranchSalesData[]>([]);
  const userId = useUserSessionStore((state) => state.getUserId());

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Cargar datos de sucursales del usuario administrador
  const loadBranchesSales = async () => {
    try {
      setLoading(true);

      if (!userId) {
        toast.error("No se pudo obtener el usuario actual");
        return;
      }

      // Primero obtener las sucursales donde el usuario es administrador
      const branchesResponse = await branchesService.getAllBranches({
        managerId: userId,
        limit: 100
      });

      if (!branchesResponse.success || !branchesResponse.data?.length) {
        setBranchesSales([]);
        return;
      }

      // Para cada sucursal, obtener sus datos de ventas
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Obtener los IDs de las sucursales
      const branchIds = branchesResponse.data.map(branch => branch._id);

      // Llamar al endpoint para obtener las ventas de estas sucursales específicas
      const salesResponse = await companySalesService.getBranchesSales({
        branchIds,
        ...params
      });

      if (salesResponse.success && salesResponse.data) {
        setBranchesSales(salesResponse.data);
      }
    } catch (error) {
      console.error("Error al cargar ventas de sucursales:", error);
      toast.error("Error al cargar las ventas de sucursales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar datos del día actual al inicio
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    loadBranchesSales();
  }, []);

  const handleClearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    loadBranchesSales();
  };

  // Preparar datos para la gráfica con datos reales de sucursales
  const chartData = useMemo(() => {
    // Usar los nombres de las sucursales como etiquetas
    const labels = branchesSales.slice(0, 10).map(branch => {
      // Acortar nombres largos
      const name = `${branch.branchName} (${branch.branchCode})`;
      return name.length > 20 ? name.substring(0, 17) + '...' : name;
    });
    
    // Extraer datos reales de cada sucursal
    const salesData = branchesSales.slice(0, 10).map(branch => branch.totalSalesWithoutDelivery); // S/S
    const deliveryData = branchesSales.slice(0, 10).map(branch => branch.totalDeliveryService); // Servicio
    const paidData = branchesSales.slice(0, 10).map(branch => branch.totalPaid);
    const royaltiesData = branchesSales.slice(0, 10).map(branch => branch.royaltiesAmount);
    const brandAdvData = branchesSales.slice(0, 10).map(branch => branch.brandAdvertisingAmount);
    const branchAdvData = branchesSales.slice(0, 10).map(branch => branch.branchAdvertisingAmount);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Ventas S/S',
          data: salesData,
          borderColor: '#1ab394',
          backgroundColor: 'rgba(26, 179, 148, 0.1)',
        },
        {
          label: 'Servicio',
          data: deliveryData,
          borderColor: '#9b59b6',
          backgroundColor: 'rgba(155, 89, 182, 0.1)',
        },
        {
          label: 'Pagado',
          data: paidData,
          borderColor: '#f8ac59',
          backgroundColor: 'rgba(248, 172, 89, 0.1)',
        },
        {
          label: 'Regalías',
          data: royaltiesData,
          borderColor: '#ed5565',
          backgroundColor: 'rgba(237, 85, 101, 0.1)',
        },
        {
          label: 'Publicidad Marca',
          data: brandAdvData,
          borderColor: '#1c84c6',
          backgroundColor: 'rgba(28, 132, 198, 0.1)',
        },
        {
          label: 'Publicidad Sucursal',
          data: branchAdvData,
          borderColor: '#23c6c8',
          backgroundColor: 'rgba(35, 198, 200, 0.1)',
        }
      ]
    };
  }, [branchesSales]);

  return (
    <div className="container-fluid py-1">
      {/* Header */}
      <div className="mb-1">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="mb-0 fw-bold">Ventas de Sucursales del Administrador</h2>
            <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
              Resumen de ventas por sucursal
            </p>
          </div>
        </div>
      </div>

      {/* Card de filtros */}
      <div
        className="card border-0 shadow-sm mb-1"
        style={{ borderRadius: "10px" }}
      >
        <div className="card-body py-1 px-3">
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-muted">
                  Fecha inicio
                </Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-semibold text-muted">
                  Fecha fin
                </Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  size="sm"
                />
              </Form.Group>
            </Col>

            <Col md={4} className="d-flex gap-2">
              <Button
                variant="primary"
                onClick={loadBranchesSales}
                disabled={loading}
                size="sm"
                className="px-3"
              >
                <Search size={16} className="me-1" />
                Buscar
              </Button>

              <Button
                variant="outline-secondary"
                onClick={handleClearFilters}
                size="sm"
              >
                <X size={16} className="me-1" />
                Limpiar
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      {/* Gráfica de ventas */}
      {branchesSales.length > 0 && (
        <div className="mb-2">
          <SalesChart 
            data={chartData} 
            title="Ventas"
          />
        </div>
      )}

      {/* Tabla principal */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-3">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ backgroundColor: "#f8f9fa" }}>
                  <tr>
                    <th
                      className="border-0 px-4 py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Sucursal
                    </th>
                    <th
                      className="border-0 text-center py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Código
                    </th>
                    <th
                      className="border-0 text-center py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Órdenes
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Total Ventas
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Servicio
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      S/S
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Total Pagado
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Regalías
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Pub. Marca
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Pub. Sucursal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {branchesSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-3 text-muted">
                        No se encontraron datos para el período seleccionado
                      </td>
                    </tr>
                  ) : (
                    branchesSales.map((branch) => (
                      <tr key={branch.branchId}>
                        <td className="px-4 py-2">
                          <span className="fw-semibold">
                            {branch.branchName}
                          </span>
                        </td>
                        <td className="text-center py-2">
                          <span className="badge bg-light text-dark">
                            {branch.branchCode}
                          </span>
                        </td>
                        <td className="text-center py-2">
                          {branch.totalOrders}
                        </td>
                        <td className="text-end px-3 py-2">
                          <span className="fw-semibold">
                            {formatCurrency(branch.totalSales)}
                          </span>
                        </td>
                        <td className="text-end px-3 py-2">
                          <span className="fw-semibold">
                            {formatCurrency(branch.totalDeliveryService)}
                          </span>
                        </td>
                        <td className="text-end px-3 py-2">
                          <span className="fw-semibold text-success">
                            {formatCurrency(branch.totalSalesWithoutDelivery)}
                          </span>
                        </td>
                        <td className="text-end px-3 py-2">
                          <div>
                            <span className="fw-semibold">
                              {formatCurrency(branch.totalPaid)}
                            </span>
                            {branch.totalSalesWithoutDelivery > 0 && (
                              <div>
                                <small className="text-muted">
                                  {(
                                    (branch.totalPaid / branch.totalSalesWithoutDelivery) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </small>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-end px-3 py-2">
                          {branch.royaltiesAmount === 0 ? (
                            <span className="text-muted">-</span>
                          ) : (
                            <div>
                              <span className="fw-semibold">
                                {formatCurrency(branch.royaltiesAmount)}
                              </span>
                              <div>
                                <small className="text-muted">
                                  {branch.royalties.toFixed(2)}%
                                </small>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="text-end px-3 py-2">
                          <div>
                            <span className="fw-semibold">
                              {formatCurrency(branch.brandAdvertisingAmount)}
                            </span>
                            <div>
                              <small className="text-muted">
                                {branch.brandAdvertising.toFixed(2)}%
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="text-end px-3 py-2">
                          <div>
                            <span className="fw-semibold">
                              {formatCurrency(branch.branchAdvertisingAmount)}
                            </span>
                            <div>
                              <small className="text-muted">
                                {branch.branchAdvertising.toFixed(2)}%
                              </small>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
