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
      // No mostrar warning si no hay token, es esperado
      return;
    }

    // Crear la conexión de socket con autenticación
    // Socket.IO se conecta a la raíz del servidor, no a /api
    const socketUrl = (env.NEXT_PUBLIC_API_URL || "http://localhost:3005").replace(/\/api$/, '');

    const socket = io(socketUrl, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'], // Especificar transports explícitamente
      timeout: 10000, // Timeout de conexión
    });

    // Eventos de conexión
    socket.on("connect", () => {
      console.log("✅ [useSocket] Socket conectado:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      // Solo mostrar si es una desconexión no esperada
      if (reason !== 'io client disconnect' && reason !== 'transport close') {
        console.log("⚠️ [useSocket] Socket desconectado:", reason);
      }
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      // Solo mostrar error en la primera conexión fallida, no en reintentos
      if (!socketRef.current) {
        console.warn("⚠️ [useSocket] No se pudo conectar al servidor WebSocket. El sistema continuará funcionando sin actualizaciones en tiempo real.");
      }
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
      // No hay token aún, esperar silenciosamente
      return;
    }

    // Conectar cuando haya token disponible
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
