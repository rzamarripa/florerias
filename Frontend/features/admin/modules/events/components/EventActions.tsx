"use client";

import React, { useState } from "react";
import { Edit, Trash2, DollarSign, Eye, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { eventsService } from "../services/events";
import { Event } from "../types";
import EventModal from "./EventModal";
import AddEventPaymentModal from "./AddEventPaymentModal";
import ViewEventPaymentsModal from "./ViewEventPaymentsModal";
import { Button } from "@/components/ui/button";

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
    if (!confirm("Estas seguro de eliminar este evento?")) return;

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
      <div className="flex justify-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowViewPaymentsModal(true)}
          className="rounded-full bg-blue-100 hover:bg-blue-200"
          title="Ver pagos"
        >
          <Eye size={16} className="text-blue-500" />
        </Button>

        {event.balance > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowAddPaymentModal(true)}
            className="rounded-full bg-green-100 hover:bg-green-200"
            title="Agregar pago"
          >
            <DollarSign size={16} className="text-green-600" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowEditModal(true)}
          className="rounded-full bg-yellow-100 hover:bg-yellow-200"
          title="Editar"
        >
          <Edit size={16} className="text-yellow-600" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => handleDelete()}
          disabled={isDeleting}
          className="rounded-full bg-red-100 hover:bg-red-200"
          title="Eliminar"
        >
          {isDeleting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} className="text-red-500" />
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
