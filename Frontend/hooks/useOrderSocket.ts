import { useEffect } from "react";
import { useSocket } from "./useSocket";

interface Order {
  _id: string;
  status: string;
  createdAt: string;
  branchId?: {
    _id: string;
  } | string;
  [key: string]: any;
}

interface UseOrderSocketOptions {
  onOrderCreated?: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
  onOrderDeleted?: (data: { orderId: string }) => void;
  filters?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    status?: string | string[];
  };
}

/**
 * Hook especializado para escuchar cambios en órdenes vía WebSocket
 * Filtra automáticamente según los filtros proporcionados
 */
export const useOrderSocket = (options: UseOrderSocketOptions = {}) => {
  const { onOrderCreated, onOrderUpdated, onOrderDeleted, filters } = options;
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log("🔌 [useOrderSocket] Configurando listeners de socket...");

    // Handler para orden creada
    const handleOrderCreated = (newOrder: Order) => {
      console.log("📩 [useOrderSocket] Nueva orden recibida:", newOrder);

      // Aplicar filtros antes de notificar
      if (!shouldIncludeOrder(newOrder, filters)) {
        console.log("⏭️ [useOrderSocket] Orden filtrada (no cumple criterios)");
        return;
      }

      onOrderCreated?.(newOrder);
    };

    // Handler para orden actualizada
    const handleOrderUpdated = (updatedOrder: Order) => {
      console.log("📝 [useOrderSocket] Orden actualizada:", updatedOrder);

      // Notificar siempre la actualización (el componente decidirá qué hacer)
      onOrderUpdated?.(updatedOrder);
    };

    // Handler para orden eliminada
    const handleOrderDeleted = (data: { orderId: string }) => {
      console.log("🗑️ [useOrderSocket] Orden eliminada:", data.orderId);
      onOrderDeleted?.(data);
    };

    // Registrar listeners
    socket.on("order:created", handleOrderCreated);
    socket.on("order:updated", handleOrderUpdated);
    socket.on("order:deleted", handleOrderDeleted);

    // Cleanup
    return () => {
      console.log("🔌 [useOrderSocket] Limpiando listeners de socket...");
      socket.off("order:created", handleOrderCreated);
      socket.off("order:updated", handleOrderUpdated);
      socket.off("order:deleted", handleOrderDeleted);
    };
  }, [socket, isConnected, onOrderCreated, onOrderUpdated, onOrderDeleted, filters]);

  return { isConnected };
};

/**
 * Verifica si una orden debe incluirse según los filtros
 */
const shouldIncludeOrder = (
  order: Order,
  filters?: UseOrderSocketOptions["filters"]
): boolean => {
  if (!filters) return true;

  // Filtro por fecha de inicio
  if (filters.startDate) {
    const orderDate = new Date(order.createdAt);
    const startDate = new Date(filters.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (orderDate < startDate) {
      return false;
    }
  }

  // Filtro por fecha de fin
  if (filters.endDate) {
    const orderDate = new Date(order.createdAt);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (orderDate > endDate) {
      return false;
    }
  }

  // Filtro por sucursal
  if (filters.branchId) {
    const orderBranchId = typeof order.branchId === 'string'
      ? order.branchId
      : order.branchId?._id;

    if (orderBranchId !== filters.branchId) {
      return false;
    }
  }

  // Filtro por estado (puede ser un string o array de strings)
  if (filters.status) {
    const statuses = Array.isArray(filters.status)
      ? filters.status
      : [filters.status];

    // Si el array está vacío, no aplicar filtro de estado
    if (statuses.length > 0 && !statuses.includes(order.status)) {
      return false;
    }
  }

  return true;
};
