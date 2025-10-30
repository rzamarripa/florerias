import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

/**
 * Inicializa Socket.IO con el servidor HTTP
 * @param {Object} server - Servidor HTTP de Express
 * @returns {Object} Instancia de Socket.IO
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware de autenticación JWT para sockets
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        console.error("❌ [Socket Auth] No token provided");
        return next(new Error("Authentication error: Token not provided"));
      }

      // Verificar el token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("\n🔐 [Socket Auth] === TOKEN DECODIFICADO ===");
      console.log("   userId:", decoded.userId || decoded.id);
      console.log("   branchIds:", decoded.branchIds);
      console.log("   role:", decoded.role);
      console.log("   Token keys:", Object.keys(decoded));

      // Adjuntar información del usuario al socket
      socket.userId = decoded.userId || decoded.id; // Compatibilidad con ambos formatos
      socket.branchIds = decoded.branchIds || [];   // Array de sucursales
      socket.role = decoded.role;

      if (!socket.branchIds || socket.branchIds.length === 0) {
        console.warn("   ⚠️ ADVERTENCIA: Token no contiene branchIds o está vacío!");
        console.warn("   ⚠️ El usuario NO será unido a ninguna room de sucursal");
      }

      next();
    } catch (error) {
      console.error("❌ [Socket Auth] Error:", error.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Manejo de conexiones
  io.on("connection", (socket) => {
    console.log(`✅ Socket conectado: ${socket.id} | Usuario: ${socket.userId} | Sucursales: ${socket.branchIds.length}`);

    // Unir al usuario a todas las rooms de sus sucursales
    if (socket.branchIds && socket.branchIds.length > 0) {
      socket.branchIds.forEach(branchId => {
        socket.join(`branch:${branchId}`);
      });
      console.log(`📍 Usuario ${socket.userId} unido a ${socket.branchIds.length} room(s): ${socket.branchIds.map(id => `branch:${id}`).join(', ')}`);
    } else {
      console.log(`⚠️ Usuario ${socket.userId} no tiene sucursales asignadas`);
    }

    // Manejar desconexión
    socket.on("disconnect", () => {
      console.log(`❌ Socket desconectado: ${socket.id} | Usuario: ${socket.userId}`);
    });
  });

  console.log("🔌 Socket.IO inicializado correctamente");
  return io;
};

/**
 * Obtiene la instancia de Socket.IO
 * @returns {Object} Instancia de Socket.IO
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO no ha sido inicializado. Llama a initializeSocket primero.");
  }
  return io;
};

