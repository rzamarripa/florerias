import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { env } from "@/config/env";
import { useUserSessionStore } from "@/stores/userSessionStore";

interface UseSocketOptions {
  autoConnect?: boolean;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Hook personalizado para manejar conexiones de Socket.IO
 * - Se conecta automáticamente con el token JWT del usuario
 * - Maneja reconexiones automáticas
 * - Limpia la conexión al desmontar el componente
 */
export const useSocket = (options: UseSocketOptions = {}): UseSocketReturn => {
  const { autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = useUserSessionStore((state) => state.token);

  const connect = () => {
    // Si ya existe una conexión, no crear una nueva
    if (socketRef.current?.connected) {
      return;
    }

    if (!token) {
      console.warn("⚠️ [useSocket] No se puede conectar: token no disponible");
      return;
    }

    // Crear la conexión de socket con autenticación
    // Socket.IO se conecta a la raíz del servidor, no a /api
    const socketUrl = (env.NEXT_PUBLIC_API_URL || "http://localhost:3005").replace(/\/api$/, '');

    console.log("🔌 [useSocket] Conectando a:", socketUrl);

    const socket = io(socketUrl, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Eventos de conexión
    socket.on("connect", () => {
      console.log("✅ [useSocket] Socket conectado:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ [useSocket] Socket desconectado:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ [useSocket] Error de conexión:", error.message);
      setIsConnected(false);
    });

    socketRef.current = socket;
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  useEffect(() => {
    if (!autoConnect) return;
    if (!token) {
      console.log("⏳ [useSocket] Esperando token...");
      return;
    }

    console.log("✓ [useSocket] Token encontrado, conectando...");
    const timer = setTimeout(() => {
      connect();
    }, 100);

    // Cleanup al desmontar el componente
    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, [autoConnect, token]);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
  };
};
