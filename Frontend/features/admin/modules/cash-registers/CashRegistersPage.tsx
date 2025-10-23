"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Badge,
  Form,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { Plus, Search, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { toast } from "react-toastify";
import { cashRegistersService } from "./services/cashRegisters";
import { CashRegister, Branch } from "./types";
import CashRegisterActions from "./components/CashRegisterActions";
import CashRegisterModal from "./components/CashRegisterModal";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { branchesService } from "../branches/services/branches";

const CashRegistersPage: React.FC = () => {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const { getUserId } = useUserSessionStore();
  const { getIsAdmin } = useUserRoleStore();
  const userId = getUserId();
  const isAdmin = getIsAdmin();

  // Cargar sucursales disponibles para el filtro
  const loadBranches = async () => {
    try {
      const response = await branchesService.getAllBranches({ limit: 100 });
      if (response.data) {
        setBranches(response.data);
      }
    } catch (error: any) {
      console.error("Error al cargar sucursales:", error);
    }
  };

  const loadCashRegisters = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: any = {
        page,
        limit: pagination.limit,
      };

      if (branchFilter) {
        filters.branchId = branchFilter;
      }

      const response = await cashRegistersService.getAllCashRegisters(filters);

      if (response.data) {
        setCashRegisters(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las cajas registradoras");
      console.error("Error loading cash registers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar sucursales al montar el componente
  useEffect(() => {
    loadBranches();
  }, []);

  // Cargar cajas registradoras cuando cambian los filtros
  useEffect(() => {
    loadCashRegisters(true, 1);
  }, [branchFilter]);

  const handleBranchFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setBranchFilter(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadCashRegisters(true, page);
  };

  const handleCashRegisterUpdated = () => {
    loadCashRegisters(false);
  };

  const getBranchName = (cashRegister: CashRegister): string => {
    if (typeof cashRegister.branchId === "string") {
      return "N/A";
    }
    return cashRegister.branchId.branchName;
  };

  const getCashierName = (cashRegister: CashRegister): string => {
    if (typeof cashRegister.cashierId === "string") {
      return "N/A";
    }
    return cashRegister.cashierId.profile.fullName;
  };

  const getManagerName = (cashRegister: CashRegister): string => {
    if (typeof cashRegister.managerId === "string") {
      return "N/A";
    }
    return cashRegister.managerId.profile.fullName;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
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
          <h2 className="mb-1 fw-bold">Cajas Registradoras</h2>
          <p className="text-muted mb-0">
            Gestiona las cajas registradoras del sistema
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="d-flex align-items-center gap-2 px-4"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "10px",
              padding: "12px 24px",
              fontWeight: "600",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            }}
          >
            <Plus size={20} />
            Nueva Caja
          </Button>
        )}
      </div>

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "15px" }}
      >
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Select
                value={branchFilter}
                onChange={handleBranchFilterChange}
                className="border-0 bg-light"
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todas las sucursales</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.branchName}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Cargando cajas registradoras...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">#</th>
                    <th className="px-4 py-3 fw-semibold text-muted">NOMBRE</th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      SUCURSAL
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">CAJERO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      GERENTE
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      SALDO ACTUAL
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">
                      ÚLTIMO CIERRE
                    </th>
                    <th className="px-4 py-3 fw-semibold text-muted">ESTADO</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-center">
                      ACCIONES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cashRegisters.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-5 text-muted">
                        <Wallet size={48} className="mb-3 opacity-50" />
                        <p className="mb-0">
                          No se encontraron cajas registradoras
                        </p>
                      </td>
                    </tr>
                  ) : (
                    cashRegisters.map((cashRegister, index) => (
                      <tr
                        key={cashRegister._id}
                        style={{ borderBottom: "1px solid #f1f3f5" }}
                      >
                        <td className="px-4 py-3">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-4 py-3 fw-semibold">
                          {cashRegister.name}
                        </td>
                        <td className="px-4 py-3">
                          {getBranchName(cashRegister)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="fw-semibold">
                            {getCashierName(cashRegister)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="fw-semibold">
                            {getManagerName(cashRegister)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="fw-bold text-success">
                            {formatCurrency(cashRegister.currentBalance)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <small className="text-muted">
                            {formatDate(cashRegister.lastOpen)}
                          </small>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex flex-column gap-1">
                            <Badge
                              bg={cashRegister.isOpen ? "success" : "secondary"}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "15px",
                                fontWeight: "500",
                                fontSize: "0.75rem",
                              }}
                            >
                              {cashRegister.isOpen ? "Abierta" : "Cerrada"}
                            </Badge>
                            <Badge
                              bg={cashRegister.isActive ? "primary" : "danger"}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "15px",
                                fontWeight: "500",
                                fontSize: "0.75rem",
                              }}
                            >
                              {cashRegister.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <CashRegisterActions
                            cashRegister={cashRegister}
                            onCashRegisterUpdated={handleCashRegisterUpdated}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && cashRegisters.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                de {pagination.total} cajas
              </p>
              <div className="d-flex gap-2">
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  style={{ borderRadius: "8px" }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-3 py-1">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  style={{ borderRadius: "8px" }}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isAdmin && (
        <CashRegisterModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onCashRegisterSaved={handleCashRegisterUpdated}
        />
      )}
    </div>
  );
};

export default CashRegistersPage;
