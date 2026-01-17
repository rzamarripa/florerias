import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Package, Send } from "lucide-react";
import { useDrag } from "react-dnd";
import { Order } from "../types";

interface KanbanCardProps {
  order: Order;
  isLastProductionStage?: boolean;
  hasShippingStages?: boolean;
  stageName?: string;
  stageColor?: string;
  onViewDetails?: (order: Order) => void;
  onSendToShipping?: (order: Order) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  order,
  isLastProductionStage = false,
  hasShippingStages = false,
  stageName,
  stageColor,
  onViewDetails,
  onSendToShipping
}) => {
  // Configurar drag - no permitir drag si el estado es "completado"
  const canDrag = order.status !== "completado";

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ORDER_CARD",
    item: { order },
    canDrag: () => canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [order, canDrag]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-500';
      case 'en-proceso':
        return 'bg-blue-500';
      case 'completado':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'en-proceso':
        return 'En Proceso';
      case 'completado':
        return 'Completado';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div ref={canDrag ? drag : null}>
      <Card
        className="mb-3 border-0 shadow-sm relative rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        style={{
          cursor: canDrag ? "move" : "pointer",
          opacity: isDragging ? 0.5 : 1,
          transform: isDragging ? "scale(1.05)" : undefined,
        }}
        onClick={() => onViewDetails?.(order)}
      >
        <CardContent className="p-3">
          {/* Header with Stage Badge */}
          <div className="flex justify-between items-start mb-2">
            <Badge
              className="px-2 py-1 text-[0.7rem] font-semibold border-0"
              style={{
                backgroundColor: stageColor || undefined,
              }}
            >
              {stageName || getStatusText(order.status)}
            </Badge>
          </div>

          {/* Order Number */}
          <h6 className="mb-2 font-bold text-[0.95rem] text-[#2c3e50]">
            {order.orderNumber}
          </h6>

          {/* Client Info */}
          <div className="flex items-center mb-2 text-sm">
            <User size={14} className="text-muted-foreground mr-2" />
            <span className="truncate text-[#5a6c7d]">
              {order.clientInfo.name}
            </span>
          </div>

          {/* Items Count */}
          <div className="flex items-center mb-2 text-sm">
            <Package size={14} className="text-muted-foreground mr-2" />
            <span className="text-[#5a6c7d]">
              {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          {/* Delivery Date */}
          {order.deliveryData?.deliveryDateTime && (
            <div className="flex items-center mb-3 text-sm">
              <Calendar size={14} className="text-muted-foreground mr-2" />
              <span className="text-[#5a6c7d]">
                {formatDate(order.deliveryData.deliveryDateTime)}
              </span>
            </div>
          )}

          {/* Divider */}
          <hr className="my-2 border-muted" />

          {/* Financial Info */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[0.7rem] text-[#8898aa]">Subtotal</div>
              <div className="font-semibold text-sm text-[#5a6c7d]">
                {formatCurrency(order.subtotal)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[0.7rem] text-[#8898aa]">Total</div>
              <div className="font-bold text-base text-[#2c3e50]">
                {formatCurrency(order.total)}
              </div>
            </div>
          </div>

          {/* Remaining Balance Alert */}
          {order.remainingBalance > 0 && (
            <div className="mt-2">
              <Badge variant="destructive" className="w-full py-1 text-xs justify-center">
                Saldo pendiente: {formatCurrency(order.remainingBalance)}
              </Badge>
            </div>
          )}

          {/* Send to Shipping Button - Only show in last production stage */}
          {isLastProductionStage && onSendToShipping && (
            <div className="mt-3">
              <Button
                variant={hasShippingStages ? "default" : "secondary"}
                size="sm"
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold rounded-lg"
                disabled={!hasShippingStages}
                onClick={(e) => {
                  e.stopPropagation(); // Evitar que se abra el modal de detalles
                  if (hasShippingStages) {
                    onSendToShipping(order);
                  }
                }}
                style={{
                  opacity: hasShippingStages ? 1 : 0.6,
                  cursor: hasShippingStages ? "pointer" : "not-allowed",
                }}
                title={!hasShippingStages ? "No hay etapas de envio configuradas" : "Enviar a Envio"}
              >
                <Send size={16} />
                Enviar a Envio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KanbanCard;
