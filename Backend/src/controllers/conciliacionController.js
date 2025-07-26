import { InvoicesPackage } from "../models/InvoicesPackpage.js";
import { BankMovement } from "../models/BankMovement.js";
import { InvoicesPackageCompany } from "../models/InvoicesPackpageCompany.js";
import mongoose from "mongoose";

export const getFacturasParaConciliacion = async (req, res) => {
  try {
    const { companyId, bankAccountId, fecha } = req.query;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: 'companyId y bankAccountId son requeridos.'
      });
    }

    const fechaFiltro = fecha ? new Date(fecha) : new Date();
    fechaFiltro.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaFiltro);
    fechaFin.setHours(23, 59, 59, 999);

    const relations = await InvoicesPackageCompany.find({ companyId });
    const packageIds = relations.map(rel => rel.packageId);

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
          estatus: 'Generado',
          createdAt: { $gte: fechaFiltro, $lte: fechaFin }
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
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$facturas',
              {
                packageId: '$_id',
                folio: '$folio',
                packageFolio: '$folio'
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
    const { bankAccountId, fecha } = req.query;

    if (!bankAccountId) {
      return res.status(400).json({
        success: false,
        message: 'bankAccountId es requerido.'
      });
    }

    const fechaFiltro = fecha ? new Date(fecha) : new Date();
    fechaFiltro.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaFiltro);
    fechaFin.setHours(23, 59, 59, 999);

    const movimientos = await BankMovement.find({
      bankAccount: bankAccountId,
      fecha: { $gte: fechaFiltro, $lte: fechaFin },
      coinciliado: { $ne: true }
    })
    .populate('company', 'name')
    .populate('bankAccount', 'accountNumber clabe')
    .sort({ numeroReferencia: 1 });

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

    const fechaFiltro = fecha ? new Date(fecha) : new Date();
    fechaFiltro.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaFiltro);
    fechaFin.setHours(23, 59, 59, 999);

    const relations = await InvoicesPackageCompany.find({ companyId });
    const packageIds = relations.map(rel => rel.packageId);

    const facturas = await InvoicesPackage.aggregate([
      {
        $match: {
          _id: { $in: packageIds },
          estatus: 'Generado',
          createdAt: { $gte: fechaFiltro, $lte: fechaFin }
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
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$facturas',
              {
                packageId: '$_id'
              }
            ]
          }
        }
      }
    ]);

    const movimientos = await BankMovement.find({
      bankAccount: bankAccountId,
      fecha: { $gte: fechaFiltro, $lte: fechaFin },
      coinciliado: { $ne: true },
      numeroReferencia: { $exists: true, $ne: null, $ne: '' }
    });

    const coincidencias = [];
    const facturasNoCoinciden = [];
    const movimientosNoCoinciden = [];

    for (const factura of facturas) {
      const movimientoCoincidente = movimientos.find(mov => 
        mov.numeroReferencia === factura.numeroReferencia &&
        Math.abs(mov.abono - factura.importeAPagar) < 0.01
      );

      if (movimientoCoincidente) {
        coincidencias.push({
          factura: factura,
          movimiento: movimientoCoincidente
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

    const conciliacion = {
      facturaId: facturaId,
      movimientoId: movimientoId,
      comentario: comentario || 'Conciliación manual',
      fechaConciliacion: new Date(),
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
        const { facturaId, movimientoId, comentario, tipo } = conciliacion;

        await BankMovement.findByIdAndUpdate(
          movimientoId,
          { 
            coinciliado: true,
            comentarioConciliacion: comentario || `Conciliación ${tipo}`,
            fechaConciliacion: new Date()
          },
          { session }
        );

        await InvoicesPackage.updateOne(
          { 'facturas._id': facturaId },
          { 
            $set: { 
              'facturas.$.coinciliado': true,
              'facturas.$.comentarioConciliacion': comentario || `Conciliación ${tipo}`,
              'facturas.$.fechaConciliacion': new Date()
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