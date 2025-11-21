"use client";

import { Search, ChevronLeft, ChevronRight, Plus, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button, Form, Table, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { cashiersService } from "./services/cashiers";
import { Cashier, CashierFilters, CreateCashierData, UpdateCashierData } from "./types";
import Actions from "./components/Actions";
import CashierModal from "./components/CashierModal";

const CashiersPage: React.FC = () => {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadCashiers = async (
    isInitial: boolean,
    page: number = pagination.page
  ) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: CashierFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (statusFilter) {
        filters.estatus = statusFilter === "true";
      }

      const response = await cashiersService.getAllCashiers(filters);

      if (response.data) {
        setCashiers(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los cajeros");
      console.error("Error loading cashiers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashiers(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadCashiers(true, page);
  };

  const handleCreateCashier = () => {
    setSelectedCashier(null);
    setShowModal(true);
  };

  const handleEditCashier = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setShowModal(true);
  };

  const handleToggleStatus = async (cashier: Cashier) => {
    try {
      if (cashier.profile.estatus) {
        await cashiersService.deactivateCashier(cashier._id);
        toast.success("Cajero desactivado exitosamente");
      } else {
        await cashiersService.activateCashier(cashier._id);
        toast.success("Cajero activado exitosamente");
      }
      loadCashiers(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del cajero");
    }
  };

  const handleSaveCashier = async (data: CreateCashierData | UpdateCashierData) => {
    try {
      setModalLoading(true);
      if (selectedCashier) {
        await cashiersService.updateCashier(selectedCashier._id, data);
        toast.success("Cajero actualizado exitosamente");
      } else {
        await cashiersService.createCashier(data as CreateCashierData);
        toast.success("Cajero creado exitosamente");
      }
      setShowModal(false);
      loadCashiers(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el cajero");
    } finally {
      setModalLoading(false);
    }
  };

  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(pages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < pages - 1) {
      rangeWithDots.push("...", pages);
    } else if (pages > 1) {
      rangeWithDots.push(pages);
    }

    return rangeWithDots;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="card">
          <div className="card-header border-light d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <h5 className="mb-0 fw-bold" style={{ fontSize: 20 }}>
                Cajeros
              </h5>
              <div className="position-relative" style={{ maxWidth: 300 }}>
                <Form.Control
                  type="search"
                  placeholder="Buscar cajeros..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="shadow-none px-4"
                  style={{ fontSize: 15, paddingLeft: "2.5rem" }}
                />
                <Search
                  className="text-muted position-absolute"
                  size={18}
                  style={{
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
              </div>
              <Form.Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="shadow-none"
                style={{ maxWidth: 150 }}
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Form.Select>
            </div>
            <Button
              variant="primary"
              onClick={handleCreateCashier}
              className="d-flex align-items-center gap-2"
            >
              <Plus size={16} />
              Nuevo Cajero
            </Button>
          </div>
          <div className="table-responsive shadow-sm border border-2 rounded-3">
            <Table className="table table-custom table-centered table-hover table-bordered border border-2 w-100 mb-0">
              <thead
                className="bg-light align-middle bg-opacity-25"
                style={{ fontSize: 16 }}
              >
                <tr>
                  <th>#</th>
                  <th>Nombre Completo</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Sucursal</th>
                  <th>Estatus</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="d-flex flex-column align-items-center">
                        <div
                          className="spinner-border text-primary mb-2"
                          role="status"
                        >
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <p className="text-muted mb-0 small">
                          Cargando cajeros...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : cashiers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      <div className="text-muted">
                        <User size={48} className="mb-3 opacity-50" />
                        <div>No se encontraron cajeros</div>
                        <small>Intenta ajustar los filtros de búsqueda</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cashiers.map((cashier, index) => (
                    <tr key={cashier._id}>
                      <td>
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{cashier.profile.fullName}</div>
                          <div className="text-muted small">
                            {formatDate(cashier.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-10 text-secondary">
                          @{cashier.username}
                        </span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: "200px" }}>
                          {cashier.email}
                        </div>
                      </td>
                      <td>{cashier.phone}</td>
                      <td>
                        {cashier.branch ? (
                          <div>
                            <div className="fw-medium">{cashier.branch.branchName}</div>
                            <div className="text-muted small">{cashier.branch.branchCode}</div>
                          </div>
                        ) : (
                          <span className="text-muted">Sin sucursal</span>
                        )}
                      </td>
                      <td>
                        <Badge
                          bg={cashier.profile.estatus ? "success" : "danger"}
                          className="bg-opacity-10"
                          style={{
                            color: cashier.profile.estatus ? "#198754" : "#dc3545",
                          }}
                        >
                          {cashier.profile.estatus ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Actions
                          cashier={cashier}
                          onEdit={handleEditCashier}
                          onToggleStatus={handleToggleStatus}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          <div className="d-flex justify-content-between align-items-center p-3 border-top">
            <span className="text-muted">
              Mostrando {cashiers.length} de {pagination.total} registros
            </span>
            <div className="d-flex gap-1 align-items-center">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="d-flex align-items-center"
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>

              {getPageNumbers().map((pageNum, index) => (
                <React.Fragment key={index}>
                  {pageNum === "..." ? (
                    <span className="px-2 text-muted">...</span>
                  ) : (
                    <Button
                      variant={
                        pageNum === pagination.page
                          ? "primary"
                          : "outline-secondary"
                      }
                      size="sm"
                      onClick={() => handlePageChange(pageNum as number)}
                    >
                      {pageNum}
                    </Button>
                  )}
                </React.Fragment>
              ))}

              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="d-flex align-items-center"
              >
                Siguiente
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CashierModal
        show={showModal}
        onHide={() => setShowModal(false)}
        cashier={selectedCashier}
        onSave={handleSaveCashier}
        loading={modalLoading}
      />
    </div>
  );
};

export default CashiersPage;
