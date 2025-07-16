import { ScheduledPayment } from "../models/ScheduledPayment.js";
import { InvoicesPackage } from "../models/InvoicesPackpage.js";

// POST - Programar un pago
export const schedulePayment = async (req, res) => {
  try {
    const { packageId, companyId, bankAccountId } = req.body;
    const userId = req.user._id;

    // Validar campos requeridos
    if (!packageId || !companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: 'packageId, companyId y bankAccountId son requeridos',
      });
    }

    // Verificar que el paquete existe y está en estado "Enviado"
    const invoicePackage = await InvoicesPackage.findById(packageId);
    if (!invoicePackage) {
      return res.status(404).json({
        success: false,
        message: 'Paquete no encontrado',
      });
    }

    if (invoicePackage.estatus !== 'Enviado') {
      return res.status(400).json({
        success: false,
        message: 'El paquete debe estar en estado "Enviado" para ser programado',
      });
    }

    // Verificar que no existe ya un pago programado para este paquete
    const existingScheduledPayment = await ScheduledPayment.findOne({ packageId });
    if (existingScheduledPayment) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un pago programado para este paquete',
      });
    }

    // Crear el pago programado
    const scheduledPayment = new ScheduledPayment({
      packageId,
      companyId,
      bankAccountId,
      userId,
      scheduledDate: new Date(),
      status: 'programado',
    });

    await scheduledPayment.save();

    // Actualizar el estatus del paquete a "Programado"
    invoicePackage.estatus = 'Programado';
    await invoicePackage.save();

    res.status(201).json({
      success: true,
      message: 'Pago programado exitosamente',
      data: scheduledPayment,
    });
  } catch (error) {
    console.error('Error al programar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// GET - Obtener pagos programados por paquete
export const getScheduledPaymentByPackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    const scheduledPayment = await ScheduledPayment.findOne({ packageId })
      .populate('companyId', 'name rfc')
      .populate('bankAccountId', 'accountNumber accountType')
      .populate('userId', 'username profile.fullName');

    if (!scheduledPayment) {
      return res.status(404).json({
        success: false,
        message: 'Pago programado no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: scheduledPayment,
    });
  } catch (error) {
    console.error('Error al obtener pago programado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
}; 