import OrderNotification from '../models/OrderNotification.js';
import { Branch } from '../models/Branch.js';
import { User } from '../models/User.js';

// Obtener todas las notificaciones de órdenes para el usuario autenticado (Manager y Cajero)
export const getOrderNotifications = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Obtener el usuario con su rol
    const currentUser = await User.findById(userId).populate('role');
    if (!currentUser || !currentUser.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario no tiene rol asignado'
      });
    }

    const userRole = currentUser.role.name;

    // Solo Gerente y Cajero pueden ver notificaciones
    if (userRole !== 'Gerente' && userRole !== 'Cajero') {
      return res.status(403).json({
        success: false,
        message: 'Solo los gerentes y cajeros pueden ver las notificaciones de órdenes'
      });
    }

    // Buscar sucursales donde el usuario es manager, administrador o cajero
    const userBranches = await Branch.find({
      $or: [
        { manager: userId },
        { administrator: userId },
        { employees: userId }
      ],
      isActive: true
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);

    if (branchIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        unreadCount: 0
      });
    }

    // Obtener filtro opcional para tipo de notificación
    const { type } = req.query;

    const notificationFilters = {
      branchId: { $in: branchIds },
      isDeleted: false,
      userId: { $ne: userId } // Excluir notificaciones creadas por el mismo usuario
    };

    // Filtrar por tipo de notificación si se proporciona
    if (type === 'created') {
      notificationFilters.isCanceled = false;
    } else if (type === 'canceled') {
      notificationFilters.isCanceled = true;
    }

    // Obtener notificaciones de las sucursales (excluir eliminadas y propias)
    const notifications = await OrderNotification.find(notificationFilters)
      .populate('branchId', 'branchName branchCode')
      .populate('orderId', 'orderNumber status total')
      .populate('userId', 'name username')
      .sort({ createdAt: -1 })
      .limit(50); // Limitar a las últimas 50 notificaciones

    // Contar notificaciones no leídas (excluir eliminadas y propias)
    const unreadCount = await OrderNotification.countDocuments({
      branchId: { $in: branchIds },
      isRead: false,
      isDeleted: false,
      userId: { $ne: userId }
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const notification = await OrderNotification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Verificar que el usuario tiene acceso a la sucursal (manager, administrador o cajero)
    const branch = await Branch.findOne({
      _id: notification.branchId,
      $or: [
        { manager: userId },
        { administrator: userId },
        { employees: userId }
      ]
    });

    if (!branch) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para marcar esta notificación'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Buscar sucursales donde el usuario es manager, administrador o cajero
    const userBranches = await Branch.find({
      $or: [
        { manager: userId },
        { administrator: userId },
        { employees: userId }
      ],
      isActive: true
    }).select('_id');

    const branchIds = userBranches.map(branch => branch._id);

    if (branchIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay notificaciones para marcar'
      });
    }

    // Actualizar todas las notificaciones no leídas (excepto las propias)
    const result = await OrderNotification.updateMany(
      {
        branchId: { $in: branchIds },
        isRead: false,
        userId: { $ne: userId }
      },
      {
        isRead: true
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notificaciones marcadas como leídas`
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar notificación
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const notification = await OrderNotification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Verificar que el usuario tiene acceso a la sucursal (manager, administrador o cajero)
    const branch = await Branch.findOne({
      _id: notification.branchId,
      $or: [
        { manager: userId },
        { administrator: userId },
        { employees: userId }
      ]
    });

    if (!branch) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta notificación'
      });
    }

    // Soft delete: marcar como eliminada en lugar de borrar
    notification.isDeleted = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};
