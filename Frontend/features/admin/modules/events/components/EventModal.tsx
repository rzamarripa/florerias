"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { eventsService } from "../services/events";
import { Event, CreateEventData, PaymentMethod } from "../types";
import { clientsService } from "../../clients/services/clients";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";
import { branchesService } from "../../branches/services/branches";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface Client {
  _id: string;
  name: string;
  lastName: string;
  clientNumber: string;
  phoneNumber: string;
  status: boolean;
}

interface EventModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
  event?: Event;
}

const EventModal: React.FC<EventModalProps> = ({ show, onHide, onSuccess, event }) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [formData, setFormData] = useState<CreateEventData>({
    client: "",
    eventDate: "",
    orderDate: new Date().toISOString().split("T")[0],
    totalAmount: 0,
    totalPaid: 0,
    paymentMethod: "",
  });

  const { activeBranch } = useActiveBranchStore();
  const { role } = useUserRoleStore();
  const { user } = useUserSessionStore();
  const isAdministrator = role?.toLowerCase() === "administrador";
  const isManager = role?.toLowerCase() === "gerente";
  const isEditing = !!event;

  // Para administradores: verificar si hay sucursal seleccionada
  const canCreate = !isAdministrator || (isAdministrator && activeBranch);

  // Cargar clientes activos y métodos de pago
  useEffect(() => {
    const loadData = async () => {
      try {
        // Determinar el ID de la sucursal según el rol del usuario
        let branchId: string | undefined;

        if (isAdministrator) {
          // Administrador: usar sucursal del store active-branch
          branchId = activeBranch?._id;
        } else if (isManager && user?._id) {
          // Gerente: obtener sucursales donde es gerente
          try {
            const userBranchesResponse = await branchesService.getUserBranches();
            if (userBranchesResponse.data && userBranchesResponse.data.length > 0) {
              // Usar la primera sucursal donde es gerente
              branchId = userBranchesResponse.data[0]._id;
            }
          } catch (error) {
            console.error("Error getting manager branches:", error);
          }
        }

        // Cargar clientes filtrados por sucursal y métodos de pago
        const [clientsResponse, paymentMethodsResponse] = await Promise.all([
          clientsService.getAllClients({
            status: true,
            limit: 1000,
            branchId, // Filtrar por sucursal
          }),
          paymentMethodsService.getAllPaymentMethods({
            status: true,
            limit: 1000,
          })
        ]);

        if (clientsResponse.data) {
          setClients(clientsResponse.data);
        }
        if (paymentMethodsResponse.data) {
          setPaymentMethods(paymentMethodsResponse.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (show) {
      loadData();
    }
  }, [show, isAdministrator, isManager, activeBranch, user]);

  // Cargar datos del evento si está editando
  useEffect(() => {
    if (event) {
      setFormData({
        client: typeof event.client === "string" ? event.client : event.client._id,
        eventDate: event.eventDate.split("T")[0],
        orderDate: event.orderDate.split("T")[0],
        totalAmount: event.totalAmount,
        totalPaid: event.totalPaid,
        paymentMethod: event.paymentMethod?._id || "",
      });
    } else {
      setFormData({
        client: "",
        eventDate: "",
        orderDate: new Date().toISOString().split("T")[0],
        totalAmount: 0,
        totalPaid: 0,
        paymentMethod: "",
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar sucursal para administradores
    if (isAdministrator && !isEditing && !activeBranch) {
      toast.error("Debes seleccionar una sucursal antes de crear un evento");
      return;
    }

    if (!formData.client) {
      toast.error("Selecciona un cliente");
      return;
    }

    if (!formData.eventDate) {
      toast.error("La fecha del evento es obligatoria");
      return;
    }

    if (formData.totalAmount <= 0) {
      toast.error("El total debe ser mayor a 0");
      return;
    }

    if (formData.totalPaid && formData.totalPaid > formData.totalAmount) {
      toast.error("El total pagado no puede ser mayor al total del evento");
      return;
    }

    if (formData.totalPaid && formData.totalPaid > 0 && !formData.paymentMethod) {
      toast.error("Si registras un pago inicial, debes seleccionar el método de pago");
      return;
    }

    try {
      setLoading(true);

      // Para administradores: incluir branch en los datos
      const dataToSend = {
        ...formData,
        ...(isAdministrator && activeBranch && !isEditing ? { branch: activeBranch._id } : {})
      };

      if (isEditing && event) {
        await eventsService.updateEvent(event._id, dataToSend);
        toast.success("Evento actualizado exitosamente");
      } else {
        await eventsService.createEvent(dataToSend);
        toast.success("Evento creado exitosamente");
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el evento");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      client: "",
      eventDate: "",
      orderDate: new Date().toISOString().split("T")[0],
      totalAmount: 0,
      totalPaid: 0,
      paymentMethod: "",
    });
    onHide();
  };

  const calculateBalance = () => {
    const balance = formData.totalAmount - (formData.totalPaid || 0);
    return balance >= 0 ? balance : 0;
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">
          {isEditing ? "Editar Evento" : "Nuevo Evento"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {/* Alerta para administradores sin sucursal seleccionada */}
          {isAdministrator && !activeBranch && !isEditing && (
            <Alert variant="warning" className="mb-3">
              <Alert.Heading className="fs-6 fw-bold">Sucursal requerida</Alert.Heading>
              <p className="mb-0 small">
                Debes seleccionar una sucursal antes de crear un evento.
                Ve a tu perfil y selecciona una sucursal activa.
              </p>
            </Alert>
          )}

          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Cliente <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  required
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} {client.lastName} - {client.phoneNumber}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Fecha del Evento <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  required
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Fecha de Pedido</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">
                  Total a Pagar <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.totalAmount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })
                  }
                  required
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Total Pagado</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.totalAmount}
                  placeholder="0.00"
                  value={formData.totalPaid || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, totalPaid: parseFloat(e.target.value) || 0 })
                  }
                  className="border-0 bg-light"
                  style={{ borderRadius: "10px", padding: "12px 16px" }}
                />
              </Form.Group>
            </Col>

            {formData.totalPaid && formData.totalPaid > 0 && (
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Método de Pago</Form.Label>
                  <Form.Select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="border-0 bg-light"
                    style={{ borderRadius: "10px", padding: "12px 16px" }}
                  >
                    <option value="">Seleccionar método de pago...</option>
                    {paymentMethods.map((method) => (
                      <option key={method._id} value={method._id}>
                        {method.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            <Col md={12}>
              <div
                className="p-3 rounded"
                style={{ backgroundColor: "#f8f9fa", border: "1px solid #e9ecef" }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold text-muted">Saldo Pendiente:</span>
                  <span className="fw-bold fs-5 text-primary">
                    ${calculateBalance().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="light"
            onClick={handleClose}
            disabled={loading}
            style={{ borderRadius: "10px" }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || (!canCreate && !isEditing)}
            style={{
              borderRadius: "10px",
              minWidth: "120px",
            }}
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : isEditing ? (
              "Actualizar"
            ) : (
              "Guardar"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EventModal;
