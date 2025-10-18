import React from "react";
import { Card } from "react-bootstrap";
import { Plus } from "lucide-react";
import { Order } from "../types";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  title: string;
  count: number;
  orders: Order[];
  color: string;
  onViewDetails?: (order: Order) => void;
  onChangeStatus?: (order: Order, newStatus: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  count,
  orders,
  color,
  onViewDetails,
  onChangeStatus,
}) => {
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

        {/* Optional Add Button - Hidden for now since orders come from backend */}
        {/* <button
          className="btn btn-sm border-0 p-1"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "#f8f9fa",
            color: color,
          }}
        >
          <Plus size={18} />
        </button> */}
      </div>

      {/* Column Content */}
      <div
        className="kanban-column-content"
        style={{
          height: "calc(100vh - 280px)",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "8px",
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
              onChangeStatus={onChangeStatus}
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
