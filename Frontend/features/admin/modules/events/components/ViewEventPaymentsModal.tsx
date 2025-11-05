"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Spinner, Badge, Alert } from "react-bootstrap";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { eventPaymentsService } from "../services/eventPayments";
import { EventPayment, Event } from "../types";

interface ViewEventPaymentsModalProps {
  show: boolean;
  onHide: () => void;
  onPaymentDeleted?: () => void;
  event: Event;
}

const ViewEventPaymentsModal: React.FC<ViewEventPaymentsModalProps> = ({
  show,
  onHide,
  onPaymentDeleted,
  event,
}) => {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<EventPayment[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Cargar pagos del evento
  useEffect(() => {
    const loadPayments = async () => {
      if (!show) return;

      try {
        setLoading(true);
        const response = await eventPaymentsService.getEventPayments(event._id);
        if (response.data) {
          setPayments(response.data);
        }
      } catch (error: any) {
        toast.error(error.message || "Error al cargar los pagos");
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [show, event._id]);

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("¿Estás seguro de eliminar este pago? Esta acción actualizará los saldos del evento.")) {
      return;
    }

    try {
      setDeletingId(paymentId);
      await eventPaymentsService.deleteEventPayment(paymentId);
      toast.success("Pago eliminado exitosamente");

      // Recargar pagos
      const response = await eventPaymentsService.getEventPayments(event._id);
      if (response.data) {
        setPayments(response.data);
      }

      onPaymentDeleted?.();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el pago");
    } finally {
      setDeletingId(null);
    }
  };

  const calculateTotals = () => {
    const totalPagos = payments.reduce((sum, payment) => sum + payment.amount, 0);
    return {
      totalPagos,
      cantidadPagos: payments.length,
    };
  };

  const totals = calculateTotals();

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
      <Modal.Header closeButton className="border-0">
        <Modal.Title className="fw-bold">Pagos del Evento</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Alert variant="info" className="mb-3">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-2">
                <strong>Folio:</strong> #{event.folio}
              </div>
              <div className="mb-2">
                <strong>Cliente:</strong> {event.client.name} {event.client.lastName}
              </div>
              <div className="mb-2">
                <strong>Fecha del Evento:</strong>{" "}
                {new Date(event.eventDate).toLocaleDateString("es-MX")}
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-2">
                <strong>Total del Evento:</strong>{" "}
                <span className="fw-bold">
                  ${event.totalAmount.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="mb-2">
                <strong>Total Pagado:</strong>{" "}
                <span className="fw-bold text-success">
                  ${event.totalPaid.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div>
                <strong>Saldo Pendiente:</strong>{" "}
                <span className="fw-bold text-danger">
                  ${event.balance.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </Alert>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="text-muted mt-3">Cargando pagos...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No hay pagos registrados para este evento</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-3 py-2 fw-semibold text-muted">FECHA</th>
                    <th className="px-3 py-2 fw-semibold text-muted">MÉTODO</th>
                    <th className="px-3 py-2 fw-semibold text-muted text-end">MONTO</th>
                    <th className="px-3 py-2 fw-semibold text-muted">REGISTRADO POR</th>
                    <th className="px-3 py-2 fw-semibold text-muted">NOTAS</th>
                    <th className="px-3 py-2 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                      <td className="px-3 py-2">
                        {new Date(payment.paymentDate).toLocaleDateString("es-MX")}
                        <br />
                        <small className="text-muted">
                          {new Date(payment.paymentDate).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </td>
                      <td className="px-3 py-2">
                        <Badge bg="primary" className="px-2 py-1">
                          {payment.paymentMethod.name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-end fw-bold text-success">
                        ${payment.amount.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-3 py-2">
                        {payment.user.username}
                        <br />
                        <small className="text-muted">{payment.branch.branchName}</small>
                      </td>
                      <td className="px-3 py-2">
                        {payment.notes || "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() => handleDeletePayment(payment._id)}
                          disabled={deletingId === payment._id}
                          className="border-0"
                          style={{
                            borderRadius: "50%",
                            width: "32px",
                            height: "32px",
                            padding: "0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#fee",
                          }}
                          title="Eliminar pago"
                        >
                          {deletingId === payment._id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <Trash2 size={16} className="text-danger" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#f8f9fa" }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Total de pagos registrados:</strong> {totals.cantidadPagos}
                </div>
                <div>
                  <strong>Suma de pagos:</strong>{" "}
                  <span className="fs-5 fw-bold text-success">
                    ${totals.totalPagos.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button
          variant="light"
          onClick={onHide}
          style={{ borderRadius: "10px" }}
        >
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewEventPaymentsModal;
