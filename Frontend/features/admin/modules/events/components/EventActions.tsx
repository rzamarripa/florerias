"use client";

import React, { useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { Edit, Trash2, DollarSign, Eye } from "lucide-react";
import { toast } from "react-toastify";
import { eventsService } from "../services/events";
import { Event } from "../types";
import EventModal from "./EventModal";
import AddEventPaymentModal from "./AddEventPaymentModal";
import ViewEventPaymentsModal from "./ViewEventPaymentsModal";

interface EventActionsProps {
  event: Event;
  onEventSaved?: () => void;
}

const EventActions: React.FC<EventActionsProps> = ({ event, onEventSaved }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showViewPaymentsModal, setShowViewPaymentsModal] = useState(false);

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este evento?")) return;

    try {
      setIsDeleting(true);
      await eventsService.deleteEvent(event._id);
      toast.success("Evento eliminado exitosamente");
      onEventSaved?.();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el evento");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-center gap-1">
        <Button
          variant="light"
          size="sm"
          onClick={() => setShowViewPaymentsModal(true)}
          className="border-0"
          style={{
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            padding: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#e7f3ff",
          }}
          title="Ver pagos"
        >
          <Eye size={16} className="text-info" />
        </Button>

        {event.balance > 0 && (
          <Button
            variant="light"
            size="sm"
            onClick={() => setShowAddPaymentModal(true)}
            className="border-0"
            style={{
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              padding: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#d4edda",
            }}
            title="Agregar pago"
          >
            <DollarSign size={16} className="text-success" />
          </Button>
        )}

        <Button
          variant="light"
          size="sm"
          onClick={() => setShowEditModal(true)}
          className="border-0"
          style={{
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            padding: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff3cd",
          }}
          title="Editar"
        >
          <Edit size={16} className="text-warning" />
        </Button>

        <Button
          variant="light"
          size="sm"
          onClick={() => handleDelete()}
          disabled={isDeleting}
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
          title="Eliminar"
        >
          {isDeleting ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <Trash2 size={16} className="text-danger" />
          )}
        </Button>
      </div>

      <EventModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        onSuccess={onEventSaved}
        event={event}
      />

      <AddEventPaymentModal
        show={showAddPaymentModal}
        onHide={() => setShowAddPaymentModal(false)}
        onSuccess={onEventSaved}
        event={event}
      />

      <ViewEventPaymentsModal
        show={showViewPaymentsModal}
        onHide={() => setShowViewPaymentsModal(false)}
        onPaymentDeleted={onEventSaved}
        event={event}
      />
    </>
  );
};

export default EventActions;
