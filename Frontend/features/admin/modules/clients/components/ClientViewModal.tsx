"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Phone, CreditCard, Award, ShoppingBag } from "lucide-react";
import { Client } from "../types";

interface ClientViewModalProps {
  client: Client;
  show: boolean;
  onHide: () => void;
}

const ClientViewModal: React.FC<ClientViewModalProps> = ({
  client,
  show,
  onHide,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="border-0 pb-0">
          <DialogTitle className="font-bold text-primary">
            Información del Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4">
          <div className="text-center mb-4">
            <div
              className="bg-primary text-white flex items-center justify-center font-bold mx-auto mb-3 rounded-full"
              style={{
                width: "80px",
                height: "80px",
                fontSize: "32px",
              }}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>
            <h4 className="mb-1 text-lg font-semibold">{client.fullName}</h4>
            <Badge
              variant={client.status ? "default" : "destructive"}
              className="text-base px-3 py-2"
            >
              {client.status ? "Cliente Activo" : "Cliente Inactivo"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Info */}
            <div className="border rounded-lg p-3 h-full">
              <div className="flex items-center mb-3">
                <User className="text-primary mr-2" size={20} />
                <h6 className="mb-0 font-semibold">Información Personal</h6>
              </div>
              <div className="mb-2">
                <small className="text-muted-foreground">Nombre</small>
                <div className="font-medium">{client.name}</div>
              </div>
              <div className="mb-2">
                <small className="text-muted-foreground">Apellidos</small>
                <div className="font-medium">{client.lastName}</div>
              </div>
              <div className="mb-2">
                <small className="text-muted-foreground">Nombre Completo</small>
                <div className="font-medium">{client.fullName}</div>
              </div>
            </div>

            {/* Client Info */}
            <div className="border rounded-lg p-3 h-full">
              <div className="flex items-center mb-3">
                <CreditCard className="text-primary mr-2" size={20} />
                <h6 className="mb-0 font-semibold">Información de Cliente</h6>
              </div>
              <div className="mb-2">
                <small className="text-muted-foreground">Número de Cliente</small>
                <div className="font-medium">
                  <Badge variant="secondary" className="text-base">
                    {client.clientNumber}
                  </Badge>
                </div>
              </div>
              <div className="mb-2">
                <small className="text-muted-foreground">Teléfono</small>
                <div className="font-medium flex items-center">
                  <Phone size={16} className="mr-1" />
                  {client.phoneNumber}
                </div>
              </div>
            </div>

            {/* Points Program */}
            <div className="border rounded-lg p-3 h-full bg-muted/50">
              <div className="flex items-center mb-3">
                <Award className="text-yellow-500 mr-2" size={20} />
                <h6 className="mb-0 font-semibold">Programa de Puntos</h6>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-500 mb-1">
                  {client.points}
                </div>
                <small className="text-muted-foreground">Puntos Acumulados</small>
              </div>
            </div>

            {/* Purchases */}
            <div className="border rounded-lg p-3 h-full bg-muted/50">
              <div className="flex items-center mb-3">
                <ShoppingBag className="text-cyan-500 mr-2" size={20} />
                <h6 className="mb-0 font-semibold">Compras</h6>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-500 mb-1">
                  {client.purchases.length}
                </div>
                <small className="text-muted-foreground">Compras Realizadas</small>
              </div>
            </div>

            {/* Important Dates - Full Width */}
            <div className="col-span-1 md:col-span-2 border rounded-lg p-3">
              <div className="flex items-center mb-3">
                <Calendar className="text-primary mr-2" size={20} />
                <h6 className="mb-0 font-semibold">Fechas Importantes</h6>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-2">
                  <small className="text-muted-foreground">Fecha de Registro</small>
                  <div className="font-medium">{formatDate(client.createdAt)}</div>
                </div>
                <div className="mb-2">
                  <small className="text-muted-foreground">Última Actualización</small>
                  <div className="font-medium">{formatDate(client.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-0 pt-0">
          <Button variant="secondary" onClick={onHide}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientViewModal;
