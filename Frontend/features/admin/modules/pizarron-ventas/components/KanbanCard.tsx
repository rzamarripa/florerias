import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
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
        return 'warning';
      case 'en-proceso':
        return 'info';
      case 'completado':
        return 'success';
      default:
        return 'secondary';
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
        className="mb-3 border-0 shadow-sm position-relative"
        style={{
          borderRadius: "12px",
          transition: "all 0.3s ease",
          cursor: canDrag ? "move" : "pointer",
          opacity: isDragging ? 0.5 : 1,
          transform: isDragging ? "scale(1.05)" : "scale(1)",
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
          }
        }}
        onClick={() => onViewDetails?.(order)}
      >
        <Card.Body className="p-3">
          {/* Header with Stage Badge */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Badge
              className="px-2 py-1"
              style={{
                fontSize: "0.7rem",
                fontWeight: "600",
                backgroundColor: stageColor || getStatusColor(order.status),
                border: "none",
              }}
            >
              {stageName || getStatusText(order.status)}
            </Badge>
          </div>

        {/* Order Number */}
        <h6 className="mb-2 fw-bold" style={{ fontSize: "0.95rem", color: "#2c3e50" }}>
          {order.orderNumber}
        </h6>

        {/* Client Info */}
        <div className="d-flex align-items-center mb-2" style={{ fontSize: "0.85rem" }}>
          <User size={14} className="text-muted me-2" />
          <span className="text-truncate" style={{ color: "#5a6c7d" }}>
            {order.clientInfo.name}
          </span>
        </div>

        {/* Items Count */}
        <div className="d-flex align-items-center mb-2" style={{ fontSize: "0.85rem" }}>
          <Package size={14} className="text-muted me-2" />
          <span style={{ color: "#5a6c7d" }}>
            {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {/* Delivery Date */}
        {order.deliveryData?.deliveryDateTime && (
          <div className="d-flex align-items-center mb-3" style={{ fontSize: "0.85rem" }}>
            <Calendar size={14} className="text-muted me-2" />
            <span style={{ color: "#5a6c7d" }}>
              {formatDate(order.deliveryData.deliveryDateTime)}
            </span>
          </div>
        )}

        {/* Divider */}
        <hr className="my-2" style={{ borderColor: "#e9ecef" }} />

        {/* Financial Info */}
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div style={{ fontSize: "0.7rem", color: "#8898aa" }}>Subtotal</div>
            <div className="fw-semibold" style={{ fontSize: "0.85rem", color: "#5a6c7d" }}>
              {formatCurrency(order.subtotal)}
            </div>
          </div>
          <div className="text-end">
            <div style={{ fontSize: "0.7rem", color: "#8898aa" }}>Total</div>
            <div className="fw-bold" style={{ fontSize: "1rem", color: "#2c3e50" }}>
              {formatCurrency(order.total)}
            </div>
          </div>
        </div>

        {/* Remaining Balance Alert */}
        {order.remainingBalance > 0 && (
          <div className="mt-2">
            <Badge bg="danger" className="w-100 py-1" style={{ fontSize: "0.75rem" }}>
              Saldo pendiente: {formatCurrency(order.remainingBalance)}
            </Badge>
          </div>
        )}

        {/* Send to Shipping Button - Only show in last production stage */}
        {isLastProductionStage && onSendToShipping && (
          <div className="mt-3">
            <Button
              variant={hasShippingStages ? "success" : "secondary"}
              size="sm"
              className="w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={!hasShippingStages}
              onClick={(e) => {
                e.stopPropagation(); // Evitar que se abra el modal de detalles
                if (hasShippingStages) {
                  onSendToShipping(order);
                }
              }}
              style={{
                fontSize: "0.8rem",
                fontWeight: "600",
                borderRadius: "8px",
                opacity: hasShippingStages ? 1 : 0.6,
                cursor: hasShippingStages ? "pointer" : "not-allowed",
              }}
              title={!hasShippingStages ? "No hay etapas de envío configuradas" : "Enviar a Envío"}
            >
              <Send size={16} />
              Enviar a Envío
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
    </div>
  );
};

export default KanbanCard;
