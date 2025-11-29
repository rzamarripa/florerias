"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Form, InputGroup, Spinner, Modal } from "react-bootstrap";
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { paymentMethodsService } from "./services/paymentMethods";
import { PaymentMethod, PaymentMethodFilters, CreatePaymentMethodData } from "./types";

const PaymentMethodsPage: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<CreatePaymentMethodData>({
    name: "",
    abbreviation: "",
    status: true,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });

  const loadPaymentMethods = async (isInitial: boolean, page: number = pagination.page) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: PaymentMethodFilters = {
        page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        filters.name = searchTerm;
      }

      if (statusFilter) {
        filters.status = statusFilter === "true";
      }

      const response = await paymentMethodsService.getAllPaymentMethods(filters);

      if (response.data) {
        setPaymentMethods(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los métodos de pago");
      console.error("Error loading payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods(true, 1);
  }, [searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (page: number) => {
    loadPaymentMethods(true, page);
  };

  const handleNewPaymentMethod = () => {
    setEditingPaymentMethod(null);
    setFormData({ name: "", abbreviation: "", status: true });
    setShowModal(true);
  };

  const handleEditPaymentMethod = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setFormData({
      name: paymentMethod.name,
      abbreviation: paymentMethod.abbreviation,
      status: paymentMethod.status,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPaymentMethod(null);
    setFormData({ name: "", abbreviation: "", status: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.abbreviation.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    try {
      if (editingPaymentMethod) {
        await paymentMethodsService.updatePaymentMethod(editingPaymentMethod._id, formData);
        toast.success("Método de pago actualizado exitosamente");
      } else {
        await paymentMethodsService.createPaymentMethod(formData);
        toast.success("Método de pago creado exitosamente");
      }
      handleCloseModal();
      loadPaymentMethods(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el método de pago");
    }
  };

  const handleToggleStatus = async (paymentMethod: PaymentMethod) => {
    try {
      await paymentMethodsService.updatePaymentMethodStatus(paymentMethod._id, !paymentMethod.status);
      toast.success(`Método de pago ${!paymentMethod.status ? "activado" : "desactivado"} exitosamente`);
      loadPaymentMethods(false);
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar el estado del método de pago");
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (!confirm("¿Estás seguro de eliminar este método de pago?")) return;

    try {
      await paymentMethodsService.deletePaymentMethod(paymentMethodId);
      toast.success("Método de pago eliminado exitosamente");
      loadPaymentMethods(false);
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el método de pago");
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Métodos de Pago</h2>
          <p className="text-muted mb-0">Gestiona los métodos de pago del sistema</p>
        </div>
        <Button
          variant="primary"
          onClick={handleNewPaymentMethod}
          className="d-flex align-items-center gap-2 px-4"
        >
          <Plus size={20} />
          Nuevo Método de Pago
        </Button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "15px" }}>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="border-0 bg-light"
                  style={{ borderRadius: "0 10px 10px 0" }}
                />
              </InputGroup>
            </div>
            <div className="col-md-6">
              <Form.Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="border-0 bg-light"
                style={{ borderRadius: "10px" }}
              >
                <option value="">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
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
              <p className="text-muted mt-3">Cargando métodos de pago...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">No.</th>
                    <th className="px-4 py-3 fw-semibold text-muted">NOMBRE</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ABREVIATURA</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ESTATUS</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        No se encontraron métodos de pago
                      </td>
                    </tr>
                  ) : (
                    paymentMethods.map((paymentMethod, index) => (
                      <tr key={paymentMethod._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                        <td className="px-4 py-3 fw-semibold">{paymentMethod.name}</td>
                        <td className="px-4 py-3">{paymentMethod.abbreviation}</td>
                        <td className="px-4 py-3">
                          <Badge
                            bg={paymentMethod.status ? "success" : "danger"}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontWeight: "500",
                            }}
                          >
                            {paymentMethod.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex justify-content-center gap-2">
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handleEditPaymentMethod(paymentMethod)}
                              className="border-0"
                              style={{ borderRadius: "8px" }}
                              title="Editar"
                            >
                              <Edit size={16} className="text-warning" />
                            </Button>
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handleDelete(paymentMethod._id)}
                              className="border-0"
                              style={{ borderRadius: "8px" }}
                              title="Eliminar"
                            >
                              <Trash2 size={16} className="text-danger" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && paymentMethods.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} métodos de pago
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

      {/* Modal para crear/editar */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            {editingPaymentMethod ? "Editar Método de Pago" : "Nuevo Método de Pago"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Nombre <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: Efectivo, Tarjeta de Crédito, Transferencia"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-0 bg-light"
                style={{ borderRadius: "10px", padding: "12px 16px" }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Abreviatura <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Ej: EFE, TC, TRANS"
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                required
                maxLength={10}
                className="border-0 bg-light"
                style={{ borderRadius: "10px", padding: "12px 16px" }}
              />
              <Form.Text className="text-muted">
                Máximo 10 caracteres
              </Form.Text>
            </Form.Group>

            <Form.Check
              type="switch"
              id="status-switch"
              label={formData.status ? "Activo" : "Inactivo"}
              checked={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
              className="fs-5"
            />
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={handleCloseModal} style={{ borderRadius: "10px" }}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              {editingPaymentMethod ? "Actualizar" : "Crear"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentMethodsPage;
