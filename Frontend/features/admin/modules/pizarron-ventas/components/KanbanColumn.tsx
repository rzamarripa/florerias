import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  hasShippingStages?: boolean;
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
  hasShippingStages = false,
  onViewDetails,
  onChangeStatus,
  onSendToShipping,
}) => {
  // Configurar drop zone
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "ORDER_CARD",
    drop: (item: { order: Order }) => {
      // Validar que la orden existe
      if (!item?.order) return;

      // Solo actualizar si el estado es diferente
      if (item.order.status !== status) {
        onChangeStatus?.(item.order, status);
      }
    },
    canDrop: (item: { order: Order }) => {
      // Validar que la orden existe
      if (!item?.order) return false;

      // No permitir drop si el orden viene de "completado"
      return item.order.status !== "completado" && item.order.status !== status;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [status, onChangeStatus]);

  // Estilos para feedback visual del drop zone
  const getDropZoneClasses = () => {
    if (isOver && canDrop) {
      return "border-2 border-dashed";
    }
    if (canDrop && !isOver) {
      return "border-2 border-transparent";
    }
    return "";
  };

  return (
    <div className="h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h5 className="mb-0 font-bold text-base text-[#2c3e50]">
            {title}
          </h5>
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-semibold"
            style={{ backgroundColor: color }}
          >
            {count}
          </div>
        </div>
      </div>

      {/* Column Content - Drop Zone */}
      <div
        ref={drop}
        className={`kanban-column-content overflow-y-auto overflow-x-hidden pr-2 rounded-xl p-3 transition-all duration-300 ${getDropZoneClasses()}`}
        style={{
          height: "calc(100vh - 280px)",
          backgroundColor: isOver && canDrop ? `${color}15` : undefined,
          borderColor: isOver && canDrop ? color : undefined,
        }}
      >
        {orders.length === 0 ? (
          <Card className=" text-center rounded-xl bg-muted/50">
            <CardContent className="py-8 px-4">
              <p className="mb-0 text-muted-foreground text-sm">
                No hay ordenes en esta etapa
              </p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <KanbanCard
              key={order._id}
              order={order}
              onViewDetails={onViewDetails}
              isLastProductionStage={isLastProductionStage}
              hasShippingStages={hasShippingStages}
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
