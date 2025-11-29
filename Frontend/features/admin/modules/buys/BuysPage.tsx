"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Form, InputGroup, Spinner, Row, Col } from "react-bootstrap";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { buysService } from "./services/buys";
import { Buy, BuyFilters } from "./types";
import BuyModal from "./components/BuyModal";
import BuyActions from "./components/BuyActions";
import { branchesService } from "../branches/services/branches";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";

const BuysPage: React.FC = () => {
  const [buys, setBuys] = useState<Buy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [userBranches, setUserBranches] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  const userId = useUserSessionStore((state) => state.getUserId());
  const { hasRole } = useUserRoleStore();
  const { activeBranch } = useActiveBranchStore();
  const isAdmin = hasRole("Administrador") || hasRole("Admin");

  // Cargar sucursales del usuario (solo para no administradores)
  useEffect(() => {
    const loadUserBranches = async () => {
      try {
        if (!userId || isAdmin) return;
        const response = await branchesService.getUserBranches();
        if (response.data) {
          setUserBranches(response.data);
          // Si solo hay una sucursal, seleccionarla automáticamente
          if (response.data.length === 1) {
            setSelectedBranch(response.data[0]._id);
          }
        }
      } catch (error: any) {
        console.error("Error loading user branches:", error);
      }
    };

    loadUserBranches();
  }, [userId, isAdmin]);

  // Si es administrador con sucursal activa, usarla automáticamente
  useEffect(() => {
    if (isAdmin && activeBranch) {
      setSelectedBranch(activeBranch._id);
    } else if (isAdmin && !activeBranch) {
      setSelectedBranch(""); // Permitir búsqueda sin filtro
    }
  }, [isAdmin, activeBranch]);

  const loadBuys = async (isInitial: boolean, page: number = pagination.page) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: BuyFilters = {
        page,
        limit: pagination.limit,
      };

      if (startDate) {
        filters.startDate = startDate;
      }

      if (endDate) {
        filters.endDate = endDate;
      }

      if (selectedBranch) {
        filters.branchId = selectedBranch;
        console.log("🔍 [Buys] Filtrando por sucursal selectedBranch:", selectedBranch);
      } else {
        console.log("🔍 [Buys] Sin filtro de sucursal - selectedBranch:", selectedBranch);
      }

      console.log("🔍 [Buys] isAdmin:", isAdmin, "activeBranch:", activeBranch);
      console.log("🔍 [Buys] Filtros enviados:", filters);
      const response = await buysService.getAllBuys(filters);

      if (response.data) {
        // Filtrar por búsqueda local si hay término de búsqueda
        let filteredBuys = response.data;
        if (searchTerm) {
          filteredBuys = response.data.filter(
            (buy) =>
              buy.folio.toString().includes(searchTerm.toLowerCase()) ||
              buy.concept?.name?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        setBuys(filteredBuys);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar las compras");
      console.error("Error loading buys:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Para administradores: cargar siempre (con o sin sucursal)
    // Para no administradores: cargar solo si hay sucursales
    if (isAdmin || userBranches.length > 0) {
      loadBuys(true, 1);
    }
  }, [startDate, endDate, selectedBranch, searchTerm, userBranches, isAdmin]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadBuys(true, page);
  };

  const handleBuySaved = () => {
    loadBuys(false);
  };

  const handleSearch = () => {
    loadBuys(true, 1);
  };

  // Opciones para los botones de período
  const setViewMode = (mode: "dia" | "semana" | "mes") => {
    const today = new Date();
    let start = new Date();

    switch (mode) {
      case "dia":
        start = today;
        break;
      case "semana":
        start = new Date(today.setDate(today.getDate() - 7));
        break;
      case "mes":
        start = new Date(today.setMonth(today.getMonth() - 1));
        break;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Compras</h2>
          <p className="text-muted mb-0">Gestiona las compras de la sucursal</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          className="d-flex align-items-center gap-2 px-4"
        >
          <Plus size={20} />
          Agregar
        </Button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
        <div className="card-body p-4">
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label className="fw-semibold mb-2">Fecha Inicial *</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-0 bg-light"
                style={{ borderRadius: "10px" }}
              />
            </Col>
            <Col md={3}>
              <Form.Label className="fw-semibold mb-2">Fecha Final *</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-0 bg-light"
                style={{ borderRadius: "10px" }}
              />
            </Col>
            <Col md={2}>
              <Button
                variant="primary"
                onClick={handleSearch}
                className="w-100"
              >
                Buscar
              </Button>
            </Col>
            <Col md={4}>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setViewMode("dia")}
                  style={{ borderRadius: "8px", flex: 1 }}
                >
                  Día
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setViewMode("semana")}
                  style={{ borderRadius: "8px", flex: 1 }}
                >
                  Semana
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setViewMode("mes")}
                  style={{ borderRadius: "8px", flex: 1 }}
                >
                  Mes
                </Button>
              </div>
            </Col>
          </Row>

          <Row className="g-3 mt-2">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por folio o concepto..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border-0 bg-light"
                  style={{ borderRadius: "0 10px 10px 0" }}
                />
              </InputGroup>
            </Col>
          </Row>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Cargando compras...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">No.</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ACCIÓN</th>
                    <th className="px-4 py-3 fw-semibold text-muted">FECHA</th>
                    <th className="px-4 py-3 fw-semibold text-muted">SUCURSAL</th>
                    <th className="px-4 py-3 fw-semibold text-muted">FORMA PAGO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">CONCEPTO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">DESCRIPCIÓN</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-end">IMPORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {buys.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        No se encontraron compras
                      </td>
                    </tr>
                  ) : (
                    buys.map((buy, index) => (
                      <tr key={buy._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <BuyActions buy={buy} onBuySaved={handleBuySaved} />
                        </td>
                        <td className="px-4 py-3">
                          {new Date(buy.paymentDate).toLocaleDateString("es-MX")}
                        </td>
                        <td className="px-4 py-3">
                          {buy.branch?.branchName || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          {buy.paymentMethod?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 fw-semibold">{buy.concept?.name || "N/A"}</td>
                        <td className="px-4 py-3">{buy.description || "-"}</td>
                        <td className="px-4 py-3 text-end fw-semibold">
                          ${buy.amount.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && buys.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                {pagination.total} compras
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

      {/* Modal para crear compra */}
      <BuyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={handleBuySaved}
        branchId={activeBranch?._id}
      />
    </div>
  );
};

export default BuysPage;
