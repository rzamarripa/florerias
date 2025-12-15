import { getIO } from "../config/socket.js";

/**
 * Emite un evento de orden creada a todos los usuarios de la sucursal
 * @param {Object} order - Orden creada
 */
export const emitOrderCreated = (order) => {
  try {
    const io = getIO();
    const branchId = order.branchId?._id || order.branchId;

    console.log(`\n📤 [OrderSocket] === EMITIENDO order:created ===`);
    console.log(`   Room: branch:${branchId}`);
    console.log(`   Order Number: ${order.orderNumber}`);
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Order Status: ${order.status}`);

    // Verificar cuántos sockets están en la room
    const room = io.sockets.adapter.rooms.get(`branch:${branchId}`);
    const clientsCount = room ? room.size : 0;
    console.log(`   Clientes conectados en room: ${clientsCount}`);

    if (clientsCount === 0) {
      console.warn(`   ⚠️ ADVERTENCIA: No hay clientes conectados en esta room!`);
    }

    io.to(`branch:${branchId}`).emit("order:created", order);
    console.log(`   ✅ Evento emitido exitosamente\n`);
  } catch (error) {
    console.error("❌ Error al emitir evento order:created:", error.message);
  }
};

/**
 * Emite un evento de orden actualizada a todos los usuarios de la sucursal
 * @param {Object} order - Orden actualizada
 */
export const emitOrderUpdated = (order) => {
  try {
    const io = getIO();
    const branchId = order.branchId?._id || order.branchId;

    io.to(`branch:${branchId}`).emit("order:updated", order);
    console.log(`📤 [OrderSocket] order:updated | Sucursal: ${branchId} | Order: ${order.orderNumber}`);
  } catch (error) {
    console.error("Error al emitir evento order:updated:", error.message);
  }
};

/**
 * Emite un evento de orden eliminada a todos los usuarios de la sucursal
 * @param {String} orderId - ID de la orden eliminada
 * @param {String} branchId - ID de la sucursal
 */
export const emitOrderDeleted = (orderId, branchId) => {
  try {
    const io = getIO();

    io.to(`branch:${branchId}`).emit("order:deleted", { orderId });
    console.log(`📤 [OrderSocket] order:deleted | Sucursal: ${branchId} | Order ID: ${orderId}`);
  } catch (error) {
    console.error("Error al emitir evento order:deleted:", error.message);
  }
};

/**
 * Emite un evento de actualización de stock a todos los usuarios de la sucursal
 * @param {String} branchId - ID de la sucursal
 * @param {String} storageId - ID del almacén
 * @param {Array} productsUpdated - Array de productos actualizados [{productId, newQuantity, quantityReduced}]
 * @param {Array} materialsUpdated - Array de materiales actualizados [{materialId, newQuantity, quantityReduced}]
 * @param {String} orderNumber - Número de orden que causó la actualización
 */
export const emitStockUpdated = (branchId, storageId, productsUpdated, materialsUpdated, orderNumber) => {
  try {
    const io = getIO();

    const payload = {
      storageId,
      branchId,
      productsUpdated: productsUpdated || [],
      materialsUpdated: materialsUpdated || [],
      orderNumber,
      timestamp: new Date().toISOString()
    };

    io.to(`branch:${branchId}`).emit("storage:stockUpdated", payload);
    console.log(`📤 [OrderSocket] storage:stockUpdated | Sucursal: ${branchId} | Storage: ${storageId} | Productos: ${productsUpdated?.length || 0} | Materiales: ${materialsUpdated?.length || 0}`);
  } catch (error) {
    console.error("Error al emitir evento storage:stockUpdated:", error.message);
  }
};
