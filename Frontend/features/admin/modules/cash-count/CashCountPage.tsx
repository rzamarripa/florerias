"use client";

import React, { useState, useEffect } from "react";
import { Table, Spinner, Button, Form, Row, Col, Badge, Pagination } from "react-bootstrap";
import { Eye, Calendar, DollarSign } from "lucide-react";
import { toast } from "react-toastify";
import { cashRegisterLogsService } from "./services/cashRegisterLogs";
import { CashRegisterLog, CashRegisterRef } from "./types";
import CashCountDetailModal from "./components/CashCountDetailModal";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

const CashCountPage: React.FC = () => {
  const { activeBranch } = useActiveBranchStore();
  const { getIsCashier, getIsAdmin } = useUserRoleStore();
  const isCashier = getIsCashier();
  const isAdmin = getIsAdmin();

  const [logs, setLogs] = useState<CashRegisterLog[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegisterRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CashRegisterLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [filters, setFilters] = useState({
    cashRegisterId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadCashRegisters();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters.page, filters.limit]);

  // Recargar logs cuando cambie la sucursal activa
  useEffect(() => {
    loadLogs();
  }, [activeBranch?._id]);

  const loadCashRegisters = async () => {
    // Los cajeros no necesitan cargar la lista de cajas porque el filtro se aplica automáticamente en el backend
    if (isCashier) {
      return;
    }

    try {
      const response = await cashRegisterLogsService.getUserCashRegisters();
      if (response.success) {
        setCashRegisters(response.data);
      }
    } catch (error: any) {
      console.error("Error loading cash registers:", error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);

      // Para cajeros: el backend filtra automáticamente por cashierId
      // Para admins: incluir el branchId de la sucursal activa si existe
      const filtersToSend = isCashier
        ? {
            ...filters,
            cashRegisterId: undefined, // Eliminar el filtro de caja para cajeros (el backend filtra por cashierId)
          }
        : {
            ...filters,
            ...(activeBranch?._id && { branchId: activeBranch._id })
          };

      const response = await cashRegisterLogsService.getAllCashRegisterLogs(filtersToSend);

      if (response.success) {
        setLogs(response.data);
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el historial de cierres");
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      cashRegisterId: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
    });
    setTimeout(() => loadLogs(), 100);
  };

  const handleViewDetail = async (logId: string) => {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const response = await cashRegisterLogsService.getCashRegisterLogById(logId);
      if (response.success) {
        setSelectedLog(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar el detalle");
      console.error("Error loading log detail:", error);
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Historial de Cierres de Caja</h2>
          <p className="text-muted mb-0">
            Consulta el historial completo de cierres de caja registradora
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-4">
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <Calendar size={16} className="me-2" />
                  Fecha Inicio
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  <Calendar size={16} className="me-2" />
                  Fecha Fin
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>

            {/* Ocultar selector de caja para cajeros - el backend filtra automáticamente por su sucursal */}
            {!isCashier && (
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <DollarSign size={16} className="me-2" />
                    Caja Registradora
                  </Form.Label>
                  <Form.Select
                    value={filters.cashRegisterId}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        cashRegisterId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Todas las cajas</option>
                    {cashRegisters.map((cashRegister) => (
                      <option key={cashRegister._id} value={cashRegister._id}>
                        {cashRegister.name}
                        {cashRegister.branchId &&
                          ` - ${cashRegister.branchId.branchName}`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            <Col md={isCashier ? 4 : 2} className="d-flex align-items-end gap-2">
              <Button
                variant="primary"
                onClick={handleSearch}
                className="w-100"
              >
                Buscar
              </Button>
              <Button
                variant="outline-secondary"
                onClick={handleClearFilters}
                className="w-100"
              >
                Limpiar
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      {/* Table */}
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead style={{ background: "#f8f9fa" }}>
                <tr>
                  <th className="px-4 py-3 fw-semibold text-muted">
                    FECHA CIERRE
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted">CAJA</th>
                  <th className="px-4 py-3 fw-semibold text-muted">SUCURSAL</th>
                  <th className="px-4 py-3 fw-semibold text-muted">CAJERO</th>
                  <th className="px-4 py-3 fw-semibold text-muted">GERENTE</th>
                  <th className="px-4 py-3 fw-semibold text-muted text-end">
                    SALDO INICIAL
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted text-end">
                    TOTAL VENTAS
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted text-end">
                    TOTAL GASTOS
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted text-end">
                    SALDO FINAL
                  </th>
                  <th className="px-4 py-3 fw-semibold text-muted text-center">
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="text-muted mt-3">Cargando historial...</p>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-5">
                      <DollarSign size={48} className="text-muted mb-3" />
                      <p className="text-muted mb-0">
                        No se encontraron cierres de caja
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log._id}
                      style={{ borderBottom: "1px solid #f1f3f5" }}
                    >
                      <td className="px-4 py-3">
                        <div className="fw-semibold">
                          {formatDate(log.closedAt)}
                        </div>
                        {log.openedAt && (
                          <small className="text-muted">
                            Abierto: {formatDate(log.openedAt)}
                          </small>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="fw-semibold">{log.cashRegisterName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          bg="info"
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontWeight: "500",
                          }}
                        >
                          {log.branchId.branchName}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {log.cashierId ? (
                          <div>
                            <div className="fw-semibold" style={{ fontSize: "13px" }}>
                              {log.cashierId.profile.fullName}
                            </div>
                            <small className="text-muted">
                              {log.cashierId.username}
                            </small>
                          </div>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="fw-semibold" style={{ fontSize: "13px" }}>
                            {log.managerId.profile.fullName}
                          </div>
                          <small className="text-muted">
                            {log.managerId.username}
                          </small>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <span className="fw-semibold">
                          {formatCurrency(log.totals.initialBalance)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <span className="fw-semibold text-success">
                          {formatCurrency(log.totals.totalSales)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <span className="fw-semibold text-danger">
                          {formatCurrency(log.totals.totalExpenses)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <span className="fw-bold text-primary">
                          {formatCurrency(log.totals.finalBalance)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="light"
                          size="sm"
                          className="rounded-circle"
                          style={{ width: "32px", height: "32px", padding: "0" }}
                          onClick={() => handleViewDetail(log._id)}
                          title="Ver detalle"
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

          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="d-flex justify-content-between align-items-center p-4 border-top">
              <div className="text-muted">
                Mostrando {logs.length} de {pagination.total} registros
              </div>
              <Pagination className="mb-0">
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                />

                {[...Array(pagination.pages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === pagination.pages ||
                    (pageNumber >= pagination.page - 1 &&
                      pageNumber <= pagination.page + 1)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNumber}
                        active={pageNumber === pagination.page}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    );
                  } else if (
                    pageNumber === pagination.page - 2 ||
                    pageNumber === pagination.page + 2
                  ) {
                    return <Pagination.Ellipsis key={pageNumber} disabled />;
                  }
                  return null;
                })}

                <Pagination.Next
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(pagination.pages)}
                  disabled={pagination.page === pagination.pages}
                />
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <CashCountDetailModal
        show={showDetailModal}
        onHide={() => {
          setShowDetailModal(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
        loading={loadingDetail}
      />
    </div>
  );
};

export default CashCountPage;
