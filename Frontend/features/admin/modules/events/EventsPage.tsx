"use client";

import React, { useEffect, useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { eventsService } from "./services/events";
import { Event, EventFilters } from "./types";
import EventModal from "./components/EventModal";
import EventActions from "./components/EventActions";
import { branchesService } from "../branches/services/branches";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      pending: { variant: "destructive" as const, text: "Pendiente" },
      partial: { variant: "secondary" as const, text: "Abonado" },
      paid: { variant: "default" as const, text: "Pagado" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "outline" as const,
      text: status,
    };

    return (
      <Badge variant={config.variant} className="px-2.5 py-0.5 rounded-xl font-medium">
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="container-fluid py-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="mb-1 font-bold text-2xl">Eventos</h2>
          <p className="text-muted-foreground mb-0">Gestiona los eventos de la sucursal</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4">
          <Plus size={20} />
          Nuevo Evento
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm rounded-[10px]">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground mt-3">Cargando eventos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">FOLIO</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">CLIENTE</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">FECHA EVENTO</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">FECHA PEDIDO</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">ESTATUS PAGO</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground text-right">TOTAL</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground text-right">TOTAL PAGADO</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground text-right">SALDO</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground">SUCURSAL</TableHead>
                  <TableHead className="px-2 py-2 font-semibold text-muted-foreground text-center">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      No se encontraron eventos
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event._id} className="border-b border-border/50">
                      <TableCell className="px-2 py-2 font-semibold">{event.folio}</TableCell>
                      <TableCell className="px-2 py-2">
                        {event.client?.name} {event.client?.lastName}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        {new Date(event.eventDate).toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        {new Date(event.orderDate).toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        {getPaymentStatusBadge(event.paymentStatus)}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right font-semibold">
                        ${event.totalAmount.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        ${event.totalPaid.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        ${event.balance.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="px-2 py-2">{event.branch?.branchName || "N/A"}</TableCell>
                      <TableCell className="px-2 py-2">
                        <EventActions event={event} onEventSaved={handleEventSaved} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!loading && events.length > 0 && (
            <div className="flex justify-between items-center px-2 py-2 border-t">
              <p className="text-muted-foreground mb-0">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                {pagination.total} eventos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="rounded-lg"
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-3 py-1">
                  Pagina {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="rounded-lg"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
