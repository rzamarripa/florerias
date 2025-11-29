"use client";

import React, { useEffect, useState } from "react";
import { Button, Table, Badge, Spinner } from "react-bootstrap";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { eventsService } from "./services/events";
import { Event, EventFilters } from "./types";
import EventModal from "./components/EventModal";
import EventActions from "./components/EventActions";
import { branchesService } from "../branches/services/branches";
import { useUserSessionStore } from "@/stores/userSessionStore";

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [userBranches, setUserBranches] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0,
  });
  const userId = useUserSessionStore((state) => state.getUserId());

  // Cargar sucursales del usuario
  useEffect(() => {
    const loadUserBranches = async () => {
      try {
        if (!userId) return;
        const response = await branchesService.getUserBranches();
        if (response.data) {
          setUserBranches(response.data);
        }
      } catch (error: any) {
        console.error("Error loading user branches:", error);
      }
    };

    loadUserBranches();
  }, [userId]);

  const loadEvents = async (isInitial: boolean, page: number = pagination.page) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const filters: EventFilters = {
        page,
        limit: pagination.limit,
      };

      const response = await eventsService.getAllEvents(filters);

      if (response.data) {
        setEvents(response.data);
      }

      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los eventos");
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userBranches.length > 0) {
      loadEvents(true, 1);
    }
  }, [userBranches]);

  const handlePageChange = (page: number) => {
    loadEvents(true, page);
  };

  const handleEventSaved = () => {
    loadEvents(false);
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: "danger", text: "Pendiente" },
      partial: { bg: "warning", text: "Abonado" },
      paid: { bg: "success", text: "Pagado" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: "secondary",
      text: status,
    };

    return (
      <Badge
        bg={config.bg}
        style={{
          padding: "6px 12px",
          borderRadius: "20px",
          fontWeight: "500",
        }}
      >
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold">Eventos</h2>
          <p className="text-muted mb-0">Gestiona los eventos de la sucursal</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          className="d-flex align-items-center gap-2 px-4"
        >
          <Plus size={20} />
          Nuevo Evento
        </Button>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "15px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-3">Cargando eventos...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead style={{ background: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-muted">FOLIO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">CLIENTE</th>
                    <th className="px-4 py-3 fw-semibold text-muted">FECHA EVENTO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">FECHA PEDIDO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">ESTATUS PAGO</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-end">TOTAL</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-end">TOTAL PAGADO</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-end">SALDO</th>
                    <th className="px-4 py-3 fw-semibold text-muted">SUCURSAL</th>
                    <th className="px-4 py-3 fw-semibold text-muted text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-5 text-muted">
                        No se encontraron eventos
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => (
                      <tr key={event._id} style={{ borderBottom: "1px solid #f1f3f5" }}>
                        <td className="px-4 py-3 fw-semibold">{event.folio}</td>
                        <td className="px-4 py-3">
                          {event.client?.name} {event.client?.lastName}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(event.eventDate).toLocaleDateString("es-MX")}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(event.orderDate).toLocaleDateString("es-MX")}
                        </td>
                        <td className="px-4 py-3">
                          {getPaymentStatusBadge(event.paymentStatus)}
                        </td>
                        <td className="px-4 py-3 text-end fw-semibold">
                          ${event.totalAmount.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-end">
                          ${event.totalPaid.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-end">
                          ${event.balance.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3">{event.branch?.branchName || "N/A"}</td>
                        <td className="px-4 py-3">
                          <EventActions event={event} onEventSaved={handleEventSaved} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && events.length > 0 && (
            <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top">
              <p className="text-muted mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                {pagination.total} eventos
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

      {/* Modal para crear/editar evento */}
      <EventModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={handleEventSaved}
      />
    </div>
  );
};

export default EventsPage;
