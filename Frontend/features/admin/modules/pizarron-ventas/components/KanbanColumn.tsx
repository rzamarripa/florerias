import React from "react";
import { Card } from "react-bootstrap";
import { useDrop } from "react-dnd";
import { Order } from "../types";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  title: string;
  count: number;
  orders: Order[];
  color: string;
  status: string;
  isLastProductionStage?: boolean;
  onViewDetails?: (order: Order) => void;
  onChangeStatus?: (order: Order, newStatus: string) => void;
  onSendToShipping?: (order: Order) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  count,
  orders,
  color,
  status,
  isLastProductionStage = false,
  onViewDetails,
  onChangeStatus,
  onSendToShipping,
}) => {
  // Configurar drop zone
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "ORDER_CARD",
    drop: (item: { order: Order }) => {
      // Solo actualizar si el estado es diferente
      if (item.order.status !== status) {
        onChangeStatus?.(item.order, status);
      }
    },
    canDrop: (item: { order: Order }) => {
      // No permitir drop si el orden viene de "completado"
      return item.order.status !== "completado" && item.order.status !== status;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [status, onChangeStatus]);

  // Estilos para feedback visual del drop zone
  const getDropZoneStyle = () => {
    if (isOver && canDrop) {
      return {
        backgroundColor: `${color}15`,
        border: `2px dashed ${color}`,
      };
    }
    if (canDrop && !isOver) {
      return {
        border: `2px dashed transparent`,
      };
    }
    return {};
  };

  return (
    <div className="h-100">
      {/* Column Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <h5 className="mb-0 fw-bold" style={{ fontSize: "1rem", color: "#2c3e50" }}>
            {title}
          </h5>
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: color,
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: "600",
            }}
          >
            {count}
          </div>
        </div>
      </div>

      {/* Column Content - Drop Zone */}
      <div
        ref={drop}
        className="kanban-column-content"
        style={{
          height: "calc(100vh - 280px)",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "8px",
          borderRadius: "12px",
          padding: "12px",
          transition: "all 0.3s ease",
          ...getDropZoneStyle(),
        }}
      >
        {orders.length === 0 ? (
          <Card
            className="border-0 text-center"
            style={{
              borderRadius: "12px",
              backgroundColor: "#f8f9fa",
              padding: "2rem 1rem",
            }}
          >
            <p className="mb-0 text-muted" style={{ fontSize: "0.85rem" }}>
              No hay órdenes en esta etapa
            </p>
          </Card>
        ) : (
          orders.map((order) => (
            <KanbanCard
              key={order._id}
              order={order}
              onViewDetails={onViewDetails}
              isLastProductionStage={isLastProductionStage}
              onSendToShipping={onSendToShipping}
              stageName={title}
              stageColor={color}
            />
          ))
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .kanban-column-content::-webkit-scrollbar {
          width: 6px;
        }

        .kanban-column-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .kanban-column-content::-webkit-scrollbar-thumb {
          background: ${color};
          border-radius: 10px;
        }

        .kanban-column-content::-webkit-scrollbar-thumb:hover {
          background: ${color}dd;
        }
      `}</style>
    </div>
  );
};

export default KanbanColumn;
