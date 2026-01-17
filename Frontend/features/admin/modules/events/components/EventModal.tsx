"use client";

import React, { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { eventsService } from "../services/events";
import { Event, CreateEventData, PaymentMethod } from "../types";
import { clientsService } from "../../clients/services/clients";
import { paymentMethodsService } from "../../payment-methods/services/paymentMethods";
import { branchesService } from "../../branches/services/branches";
import { useActiveBranchStore } from "@/stores/activeBranchStore";
import { useUserRoleStore } from "@/stores/userRoleStore";
import { useUserSessionStore } from "@/stores/userSessionStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // Cargar clientes activos y metodos de pago
  useEffect(() => {
    const loadData = async () => {
      try {
        // Determinar el ID de la sucursal segun el rol del usuario
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

        // Cargar clientes filtrados por sucursal y metodos de pago
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

  // Cargar datos del evento si esta editando
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
      toast.error("Si registras un pago inicial, debes seleccionar el metodo de pago");
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
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-bold">
            {isEditing ? "Editar Evento" : "Nuevo Evento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* Alerta para administradores sin sucursal seleccionada */}
            {isAdministrator && !activeBranch && !isEditing && (
              <Alert className="mb-3 border-yellow-500 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-sm font-bold text-yellow-800">Sucursal requerida</AlertTitle>
                <AlertDescription className="text-sm text-yellow-700">
                  Debes seleccionar una sucursal antes de crear un evento.
                  Ve a tu perfil y selecciona una sucursal activa.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">
                  Cliente <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.client}
                  onValueChange={(value) => setFormData({ ...formData, client: value })}
                >
                  <SelectTrigger className="w-full bg-muted/50 rounded-[10px] h-11">
                    <SelectValue placeholder="Seleccionar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name} {client.lastName} - {client.phoneNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">
                    Fecha del Evento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                    className="bg-muted/50 rounded-[10px] h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Fecha de Pedido</Label>
                  <Input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="bg-muted/50 rounded-[10px] h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">
                    Total a Pagar <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.totalAmount || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="bg-muted/50 rounded-[10px] h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Total Pagado</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.totalAmount}
                    placeholder="0.00"
                    value={formData.totalPaid || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, totalPaid: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-muted/50 rounded-[10px] h-11"
                  />
                </div>
              </div>

              {formData.totalPaid && formData.totalPaid > 0 && (
                <div className="space-y-2">
                  <Label className="font-semibold">Metodo de Pago</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger className="w-full bg-muted/50 rounded-[10px] h-11">
                      <SelectValue placeholder="Seleccionar metodo de pago..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method._id} value={method._id}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Saldo Pendiente:</span>
                  <span className="font-bold text-lg text-primary">
                    ${calculateBalance().toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="rounded-[10px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (!canCreate && !isEditing)}
              className="rounded-[10px] min-w-[120px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
