import { useEffect } from "react";
import { useSocket } from "./useSocket";

interface ProductUpdate {
  productId: string;
  newQuantity: number;
  quantityReduced: number;
}

interface MaterialUpdate {
  materialId: string;
  newQuantity: number;
  quantityReduced: number;
}

interface StockUpdatePayload {
  storageId: string;
  branchId: string;
  productsUpdated: ProductUpdate[];
  materialsUpdated: MaterialUpdate[];
  orderNumber: string;
  timestamp: string;
}

interface UseStorageSocketOptions {
  storageId?: string | null;
  onStockUpdated?: (data: StockUpdatePayload) => void;
}

/**
 * Hook para escuchar actualizaciones de stock en tiempo real vía WebSocket
 * Solo procesa eventos que corresponden al storageId especificado
 */
export const useStorageSocket = (options: UseStorageSocketOptions = {}) => {
  const { storageId, onStockUpdated } = options;
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log("📦 [useStorageSocket] Configurando listener de stock...");

    // Handler para actualización de stock
    const handleStockUpdated = (data: StockUpdatePayload) => {
      console.log("📦 [useStorageSocket] Stock actualizado recibido:", data);

      // Solo procesar si el storageId coincide
      if (storageId && data.storageId !== storageId) {
        console.log("⏭️ [useStorageSocket] Ignorando - storage diferente");
        return;
      }

      onStockUpdated?.(data);
    };

    // Registrar listener
    socket.on("storage:stockUpdated", handleStockUpdated);

    // Cleanup
    return () => {
      console.log("📦 [useStorageSocket] Limpiando listener de stock...");
      socket.off("storage:stockUpdated", handleStockUpdated);
    };
  }, [socket, isConnected, storageId, onStockUpdated]);

  return { isConnected };
};

export type { StockUpdatePayload, ProductUpdate, MaterialUpdate };
