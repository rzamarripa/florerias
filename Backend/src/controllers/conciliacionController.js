import { InvoicesPackage } from "../models/InvoicesPackpage.js";
import { BankMovement } from "../models/BankMovement.js";
import { ScheduledPayment } from "../models/ScheduledPayment.js";
import mongoose from "mongoose";
import { randomUUID } from "crypto";

export const getFacturasParaConciliacion = async (req, res) => {
  try {
    const { companyId, bankAccountId, fecha } = req.query;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: 'companyId y bankAccountId son requeridos.'
      });
    }

    let fechaFiltro, fechaFin;
    
    if (fecha) {
      // Crear la fecha en la zona horaria local para evitar problemas de UTC
      const [year, month, day] = fecha.split('-').map(Number);
      fechaFiltro = new Date(year, month - 1, day, 0, 0, 0, 0);
      fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      fechaFiltro = new Date();
      fechaFiltro.setHours(0, 0, 0, 0);
      fechaFin = new Date(fechaFiltro);
      fechaFin.setHours(23, 59, 59, 999);
    }
    const scheduledPayments = await ScheduledPayment.find({
      companyId,
      bankAccountId,
      scheduledDate: { $gte: fechaFiltro, $lte: fechaFin }
    });
    const packageIds = scheduledPayments.map(sp => sp.packageId);

    if (packageIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const facturas = await InvoicesPackage.aggregate([
      {
        $match: {
          _id: { $in: packageIds },
          estatus: 'Generado'
        }
      },
      {
        $unwind: '$facturas'
      },
      {
        $match: {
          'facturas.coinciliado': { $ne: true }
        }
      },
      {
        $addFields: {
          'facturas.importePagado': { $toDouble: '$facturas.importePagado' }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$facturas',
              {
                packageId: '$_id',
                folio: '$folio',
                packageFolio: '$folio',
                importeAPagar: '$totalPagado'
              }
            ]
          }
        }
      }
    ]);

    facturas.sort((a, b) => {
      const refA = a.numeroReferencia || '';
      const refB = b.numeroReferencia || '';
      return refA.localeCompare(refB);
    });
    res.status(200).json({
      success: true,
      data: facturas
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor.'
    });
  }
};

export const getMovimientosBancariosParaConciliacion = async (req, res) => {
  try {
    const { companyId, bankAccountId, fecha } = req.query;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: 'companyId y bankAccountId son requeridos.'
      });
    }

    let fechaFiltro, fechaFin;
    
    if (fecha) {
      // Crear la fecha en la zona horaria local para evitar problemas de UTC
      const [year, month, day] = fecha.split('-').map(Number);
      fechaFiltro = new Date(year, month - 1, day, 0, 0, 0, 0);
      fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      fechaFiltro = new Date();
      fechaFiltro.setHours(0, 0, 0, 0);
      fechaFin = new Date(fechaFiltro);
      fechaFin.setHours(23, 59, 59, 999);
    }

    console.log("Buscando movimientos con filtros:", {
      company: companyId,
      bankAccount: bankAccountId,
      fechaFiltro,
      fechaFin
    });

    // Usar $expr y $dateToString para comparar solo fecha sin hora
    const movimientos = await BankMovement.find({
      company: companyId,
      bankAccount: bankAccountId,
      coinciliado: { $ne: true },
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
          { $dateToString: { format: "%Y-%m-%d", date: fechaFiltro } }
        ]
      }
    })
    .populate('company', 'name')
    .populate('bankAccount', 'accountNumber clabe')
    .sort({ fecha: 1 });

    console.log("Movimientos encontrados:", JSON.stringify(movimientos, null, 2));

    res.status(200).json({
      success: true,
      data: movimientos
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor.'
    });
  }
};

export const conciliacionAutomatica = async (req, res) => {
  try {
    const { companyId, bankAccountId, fecha } = req.body;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: 'companyId y bankAccountId son requeridos.'
      });
    }

    let fechaFiltro, fechaFin;
    
    if (fecha) {
      // Crear la fecha en la zona horaria local para evitar problemas de UTC
      const [year, month, day] = fecha.split('-').map(Number);
      fechaFiltro = new Date(year, month - 1, day, 0, 0, 0, 0);
      fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      fechaFiltro = new Date();
      fechaFiltro.setHours(0, 0, 0, 0);
      fechaFin = new Date(fechaFiltro);
      fechaFin.setHours(23, 59, 59, 999);
    }

    const scheduledPayments = await ScheduledPayment.find({
      companyId,
      bankAccountId,
      scheduledDate: { $gte: fechaFiltro, $lte: fechaFin }
    });
    const packageIds = scheduledPayments.map(sp => sp.packageId);

    const facturas = await InvoicesPackage.aggregate([
      {
        $match: {
          _id: { $in: packageIds },
          estatus: 'Generado'
        }
      },
      {
        $unwind: '$facturas'
      },
      {
        $match: {
          'facturas.coinciliado': { $ne: true },
          'facturas.numeroReferencia': { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $addFields: {
          'facturas.importePagado': { $toDouble: '$facturas.importePagado' }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$facturas',
              {
                packageId: '$_id',
                importeAPagar: '$totalPagado'
              }
            ]
          }
        }
      }
    ]);

    const movimientos = await BankMovement.find({
      company: companyId,
      bankAccount: bankAccountId,
      coinciliado: { $ne: true },
      numeroReferencia: { $exists: true, $ne: null, $ne: '' },
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
          { $dateToString: { format: "%Y-%m-%d", date: fechaFiltro } }
        ]
      }
    });
    console.log("movimientos", movimientos);
    const coincidencias = [];
    const facturasNoCoinciden = [];
    const movimientosNoCoinciden = [];

    for (const factura of facturas) {
      const movimientoCoincidente = movimientos.find(mov => 
        mov.numeroReferencia === factura.numeroReferencia &&
        Math.abs(mov.abono - factura.importeAPagar) < 0.01
      );

      if (movimientoCoincidente) {
        const referenciaConciliacion = randomUUID();
        coincidencias.push({
          factura: factura,
          movimiento: movimientoCoincidente,
          referenciaConciliacion: referenciaConciliacion
        });
        const index = movimientos.indexOf(movimientoCoincidente);
        if (index > -1) {
          movimientos.splice(index, 1);
        }
      } else {
        facturasNoCoinciden.push(factura);
      }
    }

    movimientosNoCoinciden.push(...movimientos);

    res.status(200).json({
      success: true,
      data: {
        coincidencias: coincidencias,
        facturasNoCoinciden: facturasNoCoinciden,
        movimientosNoCoinciden: movimientosNoCoinciden,
        totalCoincidencias: coincidencias.length
      },
      message: `Se encontraron ${coincidencias.length} coincidencias automáticas.`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor.'
    });
  }
};

export const conciliacionManual = async (req, res) => {
  try {
    const { facturaId, movimientoId, comentario } = req.body;

    if (!facturaId || !movimientoId) {
      return res.status(400).json({
        success: false,
        message: 'facturaId y movimientoId son requeridos.'
      });
    }

    const movimiento = await BankMovement.findById(movimientoId);
    if (!movimiento) {
      return res.status(404).json({
        success: false,
        message: 'Movimiento bancario no encontrado.'
      });
    }

    if (movimiento.coinciliado) {
      return res.status(400).json({
        success: false,
        message: 'El movimiento bancario ya está conciliado.'
      });
    }

    const paquetes = await InvoicesPackage.find({
      'facturas._id': facturaId,
      estatus: 'Generado'
    });

    if (paquetes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada en paquetes con estatus Generado.'
      });
    }

    const paquete = paquetes[0];
    const factura = paquete.facturas.find(f => f._id.toString() === facturaId);

    if (factura.coinciliado) {
      return res.status(400).json({
        success: false,
        message: 'La factura ya está conciliada.'
      });
    }

    const referenciaConciliacion = randomUUID();
    
    const conciliacion = {
      facturaId: facturaId,
      movimientoId: movimientoId,
      comentario: comentario || 'Conciliación manual',
      fechaConciliacion: new Date(),
      referenciaConciliacion: referenciaConciliacion,
      tipo: 'manual'
    };

    res.status(200).json({
      success: true,
      data: conciliacion,
      message: 'Conciliación manual registrada exitosamente.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor.'
    });
  }
};

export const conciliacionDirecta = async (req, res) => {
  try {
    const { facturaId, movimientoIds, comentario } = req.body;

    if (!facturaId || !movimientoIds || !Array.isArray(movimientoIds) || movimientoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'facturaId y al menos un movimientoId son requeridos.'
      });
    }

    // Verificar que la factura existe y no está conciliada
    const paquetes = await InvoicesPackage.find({
      'facturas._id': facturaId,
      estatus: 'Generado'
    });

    if (paquetes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada en paquetes con estatus Generado.'
      });
    }

    const paquete = paquetes[0];
    const factura = paquete.facturas.find(f => f._id.toString() === facturaId);

    if (factura.coinciliado) {
      return res.status(400).json({
        success: false,
        message: 'La factura ya está conciliada.'
      });
    }

    // Verificar que todos los movimientos existen y no están conciliados
    const movimientos = await BankMovement.find({
      _id: { $in: movimientoIds },
      coinciliado: { $ne: true }
    });

    if (movimientos.length !== movimientoIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Algunos movimientos no existen o ya están conciliados.'
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fechaConciliacion = new Date();
      const comentarioConciliacion = comentario || 'Conciliación directa';
      const referenciaConciliacion = randomUUID();

      // Marcar la factura como conciliada
      await InvoicesPackage.updateOne(
        { 'facturas._id': facturaId },
        { 
          $set: { 
            'facturas.$.coinciliado': true,
            'facturas.$.comentarioConciliacion': comentarioConciliacion,
            'facturas.$.fechaConciliacion': fechaConciliacion,
            'facturas.$.referenciaConciliacion': referenciaConciliacion
          }
        },
        { session }
      );

      // Marcar todos los movimientos como conciliados
      await BankMovement.updateMany(
        { _id: { $in: movimientoIds } },
        { 
          coinciliado: true,
          comentarioConciliacion: comentarioConciliacion,
          fechaConciliacion: fechaConciliacion,
          referenciaConciliacion: referenciaConciliacion
        },
        { session }
      );

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        data: {
          facturaId,
          movimientoIds,
          comentario: comentarioConciliacion,
          fechaConciliacion,
          referenciaConciliacion
        },
        message: `Conciliación realizada exitosamente. 1 factura conciliada con ${movimientoIds.length} movimientos.`
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor.'
    });
  }
};

export const cerrarConciliacion = async (req, res) => {
  try {
    const { conciliaciones } = req.body;

    if (!conciliaciones || !Array.isArray(conciliaciones) || conciliaciones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos una conciliación para cerrar.'
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const procesadas = [];

      for (const conciliacion of conciliaciones) {
        const { facturaId, movimientoId, comentario, tipo, referenciaConciliacion } = conciliacion;
        
        // Si no hay referencia en la conciliación, generar una nueva
        const referenciaFinal = referenciaConciliacion || randomUUID();

        await BankMovement.findByIdAndUpdate(
          movimientoId,
          { 
            coinciliado: true,
            comentarioConciliacion: comentario || `Conciliación ${tipo}`,
            fechaConciliacion: new Date(),
            referenciaConciliacion: referenciaFinal
          },
          { session }
        );

        await InvoicesPackage.updateOne(
          { 'facturas._id': facturaId },
          { 
            $set: { 
              'facturas.$.coinciliado': true,
              'facturas.$.comentarioConciliacion': comentario || `Conciliación ${tipo}`,
              'facturas.$.fechaConciliacion': new Date(),
              'facturas.$.referenciaConciliacion': referenciaFinal
            }
          },
          { session }
        );

        procesadas.push({
          facturaId,
          movimientoId,
          tipo,
          comentario
        });
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        data: {
          procesadas: procesadas,
          totalProcesadas: procesadas.length
        },
        message: `Conciliación cerrada exitosamente. ${procesadas.length} registros procesados.`
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor.'
    });
  }
}; 