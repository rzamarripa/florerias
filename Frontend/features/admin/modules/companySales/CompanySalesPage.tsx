"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Form, Spinner, Modal, Row, Col } from "react-bootstrap";
import { Search, X, Eye, Building2 } from "lucide-react";
import { companySalesService } from "./services/companySales";
import { CompanySales, BranchSales } from "./types";
import { formatCurrency } from "@/utils";
import { toast } from "react-toastify";
import SalesChart from "./components/SalesChart";

export default function CompanySalesPage() {
  const [loading, setLoading] = useState(false);
  const [companiesSales, setCompaniesSales] = useState<CompanySales[]>([]);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Estado para el modal de detalle
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanySales | null>(
    null
  );
  const [companyDetail, setCompanyDetail] = useState<BranchSales[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Cargar datos
  const loadCompanySales = async () => {
    try {
      setLoading(true);

      const params: any = {};

      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      const response = await companySalesService.getCompaniesSalesSummary(
        params
      );

      if (response.success) {
        setCompaniesSales(response.data || []);
      }
    } catch (error) {
      console.error("Error al cargar ventas de empresas:", error);
      toast.error("Error al cargar las ventas de franquicias");
    } finally {
      setLoading(false);
    }
  };

  // Cargar detalle de empresa
  const loadCompanyDetail = async (company: CompanySales) => {
    try {
      setLoadingDetail(true);
      setSelectedCompany(company);

      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await companySalesService.getCompanySalesDetail(
        company.companyId,
        params
      );

      if (response.success) {
        setCompanyDetail(response.data.branches || []);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Error al cargar detalle de empresa:", error);
      toast.error("Error al cargar el detalle de la empresa");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    // Cargar datos del día actual al inicio
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    loadCompanySales();
  }, []);

  const handleClearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    loadCompanySales();
  };

  // Preparar datos para la gráfica con datos reales de empresas
  const chartData = useMemo(() => {
    // Usar los nombres de las empresas como etiquetas
    const labels = companiesSales.slice(0, 10).map(company => {
      // Acortar nombres largos
      const name = company.companyName;
      return name.length > 15 ? name.substring(0, 12) + '...' : name;
    });
    
    // Extraer datos reales de cada empresa
    const salesData = companiesSales.slice(0, 10).map(company => company.totalSales);
    const paidData = companiesSales.slice(0, 10).map(company => company.totalPaid);
    const royaltiesData = companiesSales.slice(0, 10).map(company => company.royaltiesAmount);
    const brandAdvData = companiesSales.slice(0, 10).map(company => company.brandAdvertisingAmount);
    const branchAdvData = companiesSales.slice(0, 10).map(company => company.branchAdvertisingAmount);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Págos',
          data: paidData,
          borderColor: '#1ab394',
          backgroundColor: 'rgba(26, 179, 148, 0.1)',
        },
        {
          label: 'Gastos',
          data: salesData.map((sale, index) => sale - paidData[index]), // Diferencia entre ventas y pagado
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
          label: 'Publicidad Franquicia',
          data: branchAdvData,
          borderColor: '#23c6c8',
          backgroundColor: 'rgba(35, 198, 200, 0.1)',
        }
      ]
    };
  }, [companiesSales]);

  return (
    <div className="container-fluid py-1">
      {/* Header */}
      <div className="mb-1">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2 className="mb-0 fw-bold">Ventas de Franquicias</h2>
            <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
              Resumen de ventas por empresa franquicia
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
                onClick={loadCompanySales}
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
      {companiesSales.length > 0 && (
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
                      Empresa
                    </th>
                    <th
                      className="border-0 text-center py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Sucursales
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
                      Publicidad Marca
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Publicidad Sucursal
                    </th>
                    <th
                      className="border-0 text-center py-2"
                      style={{ fontSize: "14px", fontWeight: "700" }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companiesSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-3 text-muted">
                        No se encontraron datos para el período seleccionado
                      </td>
                    </tr>
                  ) : (
                    companiesSales.map((company) => (
                      <tr key={company.companyId}>
                        <td className="px-4 py-2">
                          <span className="fw-semibold">
                            {company.companyName}
                          </span>
                        </td>
                        <td className="text-center py-2">
                          <span className="badge bg-light text-dark">
                            {company.totalBranches}
                          </span>
                        </td>
                        <td className="text-end px-3 py-2">
                          <span className="fw-semibold">
                            {formatCurrency(company.totalSales)}
                          </span>
                        </td>
                        <td className="text-end px-3 py-2">
                          <div>
                            <span className="fw-semibold">
                              {formatCurrency(company.totalPaid)}
                            </span>
                            {company.totalSales > 0 && (
                              <div>
                                <small className="text-muted">
                                  {(
                                    (company.totalPaid / company.totalSales) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </small>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-end px-3 py-2">
                          {company.royaltiesAmount === 0 ? (
                            <span className="text-muted">-</span>
                          ) : (
                            <div>
                              <span className="fw-semibold">
                                {formatCurrency(company.royaltiesAmount)}
                              </span>
                              <div>
                                <small className="text-muted">
                                  {company.royalties.toFixed(2)}%
                                </small>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="text-end px-3 py-2">
                          <div>
                            <span className="fw-semibold">
                              {formatCurrency(company.brandAdvertisingAmount)}
                            </span>
                            <div>
                              <small className="text-muted">
                                {company.brandAdvertising.toFixed(2)}%
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="text-end px-3 py-2">
                          <div>
                            <span className="fw-semibold">
                              {formatCurrency(company.branchAdvertisingAmount)}
                            </span>
                            <div>
                              <small className="text-muted">
                                {company.branchAdvertising.toFixed(2)}%
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => loadCompanyDetail(company)}
                            disabled={loadingDetail}
                            className="px-2 py-1"
                          >
                            <Eye size={16} />
                          </Button>
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

      {/* Modal de detalle por sucursales */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton style={{ borderBottom: "2px solid #f1f3f5" }}>
          <Modal.Title className="d-flex align-items-center">
            <Building2 size={20} className="me-2" />
            <span className="fw-bold">
              Detalle de Ventas - {selectedCompany?.companyName}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {loadingDetail ? (
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
                      style={{ fontSize: "13px", fontWeight: "600" }}
                    >
                      Sucursal
                    </th>
                    <th
                      className="border-0 px-3 py-2"
                      style={{ fontSize: "13px", fontWeight: "600" }}
                    >
                      Código
                    </th>
                    <th
                      className="border-0 text-center py-2"
                      style={{ fontSize: "13px", fontWeight: "600" }}
                    >
                      Órdenes
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "13px", fontWeight: "600" }}
                    >
                      Ventas
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "13px", fontWeight: "600" }}
                    >
                      Pagado
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "13px", fontWeight: "600" }}
                    >
                      Regalías
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "13px", fontWeight: "600" }}
                    >
                      Pub. Marca
                    </th>
                    <th
                      className="border-0 text-end px-3 py-2"
                      style={{ fontSize: "13px", fontWeight: "600" }}
                    >
                      Pub. Sucursal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companyDetail.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-3 text-muted">
                        No se encontraron sucursales
                      </td>
                    </tr>
                  ) : (
                    companyDetail.map((branch) => (
                      <tr key={branch.branchId}>
                        <td className="px-4 py-2">{branch.branchName}</td>
                        <td className="px-3 py-2">
                          <span className="badge bg-light text-dark">
                            {branch.branchCode}
                          </span>
                        </td>
                        <td className="text-center py-2">
                          {branch.totalOrders}
                        </td>
                        <td className="text-end px-3 py-2 fw-semibold">
                          {formatCurrency(branch.totalSales)}
                        </td>
                        <td className="text-end px-3 py-2">
                          <div>{formatCurrency(branch.totalPaid)}</div>
                          {branch.totalSales > 0 && (
                            <small className="text-muted">
                              {(
                                (branch.totalPaid / branch.totalSales) *
                                100
                              ).toFixed(1)}
                              %
                            </small>
                          )}
                        </td>
                        <td className="text-end px-3 py-2">
                          {!selectedCompany?.isFranchise ||
                          branch.royaltiesAmount === 0 ? (
                            <span className="text-muted">-</span>
                          ) : (
                            <div>
                              <div>
                                {formatCurrency(branch.royaltiesAmount)}
                              </div>
                              <small className="text-muted">
                                {branch.royaltiesPercentage.toFixed(2)}%
                              </small>
                            </div>
                          )}
                        </td>
                        <td className="text-end px-3 py-2">
                          <div>
                            {formatCurrency(branch.brandAdvertisingAmount)}
                          </div>
                          <small className="text-muted">
                            {branch.brandAdvertisingPercentage.toFixed(2)}%
                          </small>
                        </td>
                        <td className="text-end px-3 py-2">
                          <div>
                            {formatCurrency(branch.branchAdvertisingAmount)}
                          </div>
                          <small className="text-muted">
                            {branch.branchAdvertisingPercentage.toFixed(2)}%
                          </small>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "2px solid #f1f3f5" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDetailModal(false)}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
