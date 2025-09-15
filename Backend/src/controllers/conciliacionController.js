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
        message: "companyId y bankAccountId son requeridos.",
      });
    }

    let fechaFiltro, fechaFin;

    if (fecha) {
      // Crear la fecha en la zona horaria local para evitar problemas de UTC
      const [year, month, day] = fecha.split("-").map(Number);
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
      scheduledDate: { $gte: fechaFiltro, $lte: fechaFin },
    });
    const packageIds = scheduledPayments.map((sp) => sp.packageId);

    if (packageIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const facturas = await InvoicesPackage.aggregate([
      {
        $match: {
          _id: { $in: packageIds },
          estatus: "Generado",
        },
      },
      {
        $unwind: "$facturas",
      },
      {
        $match: {
          "facturas.coinciliado": { $ne: true },
        },
      },
      {
        $addFields: {
          "facturas.importePagado": { $toDouble: "$facturas.importePagado" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$facturas",
              {
                packageId: "$_id",
                folio: "$folio",
                packageFolio: "$folio",
                importeAPagar: "$totalPagado",
              },
            ],
          },
        },
      },
    ]);

    facturas.sort((a, b) => {
      const refA = a.numeroReferencia || "";
      const refB = b.numeroReferencia || "";
      return refA.localeCompare(refB);
    });
    res.status(200).json({
      success: true,
      data: facturas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const getMovimientosBancariosParaConciliacion = async (req, res) => {
  try {
    const { companyId, bankAccountId, fecha } = req.query;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "companyId y bankAccountId son requeridos.",
      });
    }

    let fechaFiltro, fechaFin;

    if (fecha) {
      // Crear la fecha en la zona horaria local para evitar problemas de UTC
      const [year, month, day] = fecha.split("-").map(Number);
      fechaFiltro = new Date(year, month - 1, day, 0, 0, 0, 0);
      fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      fechaFiltro = new Date();
      fechaFiltro.setHours(0, 0, 0, 0);
      fechaFin = new Date(fechaFiltro);
      fechaFin.setHours(23, 59, 59, 999);
    }

    const movimientos = await BankMovement.find({
      company: companyId,
      bankAccount: bankAccountId,
      coinciliado: { $ne: true },
      fecha: { $gte: fechaFiltro, $lte: fechaFin },
    })
      .populate("company", "name")
      .populate("bankAccount", "accountNumber clabe")
      .sort({ fecha: 1 });

    res.status(200).json({
      success: true,
      data: movimientos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const conciliacionAutomatica = async (req, res) => {
  try {
    const { companyId, bankAccountId, fecha } = req.body;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "companyId y bankAccountId son requeridos.",
      });
    }

    let fechaFiltro, fechaFin;

    if (fecha) {
      // Crear la fecha en la zona horaria local para evitar problemas de UTC
      const [year, month, day] = fecha.split("-").map(Number);
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
      scheduledDate: { $gte: fechaFiltro, $lte: fechaFin },
    });
    const packageIds = scheduledPayments.map((sp) => sp.packageId);

    const facturas = await InvoicesPackage.aggregate([
      {
        $match: {
          _id: { $in: packageIds },
          estatus: "Generado",
        },
      },
      {
        $unwind: "$facturas",
      },
      {
        $match: {
          "facturas.coinciliado": { $ne: true },
          "facturas.numeroReferencia": { $exists: true, $ne: null, $ne: "" },
        },
      },
      {
        $addFields: {
          "facturas.importePagado": { $toDouble: "$facturas.importePagado" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$facturas",
              {
                packageId: "$_id",
                importeAPagar: "$totalPagado",
              },
            ],
          },
        },
      },
    ]);

    const movimientos = await BankMovement.find({
      company: companyId,
      bankAccount: bankAccountId,
      coinciliado: { $ne: true },
      referencia: { $exists: true, $ne: null, $ne: "" },
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
          { $dateToString: { format: "%Y-%m-%d", date: fechaFiltro } },
        ],
      },
    });
    const coincidencias = [];
    const facturasNoCoinciden = [];
    const movimientosNoCoinciden = [];

    for (const factura of facturas) {
      const movimientoCoincidente = movimientos.find(
        (mov) =>
          mov.numeroReferencia === factura.numeroReferencia &&
          Math.abs(mov.abono - factura.importeAPagar) < 0.01
      );

      if (movimientoCoincidente) {
        const referenciaConciliacion = randomUUID();
        coincidencias.push({
          factura: factura,
          movimiento: movimientoCoincidente,
          referenciaConciliacion: referenciaConciliacion,
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
        totalCoincidencias: coincidencias.length,
      },
      message: `Se encontraron ${coincidencias.length} coincidencias automáticas.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const conciliacionManual = async (req, res) => {
  try {
    const { facturaId, movimientoId, comentario } = req.body;

    if (!facturaId || !movimientoId) {
      return res.status(400).json({
        success: false,
        message: "facturaId y movimientoId son requeridos.",
      });
    }

    const movimiento = await BankMovement.findById(movimientoId);
    if (!movimiento) {
      return res.status(404).json({
        success: false,
        message: "Movimiento bancario no encontrado.",
      });
    }

    if (movimiento.coinciliado) {
      return res.status(400).json({
        success: false,
        message: "El movimiento bancario ya está conciliado.",
      });
    }

    const paquetes = await InvoicesPackage.find({
      "facturas._id": facturaId,
      estatus: "Generado",
    });

    if (paquetes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada en paquetes con estatus Generado.",
      });
    }

    const paquete = paquetes[0];
    const factura = paquete.facturas.find(
      (f) => f._id.toString() === facturaId
    );

    if (factura.coinciliado) {
      return res.status(400).json({
        success: false,
        message: "La factura ya está conciliada.",
      });
    }

    const referenciaConciliacion = randomUUID();

    const conciliacion = {
      facturaId: facturaId,
      movimientoId: movimientoId,
      comentario: comentario || "Conciliación manual",
      fechaConciliacion: new Date(),
      referenciaConciliacion: referenciaConciliacion,
      tipo: "manual",
    };

    res.status(200).json({
      success: true,
      data: conciliacion,
      message: "Conciliación manual registrada exitosamente.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const conciliacionDirecta = async (req, res) => {
  try {
    const { facturaId, movimientoIds, comentario } = req.body;

    if (
      !facturaId ||
      !movimientoIds ||
      !Array.isArray(movimientoIds) ||
      movimientoIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "facturaId y al menos un movimientoId son requeridos.",
      });
    }

    // Verificar que la factura existe y no está conciliada
    const paquetes = await InvoicesPackage.find({
      "facturas._id": facturaId,
      estatus: "Generado",
    });

    if (paquetes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada en paquetes con estatus Generado.",
      });
    }

    const paquete = paquetes[0];
    const factura = paquete.facturas.find(
      (f) => f._id.toString() === facturaId
    );

    if (factura.coinciliado) {
      return res.status(400).json({
        success: false,
        message: "La factura ya está conciliada.",
      });
    }

    // Verificar que todos los movimientos existen y no están conciliados
    const movimientos = await BankMovement.find({
      _id: { $in: movimientoIds },
      coinciliado: { $ne: true },
    });

    if (movimientos.length !== movimientoIds.length) {
      return res.status(400).json({
        success: false,
        message: "Algunos movimientos no existen o ya están conciliados.",
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const fechaConciliacion = new Date();
      const comentarioConciliacion = comentario || "Conciliación directa";
      const referenciaConciliacion = randomUUID();

      // Marcar la factura como conciliada SOLO en el paquete específico encontrado
      await InvoicesPackage.updateOne(
        { 
          _id: paquete._id,
          "facturas._id": facturaId 
        },
        {
          $set: {
            "facturas.$.coinciliado": true,
            "facturas.$.comentarioConciliacion": comentarioConciliacion,
            "facturas.$.fechaConciliacion": fechaConciliacion,
            "facturas.$.referenciaConciliacion": referenciaConciliacion,
          },
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
          referenciaConciliacion: referenciaConciliacion,
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
          referenciaConciliacion,
        },
        message: `Conciliación realizada exitosamente. 1 factura conciliada con ${movimientoIds.length} movimientos.`,
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
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const cerrarConciliacion = async (req, res) => {
  try {
    const { conciliaciones } = req.body;

    if (
      !conciliaciones ||
      !Array.isArray(conciliaciones) ||
      conciliaciones.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Se requiere al menos una conciliación para cerrar.",
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const procesadas = [];

      for (const conciliacion of conciliaciones) {
        const {
          facturaId,
          movimientoId,
          comentario,
          tipo,
          referenciaConciliacion,
        } = conciliacion;

        const referenciaFinal = referenciaConciliacion || randomUUID();

        await BankMovement.findByIdAndUpdate(
          movimientoId,
          {
            coinciliado: true,
            comentarioConciliacion: comentario || `Conciliación ${tipo}`,
            fechaConciliacion: new Date(),
            referenciaConciliacion: referenciaFinal,
          },
          { session }
        );

        // Buscar el paquete específico que contiene esta factura (similar a conciliacionDirecta)
        const paquetesFactura = await InvoicesPackage.find({
          "facturas._id": facturaId,
          estatus: "Generado",
        }).limit(1);

        if (paquetesFactura.length > 0) {
          await InvoicesPackage.updateOne(
            { 
              _id: paquetesFactura[0]._id,
              "facturas._id": facturaId 
            },
            {
              $set: {
                "facturas.$.coinciliado": true,
                "facturas.$.comentarioConciliacion":
                  comentario || `Conciliación ${tipo}`,
                "facturas.$.fechaConciliacion": new Date(),
                "facturas.$.referenciaConciliacion": referenciaFinal,
              },
            },
            { session }
          );
        }

        procesadas.push({
          facturaId,
          movimientoId,
          tipo,
          comentario,
        });
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        data: {
          procesadas: procesadas,
          totalProcesadas: procesadas.length,
        },
        message: `Conciliación cerrada exitosamente. ${procesadas.length} registros procesados.`,
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
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const getProviderGroupsParaConciliacion = async (req, res) => {
  try {
    const { companyId, bankAccountId, fecha } = req.query;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "companyId y bankAccountId son requeridos.",
      });
    }

    let fechaFiltro, fechaFin;

    if (fecha) {
      const [year, month, day] = fecha.split("-").map(Number);
      fechaFiltro = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      fechaFin = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    } else {
      fechaFiltro = new Date();
      fechaFiltro.setUTCHours(0, 0, 0, 0);
      fechaFin = new Date(fechaFiltro);
      fechaFin.setUTCHours(23, 59, 59, 999);
    }

    console.log(`Fecha seleccionada: ${fecha}`);
    console.log(`fechaFiltro generada: ${fechaFiltro.toISOString()}`);
    console.log(`fechaFiltro formato Y-m-d: ${fechaFiltro.getFullYear()}-${String(fechaFiltro.getMonth() + 1).padStart(2, '0')}-${String(fechaFiltro.getDate()).padStart(2, '0')}`);

    // Paso 1: Buscar paquetes programados por companyId y bankAccountId en rs_scheduled_payments
    const scheduledPayments = await ScheduledPayment.find({
      companyId,
      bankAccountId,
    }).select('packageId');

    console.log(`Scheduled Payments encontrados: ${scheduledPayments.length}`);

    if (scheduledPayments.length === 0) {
      console.log("No se encontraron pagos programados para esta combinación de razón social y cuenta bancaria");
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const scheduledPackageIds = scheduledPayments.map(sp => sp.packageId);

    // Paso 2: De esos paquetes, filtrar solo los que tengan estatus "Pagado"
    const paquetesPagados = await InvoicesPackage.find({
      _id: { $in: scheduledPackageIds },
      estatus: "Pagado",
    }).select('_id folio fechaPago');

    console.log(`Paquetes Pagados encontrados: ${paquetesPagados.length}`, paquetesPagados.map(p => ({ id: p._id, folio: p.folio, fechaPago: p.fechaPago })));

    if (paquetesPagados.length === 0) {
      console.log("No se encontraron paquetes pagados para esta combinación de razón social y cuenta bancaria");
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const packageIds = paquetesPagados.map(pkg => pkg._id);

    // Paso 3: Buscar agrupaciones que contengan estos paquetes Y filtrar por fecha de creación
    const PaymentsByProvider = (await import("../models/PaymentsByProvider.js"))
      .PaymentsByProvider;

    const providerGroups = await PaymentsByProvider.find({
      packageIds: { $in: packageIds },
      conciliado: { $ne: true }, // Solo mostrar agrupaciones no conciliadas
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          { $dateToString: { format: "%Y-%m-%d", date: fechaFiltro } },
        ],
      },
    }).sort({ createdAt: -1 });

    console.log(`Agrupaciones encontradas: ${providerGroups.length}`, providerGroups.map(pg => ({ 
      id: pg._id, 
      providerName: pg.providerName, 
      totalAmount: pg.totalAmount,
      packageIds: pg.packageIds,
      referencia: pg.referencia,
      createdAt: pg.createdAt.toISOString(),
      createdAtFormatted: `${pg.createdAt.getFullYear()}-${String(pg.createdAt.getMonth() + 1).padStart(2, '0')}-${String(pg.createdAt.getDate()).padStart(2, '0')}`
    })));

    res.status(200).json({
      success: true,
      data: providerGroups,
    });
  } catch (error) {
    console.error("Error en getProviderGroupsParaConciliacion:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const getFacturasIndividualesParaConciliacion = async (req, res) => {
  try {
    const { companyId, bankAccountId, fecha } = req.query;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "companyId y bankAccountId son requeridos.",
      });
    }

    let fechaFiltro, fechaFin;

    if (fecha) {
      const [year, month, day] = fecha.split("-").map(Number);
      fechaFiltro = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      fechaFin = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    } else {
      fechaFiltro = new Date();
      fechaFiltro.setUTCHours(0, 0, 0, 0);
      fechaFin = new Date(fechaFiltro);
      fechaFin.setUTCHours(23, 59, 59, 999);
    }

    console.log(`Fecha seleccionada: ${fecha}`);
    console.log(`fechaFiltro generada: ${fechaFiltro.toISOString()}`);

    // Paso 1: Buscar paquetes programados por companyId y bankAccountId
    const scheduledPayments = await ScheduledPayment.find({
      companyId,
      bankAccountId,
    }).select('packageId');

    console.log(`Scheduled Payments encontrados: ${scheduledPayments.length}`);

    if (scheduledPayments.length === 0) {
      console.log("No se encontraron pagos programados para esta combinación de razón social y cuenta bancaria");
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const scheduledPackageIds = scheduledPayments.map(sp => sp.packageId);

    // Paso 2: Filtrar paquetes por fecha de pago y luego obtener facturas autorizadas y pagadas
    const paquetesPorFecha = await InvoicesPackage.find({
      _id: { $in: scheduledPackageIds },
      estatus: "Pagado",
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$fechaPago" } },
          { $dateToString: { format: "%Y-%m-%d", date: fechaFiltro } },
        ],
      },
    }).select('_id folio fechaPago');

    console.log(`Paquetes con fecha de pago ${fecha} encontrados: ${paquetesPorFecha.length}`);

    if (paquetesPorFecha.length === 0) {
      console.log("No se encontraron paquetes con la fecha de pago seleccionada");
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const paquetesFechaIds = paquetesPorFecha.map(pkg => pkg._id);

    // Paso 3: Buscar agrupaciones que contengan estos paquetes para excluirlos
    const PaymentsByProvider = (await import("../models/PaymentsByProvider.js"))
      .PaymentsByProvider;

    const agrupaciones = await PaymentsByProvider.find({
      packageIds: { $in: paquetesFechaIds },
    }).select('packageIds');

    // Obtener todos los IDs de paquetes que ya están en agrupaciones
    const paquetesEnAgrupaciones = new Set();
    agrupaciones.forEach(agrupacion => {
      if (agrupacion.packageIds && Array.isArray(agrupacion.packageIds)) {
        agrupacion.packageIds.forEach(packageId => {
          paquetesEnAgrupaciones.add(packageId.toString());
        });
      }
    });

    console.log(`Paquetes en agrupaciones encontrados: ${paquetesEnAgrupaciones.size}`);

    // Filtrar paquetes que NO estén en agrupaciones
    const paquetesNoAgrupados = paquetesFechaIds.filter(pkgId => 
      !paquetesEnAgrupaciones.has(pkgId.toString())
    );

    console.log(`Paquetes NO agrupados disponibles: ${paquetesNoAgrupados.length}`);

    if (paquetesNoAgrupados.length === 0) {
      console.log("No se encontraron paquetes sin agrupar para la fecha seleccionada");
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Paso 4: Buscar facturas individuales dentro de paquetes NO agrupados que estén autorizadas y pagadas
    const facturasIndividuales = await InvoicesPackage.aggregate([
      {
        $match: {
          _id: { $in: paquetesNoAgrupados },
          estatus: "Pagado",
        },
      },
      {
        $unwind: "$facturas",
      },
      {
        $match: {
          "facturas.coinciliado": { $ne: true },
          "facturas.autorizada": true,
          "facturas.estadoPago": 2, // 2 = Pagado
        },
      },
      {
        $addFields: {
          "facturas.importePagado": { $toDouble: "$facturas.importePagado" },
          "facturas.importeAPagar": { $toDouble: "$facturas.importeAPagar" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$facturas",
              {
                packageId: "$_id",
                packageFolio: "$folio",
                fechaPago: "$fechaPago",
              },
            ],
          },
        },
      },
      {
        $sort: {
          nombreEmisor: 1,
          folio: 1
        }
      }
    ]);

    console.log(`Facturas individuales encontradas: ${facturasIndividuales.length}`);

    res.status(200).json({
      success: true,
      data: facturasIndividuales,
    });
  } catch (error) {
    console.error("Error en getFacturasIndividualesParaConciliacion:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const conciliacionDirectaProvider = async (req, res) => {
  try {
    const { providerGroupId, movimientoIds, comentario } = req.body;

    if (
      !providerGroupId ||
      !movimientoIds ||
      !Array.isArray(movimientoIds) ||
      movimientoIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "providerGroupId y movimientoIds son requeridos.",
      });
    }

    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      const referenciaConciliacion = randomUUID();

      // Marcar movimientos bancarios como conciliados
      for (const movimientoId of movimientoIds) {
        await BankMovement.findByIdAndUpdate(
          movimientoId,
          {
            coinciliado: true,
            comentarioConciliacion:
              comentario || "Conciliación directa por proveedor",
            fechaConciliacion: new Date(),
            referenciaConciliacion,
          }
          //{ session }
        );
      }

      // Obtener el provider group y sus facturas
      const PaymentsByProvider = (
        await import("../models/PaymentsByProvider.js")
      ).PaymentsByProvider;
      const providerGroup = await PaymentsByProvider.findById(providerGroupId);

      if (!providerGroup) {
        throw new Error("Provider group no encontrado");
      }

      // Marcar la agrupación como conciliada
      await PaymentsByProvider.findByIdAndUpdate(
        providerGroupId,
        {
          conciliado: true,
          comentarioConciliacion: comentario || "Conciliación directa por proveedor",
          fechaConciliacion: new Date(),
          referenciaConciliacion: referenciaConciliacion,
        }
        //{ session }
      );

      const facturaIds = providerGroup.facturas || [];

      // Marcar todas las facturas del provider group como conciliadas SOLO en los paquetes específicos de la agrupación
      const packageIds = providerGroup.packageIds || [];
      
      for (const packageId of packageIds) {
        for (const facturaId of facturaIds) {
          await InvoicesPackage.updateOne(
            { 
              _id: packageId,
              "facturas._id": facturaId 
            },
            {
              $set: {
                "facturas.$.coinciliado": true,
                "facturas.$.comentarioConciliacion":
                  comentario || "Conciliación directa por proveedor",
                "facturas.$.fechaConciliacion": new Date(),
                "facturas.$.referenciaConciliacion": referenciaConciliacion,
              },
            }
            //{ session }
          );
        }
      }

      //await session.commitTransaction();

      res.status(200).json({
        success: true,
        data: {
          providerGroupId,
          movimientoIds,
          referenciaConciliacion,
        },
        message: `Conciliación directa por proveedor realizada exitosamente. ${facturaIds.length} facturas conciliadas con ${movimientoIds.length} movimientos.`,
      });
    } catch (error) {
      //await session.abortTransaction();
      throw error;
    } finally {
      //session.endSession();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const conciliacionConValidaciones = async (req, res) => {
  try {
    const { tipo, items, movimientoIds, comentario } = req.body;

    if (!tipo || !items || !Array.isArray(items) || items.length === 0 ||
        !movimientoIds || !Array.isArray(movimientoIds) || movimientoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "tipo, items y movimientoIds son requeridos.",
      });
    }

    if (!['individual', 'grouped'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: "El tipo debe ser 'individual' o 'grouped'.",
      });
    }

    // Obtener movimientos bancarios
    const movimientos = await BankMovement.find({
      _id: { $in: movimientoIds },
      coinciliado: { $ne: true },
    });

    if (movimientos.length !== movimientoIds.length) {
      return res.status(400).json({
        success: false,
        message: "Algunos movimientos no existen o ya están conciliados.",
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const referenciaConciliacion = randomUUID();
      const validacionesErrores = [];
      let facturasParaConciliar = [];

      if (tipo === 'individual') {
        // Validar facturas individuales
        for (const facturaId of items) {
          const paquete = await InvoicesPackage.findOne(
            { "facturas._id": facturaId },
            null,
            { session }
          );

          if (!paquete) {
            validacionesErrores.push(`Factura ${facturaId} no encontrada`);
            continue;
          }

          const factura = paquete.facturas.find(f => f._id.toString() === facturaId);
          
          if (!factura) {
            validacionesErrores.push(`Factura ${facturaId} no encontrada en el paquete`);
            continue;
          }

          if (factura.coinciliado) {
            validacionesErrores.push(`Factura ${facturaId} ya está conciliada`);
            continue;
          }

          // Validar monto y referencia con movimientos bancarios
          const movimientosConMonto = movimientos.filter(mov => Math.abs(mov.abono - parseFloat(factura.importePagado)) < 0.01);
          const movimientosConReferencia = movimientos.filter(mov => mov.referencia === factura.referencia);
          
          const movimientoCoincidente = movimientos.find(mov => {
            const montoValido = Math.abs(mov.abono - parseFloat(factura.importePagado)) < 0.01;
            const referenciaValida = mov.referencia === factura.referencia;
            return montoValido && referenciaValida;
          });

          if (!movimientoCoincidente) {
            const montoFactura = parseFloat(factura.importePagado);
            const referenciaFactura = factura.numeroReferencia || factura.referencia;
            const folioFactura = factura.folio || facturaId;
            const emisorInfo = factura.nombreEmisor ? ` (${factura.nombreEmisor})` : '';
            
            let errorDetallado = `Factura ${folioFactura}${emisorInfo} no coincide:`;
            let detallesError = [];
            
            if (movimientosConMonto.length === 0) {
              const montosDisponibles = [...new Set(movimientos.map(m => m.abono))].sort((a, b) => b - a);
              detallesError.push(`💰 Monto requerido: $${montoFactura.toFixed(2)} | Disponibles: ${montosDisponibles.map(m => `$${m.toFixed(2)}`).slice(0, 3).join(', ')}${montosDisponibles.length > 3 ? '...' : ''}`);
            }
            
            if (movimientosConReferencia.length === 0) {
              const referenciasDisponibles = [...new Set(movimientos.map(m => m.numeroReferencia || m.referencia).filter(r => r))];
              detallesError.push(`🔢 Referencia requerida: "${referenciaFactura || 'N/A'}" | Disponibles: ${referenciasDisponibles.slice(0, 3).map(r => `"${r}"`).join(', ')}${referenciasDisponibles.length > 3 ? '...' : ''}`);
            }
            
            if (detallesError.length > 0) {
              errorDetallado += '\n' + detallesError.join('\n');
            }
            
            validacionesErrores.push(errorDetallado);
            continue;
          }

          facturasParaConciliar.push({
            facturaId,
            paqueteId: paquete._id,
            movimientoId: movimientoCoincidente._id
          });
        }
      } else if (tipo === 'grouped') {
        // Validar agrupaciones de proveedores
        const PaymentsByProvider = (await import("../models/PaymentsByProvider.js")).PaymentsByProvider;

        for (const providerGroupId of items) {
          const providerGroup = await PaymentsByProvider.findById(providerGroupId);

          if (!providerGroup) {
            validacionesErrores.push(`Agrupación ${providerGroupId} no encontrada`);
            continue;
          }

          // Validar monto y referencia con movimientos bancarios
          const movimientosConMonto = movimientos.filter(mov => Math.abs(mov.abono - providerGroup.totalAmount) < 0.01);
          const movimientosConReferencia = movimientos.filter(mov => mov.referencia === providerGroup.referencia);
          
          const movimientoCoincidente = movimientos.find(mov => {
            const montoValido = Math.abs(mov.abono - providerGroup.totalAmount) < 0.01;
            const referenciaValida = mov.referencia === providerGroup.referencia;
            return montoValido && referenciaValida;
          });

          if (!movimientoCoincidente) {
            let errorDetallado = `Agrupación ${providerGroup.providerName} no coincide:`;
            let detallesError = [];
            
            if (movimientosConMonto.length === 0) {
              const montosDisponibles = [...new Set(movimientos.map(m => m.abono))].sort((a, b) => b - a);
              detallesError.push(`💰 Monto requerido: $${providerGroup.totalAmount.toFixed(2)} | Disponibles: ${montosDisponibles.map(m => `$${m.toFixed(2)}`).slice(0, 3).join(', ')}${montosDisponibles.length > 3 ? '...' : ''}`);
            }
            
            if (movimientosConReferencia.length === 0) {
              const referenciasDisponibles = [...new Set(movimientos.map(m => m.numeroReferencia || m.referencia).filter(r => r))];
              detallesError.push(`🔢 Referencia requerida: "${providerGroup.referencia || 'N/A'}" | Disponibles: ${referenciasDisponibles.slice(0, 3).map(r => `"${r}"`).join(', ')}${referenciasDisponibles.length > 3 ? '...' : ''}`);
            }
            
            if (detallesError.length > 0) {
              errorDetallado += '\n' + detallesError.join('\n');
            }
            
            validacionesErrores.push(errorDetallado);
            continue;
          }

          // Agregar todas las facturas de la agrupación con sus paquetes específicos
          const facturaIds = providerGroup.facturas || [];
          const packageIds = providerGroup.packageIds || [];
          
          for (const packageId of packageIds) {
            for (const facturaId of facturaIds) {
              facturasParaConciliar.push({
                facturaId,
                packageId,
                movimientoId: movimientoCoincidente._id,
                providerGroupId
              });
            }
          }
          
          // Agregar el providerGroupId a una lista para marcarlos como conciliados
          if (!facturasParaConciliar.find(f => f.providerGroupId === providerGroupId)) {
            facturasParaConciliar.providerGroupsToMark = facturasParaConciliar.providerGroupsToMark || [];
            facturasParaConciliar.providerGroupsToMark.push(providerGroupId);
          }
        }
      }

      if (validacionesErrores.length > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Errores de validación encontrados:",
          errores: validacionesErrores
        });
      }

      if (facturasParaConciliar.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "No se encontraron elementos válidos para conciliar."
        });
      }

      // Realizar conciliación
      const fechaConciliacion = new Date();
      const comentarioConciliacion = comentario || `Conciliación ${tipo} con validaciones`;

      // Marcar facturas como conciliadas solo en sus paquetes específicos
      for (const item of facturasParaConciliar) {
        const query = item.packageId 
          ? { _id: item.packageId, "facturas._id": item.facturaId }
          : { "facturas._id": item.facturaId };
          
        await InvoicesPackage.updateOne(
          query,
          {
            $set: {
              "facturas.$.coinciliado": true,
              "facturas.$.comentarioConciliacion": comentarioConciliacion,
              "facturas.$.fechaConciliacion": fechaConciliacion,
              "facturas.$.referenciaConciliacion": referenciaConciliacion,
            },
          },
          { session }
        );
      }

      // Marcar movimientos como conciliados
      await BankMovement.updateMany(
        { _id: { $in: movimientoIds } },
        {
          coinciliado: true,
          comentarioConciliacion: comentarioConciliacion,
          fechaConciliacion: fechaConciliacion,
          referenciaConciliacion: referenciaConciliacion,
        },
        { session }
      );

      // Marcar agrupaciones como conciliadas si las hay
      if (tipo === 'grouped' && items.length > 0) {
        const PaymentsByProvider = (await import("../models/PaymentsByProvider.js")).PaymentsByProvider;
        await PaymentsByProvider.updateMany(
          { _id: { $in: items } },
          {
            conciliado: true,
            comentarioConciliacion: comentarioConciliacion,
            fechaConciliacion: fechaConciliacion,
            referenciaConciliacion: referenciaConciliacion,
          },
          { session }
        );
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        data: {
          items,
          movimientoIds,
          referenciaConciliacion,
          facturasAfectadas: facturasParaConciliar.length,
          tipo
        },
        message: `Conciliación ${tipo} realizada exitosamente. ${facturasParaConciliar.length} facturas conciliadas con ${movimientoIds.length} movimientos.`,
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
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const getProviderGroupsConciliados = async (req, res) => {
  try {
    const { companyId, bankAccountId, fecha } = req.query;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "companyId y bankAccountId son requeridos.",
      });
    }

    let fechaFiltro, fechaFin;

    if (fecha) {
      const [year, month, day] = fecha.split("-").map(Number);
      fechaFiltro = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      fechaFin = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    } else {
      fechaFiltro = new Date();
      fechaFiltro.setUTCHours(0, 0, 0, 0);
      fechaFin = new Date(fechaFiltro);
      fechaFin.setUTCHours(23, 59, 59, 999);
    }

    const scheduledPayments = await ScheduledPayment.find({
      companyId,
      bankAccountId,
    }).select('packageId');

    if (scheduledPayments.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const scheduledPackageIds = scheduledPayments.map(sp => sp.packageId);

    const paquetesPagados = await InvoicesPackage.find({
      _id: { $in: scheduledPackageIds },
      estatus: "Pagado",
    }).select('_id folio fechaPago');

    if (paquetesPagados.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const packageIds = paquetesPagados.map(pkg => pkg._id);

    const PaymentsByProvider = (await import("../models/PaymentsByProvider.js")).PaymentsByProvider;

    const providerGroups = await PaymentsByProvider.find({
      packageIds: { $in: packageIds },
      conciliado: true, // Solo mostrar agrupaciones conciliadas
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$fechaConciliacion" } },
          { $dateToString: { format: "%Y-%m-%d", date: fechaFiltro } },
        ],
      },
    }).sort({ fechaConciliacion: -1 });

    res.status(200).json({
      success: true,
      data: providerGroups,
    });
  } catch (error) {
    console.error("Error en getProviderGroupsConciliados:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const getFacturasIndividualesConciliadas = async (req, res) => {
  try {
    const { companyId, bankAccountId, fecha } = req.query;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "companyId y bankAccountId son requeridos.",
      });
    }

    let fechaFiltro, fechaFin;

    if (fecha) {
      const [year, month, day] = fecha.split("-").map(Number);
      fechaFiltro = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      fechaFin = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    } else {
      fechaFiltro = new Date();
      fechaFiltro.setUTCHours(0, 0, 0, 0);
      fechaFin = new Date(fechaFiltro);
      fechaFin.setUTCHours(23, 59, 59, 999);
    }

    const scheduledPayments = await ScheduledPayment.find({
      companyId,
      bankAccountId,
    }).select('packageId');

    if (scheduledPayments.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const scheduledPackageIds = scheduledPayments.map(sp => sp.packageId);

    const paquetesPorFecha = await InvoicesPackage.find({
      _id: { $in: scheduledPackageIds },
      estatus: "Pagado",
    }).select('_id folio fechaPago');

    if (paquetesPorFecha.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const paquetesFechaIds = paquetesPorFecha.map(pkg => pkg._id);

    const PaymentsByProvider = (await import("../models/PaymentsByProvider.js")).PaymentsByProvider;

    const agrupaciones = await PaymentsByProvider.find({
      packageIds: { $in: paquetesFechaIds },
    }).select('packageIds');

    const paquetesEnAgrupaciones = new Set();
    agrupaciones.forEach(agrupacion => {
      if (agrupacion.packageIds && Array.isArray(agrupacion.packageIds)) {
        agrupacion.packageIds.forEach(packageId => {
          paquetesEnAgrupaciones.add(packageId.toString());
        });
      }
    });

    const paquetesNoAgrupados = paquetesFechaIds.filter(pkgId => 
      !paquetesEnAgrupaciones.has(pkgId.toString())
    );

    if (paquetesNoAgrupados.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const facturasIndividuales = await InvoicesPackage.aggregate([
      {
        $match: {
          _id: { $in: paquetesNoAgrupados },
          estatus: "Pagado",
        },
      },
      {
        $unwind: "$facturas",
      },
      {
        $match: {
          "facturas.coinciliado": true, // Solo facturas conciliadas
          "facturas.autorizada": true,
          "facturas.estadoPago": 2,
          $expr: {
            $eq: [
              { $dateToString: { format: "%Y-%m-%d", date: "$facturas.fechaConciliacion" } },
              { $dateToString: { format: "%Y-%m-%d", date: fechaFiltro } },
            ],
          },
        },
      },
      {
        $addFields: {
          "facturas.importePagado": { $toDouble: "$facturas.importePagado" },
          "facturas.importeAPagar": { $toDouble: "$facturas.importeAPagar" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$facturas",
              {
                packageId: "$_id",
                packageFolio: "$folio",
                fechaPago: "$fechaPago",
              },
            ],
          },
        },
      },
      {
        $sort: {
          fechaConciliacion: -1,
          nombreEmisor: 1,
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: facturasIndividuales,
    });
  } catch (error) {
    console.error("Error en getFacturasIndividualesConciliadas:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

export const eliminarConciliacion = async (req, res) => {
  try {
    const { itemId, tipo } = req.body;

    if (!itemId || !tipo) {
      return res.status(400).json({
        success: false,
        message: "itemId y tipo son requeridos.",
      });
    }

    if (!['individual', 'grouped'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: "El tipo debe ser 'individual' o 'grouped'.",
      });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (tipo === 'individual') {
        // Buscar la factura en los paquetes y revertir su conciliación
        const paquete = await InvoicesPackage.findOne(
          { "facturas._id": itemId },
          null,
          { session }
        );

        if (!paquete) {
          await session.abortTransaction();
          return res.status(404).json({
            success: false,
            message: "Factura no encontrada.",
          });
        }

        const factura = paquete.facturas.find(f => f._id.toString() === itemId);
        
        if (!factura || !factura.coinciliado) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: "La factura no está conciliada.",
          });
        }

        // Revertir conciliación de la factura
        await InvoicesPackage.updateOne(
          { 
            _id: paquete._id,
            "facturas._id": itemId 
          },
          {
            $set: {
              "facturas.$.coinciliado": false,
              "facturas.$.comentarioConciliacion": "",
              "facturas.$.fechaConciliacion": null,
              "facturas.$.referenciaConciliacion": "",
            },
          },
          { session }
        );

        // Buscar y revertir movimientos bancarios asociados
        if (factura.referenciaConciliacion) {
          await BankMovement.updateMany(
            { referenciaConciliacion: factura.referenciaConciliacion },
            {
              coinciliado: false,
              comentarioConciliacion: "",
              fechaConciliacion: null,
              referenciaConciliacion: "",
            },
            { session }
          );
        }

      } else if (tipo === 'grouped') {
        // Buscar la agrupación y revertir su conciliación
        const PaymentsByProvider = (await import("../models/PaymentsByProvider.js")).PaymentsByProvider;
        const providerGroup = await PaymentsByProvider.findById(itemId);

        if (!providerGroup) {
          await session.abortTransaction();
          return res.status(404).json({
            success: false,
            message: "Agrupación no encontrada.",
          });
        }

        if (!providerGroup.conciliado) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: "La agrupación no está conciliada.",
          });
        }

        // Revertir conciliación de la agrupación
        await PaymentsByProvider.findByIdAndUpdate(
          itemId,
          {
            conciliado: false,
            comentarioConciliacion: "",
            fechaConciliacion: null,
            referenciaConciliacion: "",
          },
          { session }
        );

        // Revertir conciliación de todas las facturas de la agrupación
        const facturaIds = providerGroup.facturas || [];
        const packageIds = providerGroup.packageIds || [];
        
        for (const packageId of packageIds) {
          for (const facturaId of facturaIds) {
            await InvoicesPackage.updateOne(
              { 
                _id: packageId,
                "facturas._id": facturaId 
              },
              {
                $set: {
                  "facturas.$.coinciliado": false,
                  "facturas.$.comentarioConciliacion": "",
                  "facturas.$.fechaConciliacion": null,
                  "facturas.$.referenciaConciliacion": "",
                },
              },
              { session }
            );
          }
        }

        // Revertir movimientos bancarios asociados
        if (providerGroup.referenciaConciliacion) {
          await BankMovement.updateMany(
            { referenciaConciliacion: providerGroup.referenciaConciliacion },
            {
              coinciliado: false,
              comentarioConciliacion: "",
              fechaConciliacion: null,
              referenciaConciliacion: "",
            },
            { session }
          );
        }
      }

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        data: { itemId, tipo },
        message: `Conciliación ${tipo === 'grouped' ? 'de agrupación' : 'de factura'} eliminada exitosamente.`,
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error en eliminarConciliacion:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};
