import { ImportedInvoices } from "../models/ImportedInvoices.js";
import { Company } from "../models/Company.js";
import { Provider } from "../models/Provider.js";
import { actualizarTotalesPaquetesPorFactura } from "./invoicesPackpageController.js";
import mongoose from "mongoose";

const parseDate = (dateString) => {
  if (
    !dateString ||
    !dateString.trim() ||
    dateString.trim() === "0000-00-00 00:00:00"
  ) {
    return null;
  }
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

export const bulkUpsertInvoices = async (req, res) => {
  try {
    const invoices = req.body;
    if (!invoices || !Array.isArray(invoices)) {
      return res.status(400).json({
        success: false,
        message: "El cuerpo de la petición debe ser un arreglo de facturas.",
      });
    }

    const rfcReceptores = [
      ...new Set(invoices.map((inv) => inv.RfcReceptor.toUpperCase())),
    ];
    const companies = await Company.find({ rfc: { $in: rfcReceptores } });

    const companyMap = new Map(
      companies.map((comp) => [comp.rfc.toUpperCase(), comp._id])
    );

    const operations = invoices
      .map((invoice) => {
        const rfcReceptor = invoice.RfcReceptor.toUpperCase();
        const companyId = companyMap.get(rfcReceptor);

        if (!companyId) {
          return null;
        }

        const invoiceData = {
          uuid: invoice.Uuid,
          rfcEmisor: invoice.RfcEmisor,
          nombreEmisor: invoice.NombreEmisor,
          rfcReceptor: invoice.RfcReceptor,
          nombreReceptor: invoice.NombreReceptor,
          rfcProveedorCertificacion: invoice.RfcPac,
          fechaEmision: parseDate(invoice.FechaEmision),
          fechaCertificacionSAT: parseDate(invoice.FechaCertificacionSat),
          importeAPagar:
            parseFloat(String(invoice.Monto).replace(/[^0-9.-]+/g, "")) || 0,
          tipoComprobante: invoice.EfectoComprobante,
          estatus: parseInt(invoice.Estatus, 10),
          fechaCancelacion: parseDate(invoice.FechaCancelacion),
          razonSocial: typeof companyId === 'string' ? new mongoose.Types.ObjectId(companyId) : companyId,
        };

        if (!invoiceData.uuid) {
          return null;
        }

        return {
          updateOne: {
            filter: { uuid: invoiceData.uuid },
            update: { $set: invoiceData },
            upsert: true,
          },
        };
      })
      .filter((op) => op !== null);

    if (operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hay facturas válidas para procesar.",
      });
    }

    const result = await ImportedInvoices.bulkWrite(operations);

    res.status(201).json({
      success: true,
      message: `${result.upsertedCount + result.modifiedCount
        } facturas procesadas exitosamente.`,
      data: {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      rfcReceptor,
      estatus,
      sortBy = "fechaEmision",
      order = "desc",
    } = req.query;

    if (!rfcReceptor) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un RFC del receptor.",
      });
    }

    const query = { rfcReceptor: rfcReceptor.toUpperCase() };
    if (estatus && ["0", "1"].includes(estatus)) {
      query.estatus = parseInt(estatus, 10);
    }

    const sortOptions = { [sortBy]: order === "asc" ? 1 : -1 };

    const invoicesPromise = ImportedInvoices.find(query)
      .populate("razonSocial", "name rfc")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean({ getters: true })
      .exec();

    const countPromise = ImportedInvoices.countDocuments(query);

    const [invoicesFromDb, count] = await Promise.all([
      invoicesPromise,
      countPromise,
    ]);

    const invoices = invoicesFromDb.map((invoice) => ({
      ...invoice,
      importeAPagar: invoice.importeAPagar
        ? parseFloat(invoice.importeAPagar.toString())
        : 0,
    }));

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInvoicesSummary = async (req, res) => {
  try {
    const { rfcReceptor } = req.query;

    if (!rfcReceptor) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un RFC del receptor.",
      });
    }

    const summaryData = await ImportedInvoices.obtenerResumen(rfcReceptor);

    res.status(200).json({
      success: true,
      data: summaryData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Nueva función: Obtener facturas filtradas por RFC de proveedor y empresa
export const getInvoicesByProviderAndCompany = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      rfcProvider,
      rfcCompany,
      startDate,
      endDate,
      estatus,
      estadoPago,
      sortBy = "fechaEmision",
      order = "desc",
    } = req.query;

    // Validar que se proporcione al menos uno de los RFCs
    if (!rfcProvider && !rfcCompany) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere al menos un RFC de proveedor o empresa para filtrar.",
      });
    }

    // Construir la consulta base
    const query = {};

    // Si se proporciona RFC de proveedor, filtrar por rfcEmisor
    if (rfcProvider) {
      query.rfcEmisor = rfcProvider.toUpperCase();
    }

    // Si se proporciona RFC de empresa, filtrar por rfcReceptor
    if (rfcCompany) {
      query.rfcReceptor = rfcCompany.toUpperCase();
    }

    // Filtros de fecha si se proporcionan
    if (startDate || endDate) {
      query.fechaEmision = {};
      if (startDate) {
        query.fechaEmision.$gte = new Date(startDate);
      }
      if (endDate) {
        query.fechaEmision.$lte = new Date(endDate);
      }
    }

    // Filtros adicionales
    if (estatus && ["0", "1"].includes(estatus)) {
      query.estatus = parseInt(estatus, 10);
    }

    if (estadoPago && ["0", "1", "2", "3"].includes(estadoPago)) {
      query.estadoPago = parseInt(estadoPago, 10);
    }

    // Opciones de ordenamiento
    const sortOptions = { [sortBy]: order === "asc" ? 1 : -1 };

    // Consulta con paginación
    const invoicesPromise = ImportedInvoices.find(query)
      .populate("razonSocial", "name rfc")
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean({ getters: true })
      .exec();

    const countPromise = ImportedInvoices.countDocuments(query);

    const [invoicesFromDb, count] = await Promise.all([
      invoicesPromise,
      countPromise,
    ]);

    // Procesar las facturas para asegurar que los campos decimales se conviertan correctamente
    const invoices = invoicesFromDb.map((invoice) => ({
      ...invoice,
      importeAPagar: invoice.importeAPagar
        ? parseFloat(invoice.importeAPagar.toString())
        : 0,
      importePagado: invoice.importePagado
        ? parseFloat(invoice.importePagado.toString())
        : 0,
    }));

    // Obtener información adicional de proveedores y empresas si se solicitó
    let additionalInfo = {};

    if (rfcProvider) {
      const provider = await Provider.findOne({
        rfc: rfcProvider.toUpperCase(),
      });
      if (provider) {
        additionalInfo.provider = {
          name: provider.name,
          rfc: provider.rfc,
          email: provider.email,
        };
      }
    }

    if (rfcCompany) {
      const company = await Company.findOne({ rfc: rfcCompany.toUpperCase() });
      if (company) {
        additionalInfo.company = {
          name: company.name,
          rfc: company.rfc,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: invoices,
      additionalInfo,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("Error getting invoices by provider and company:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// Función adicional: Obtener resumen de facturas por proveedor y empresa
export const getInvoicesSummaryByProviderAndCompany = async (req, res) => {
  try {
    const { rfcProvider, rfcCompany, startDate, endDate } = req.query;

    // Validar que se proporcione al menos uno de los RFCs
    if (!rfcProvider && !rfcCompany) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere al menos un RFC de proveedor o empresa para filtrar.",
      });
    }

    // Construir la consulta base
    const query = {};

    if (rfcProvider) {
      query.rfcEmisor = rfcProvider.toUpperCase();
    }

    if (rfcCompany) {
      query.rfcReceptor = rfcCompany.toUpperCase();
    }

    // Filtros de fecha si se proporcionan
    if (startDate || endDate) {
      query.fechaEmision = {};
      if (startDate) {
        query.fechaEmision.$gte = new Date(startDate);
      }
      if (endDate) {
        query.fechaEmision.$lte = new Date(endDate);
      }
    }

    // Obtener estadísticas
    const [
      totalFacturas,
      facturasCanceladas,
      facturasPendientes,
      facturasEnviadas,
      facturasPagadas,
      facturasRegistradas,
      totalImporteAPagar,
      totalPagado,
    ] = await Promise.all([
      ImportedInvoices.countDocuments(query),
      ImportedInvoices.countDocuments({ ...query, estatus: 0 }),
      ImportedInvoices.countDocuments({ ...query, estadoPago: 0 }),
      ImportedInvoices.countDocuments({ ...query, estadoPago: 1 }),
      ImportedInvoices.countDocuments({ ...query, estadoPago: 2 }),
      ImportedInvoices.countDocuments({ ...query, estadoPago: 3 }),
      ImportedInvoices.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$importeAPagar" } } },
      ]),
      ImportedInvoices.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$importePagado" } } },
      ]),
    ]);

    const summaryData = {
      totalFacturas,
      facturasCanceladas,
      facturasPendientes,
      facturasEnviadas,
      facturasPagadas,
      facturasRegistradas,
      totalImporteAPagar: totalImporteAPagar[0]?.total || 0,
      totalPagado: totalPagado[0]?.total || 0,
      totalSaldo:
        (totalImporteAPagar[0]?.total || 0) - (totalPagado[0]?.total || 0),
    };

    res.status(200).json({
      success: true,
      data: summaryData,
    });
  } catch (error) {
    console.error(
      "Error getting invoices summary by provider and company:",
      error
    );
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// Obtener facturas filtradas por proveedor y razón social (empresa)
export const getByProviderAndCompany = async (req, res) => {
  try {
    console.log('Datos recibidos en la petición:', req.query); // LOG de entrada
    const {
      rfcProvider,
      rfcCompany,
      providerIds, // Nuevo parámetro para IDs de proveedores
      startDate,   // Nuevo parámetro para fecha de inicio
      endDate,     // Nuevo parámetro para fecha de fin
      page = 1,
      limit = 15,
      sortBy = "fechaEmision",
      order = "desc"
    } = req.query;

    if (!rfcProvider && !rfcCompany && !providerIds) {
      return res.status(400).json({ success: false, message: "Se requiere al menos rfcProvider, rfcCompany o providerIds" });
    }

    // Buscar compañía activa por nombre o RFC
    let company;
    if (rfcCompany) {
      // Intentar buscar por nombre primero, luego por RFC
      company = await Company.findOne({
        $or: [
          { name: rfcCompany, isActive: true },
          { rfc: rfcCompany, isActive: true }
        ]
      });
      if (!company) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Razón social no encontrada o inactiva",
          });
      }
    }

    // Buscar proveedores por IDs si se proporcionan
    let providers = [];
    if (providerIds) {
      const providerIdArray = providerIds.split(',').map(id => id.trim());
      providers = await Provider.find({ _id: { $in: providerIdArray }, isActive: true });
      if (providers.length === 0) {
        return res.status(404).json({ success: false, message: "No se encontraron proveedores activos con los IDs proporcionados" });
      }
    }

    // Buscar proveedor por RFC si se proporciona
    let provider;
    if (rfcProvider) {
      provider = await Provider.findOne({ rfc: rfcProvider, isActive: true });
      if (!provider) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Proveedor no encontrado o inactivo",
          });
      }
    }

    // Construir filtro de búsqueda
    const filter = {
      estatus: 1, // Vigente
      fechaCancelacion: null,
    };

    if (company) {
      filter.rfcReceptor = company.rfc;
    }

    // Filtrar por proveedores (IDs o RFC)
    if (providers.length > 0) {
      const rfcProviders = providers.map(p => p.rfc);
      filter.rfcEmisor = { $in: rfcProviders };
    } else if (provider) {
      filter.rfcEmisor = provider.rfc;
    }

    // Filtros de fecha si se proporcionan
    if (startDate || endDate) {
      filter.fechaEmision = {};
      if (startDate) {
        filter.fechaEmision.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.fechaEmision.$lte = new Date(endDate);
      }
    }

    // Paginación y orden
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: order === "asc" ? 1 : -1 };

    console.log('Filtro final para la consulta:', filter); // LOG del filtro

    // Consulta principal
    const [facturas, total] = await Promise.all([
      ImportedInvoices.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      ImportedInvoices.countDocuments(filter),
    ]);

    console.log('facturas', facturas);

    res.json({
      success: true,
      data: facturas,
    });
  } catch (error) {
    console.error(
      "Error al obtener facturas por proveedor y razón social:",
      error
    );
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

// Resumen filtrado por proveedor y razón social (empresa)
export const getSummaryByProviderAndCompany = async (req, res) => {
  try {
    const {
      rfcProvider,
      rfcCompany,
      providerIds, // Nuevo parámetro para IDs de proveedores
      startDate,   // Nuevo parámetro para fecha de inicio
      endDate      // Nuevo parámetro para fecha de fin
    } = req.query;

    if (!rfcProvider && !rfcCompany && !providerIds) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un RFC de proveedor, empresa o IDs de proveedores para filtrar.'
      });
    }

    // Buscar compañía activa por nombre o RFC
    let company;
    if (rfcCompany) {
      // Intentar buscar por nombre primero, luego por RFC
      company = await Company.findOne({
        $or: [
          { name: rfcCompany, isActive: true },
          { rfc: rfcCompany, isActive: true }
        ]
      });
      if (!company) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Razón social no encontrada o inactiva",
          });
      }
    }

    // Buscar proveedores por IDs si se proporcionan
    let providers = [];
    if (providerIds) {
      const providerIdArray = providerIds.split(',').map(id => id.trim());
      providers = await Provider.find({ _id: { $in: providerIdArray }, isActive: true });
      if (providers.length === 0) {
        return res.status(404).json({ success: false, message: "No se encontraron proveedores activos con los IDs proporcionados" });
      }
    }

    // Buscar proveedor por RFC si se proporciona
    let provider;
    if (rfcProvider) {
      provider = await Provider.findOne({ rfc: rfcProvider, isActive: true });
      if (!provider) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Proveedor no encontrado o inactivo",
          });
      }
    }

    // Construir filtro de búsqueda
    const filter = {
      estatus: 1,
      fechaCancelacion: null,
    };

    if (company) {
      filter.rfcReceptor = company.rfc;
    }

    // Filtrar por proveedores (IDs o RFC)
    if (providers.length > 0) {
      const rfcProviders = providers.map(p => p.rfc);
      filter.rfcEmisor = { $in: rfcProviders };
    } else if (provider) {
      filter.rfcEmisor = provider.rfc;
    }

    // Filtros de fecha si se proporcionan
    if (startDate || endDate) {
      filter.fechaEmision = {};
      if (startDate) {
        filter.fechaEmision.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.fechaEmision.$lte = new Date(endDate);
      }
    }

    // Obtener facturas que cumplen el filtro
    const facturas = await ImportedInvoices.find(filter);

    // Calcular resumen
    const totalFacturas = facturas.length;
    const facturasCanceladas = facturas.filter((f) => f.estatus === 0).length;
    const facturasPendientes = facturas.filter(
      (f) => f.estadoPago === 0
    ).length;
    const facturasEnviadas = facturas.filter((f) => f.estadoPago === 1).length;
    const facturasPagadas = facturas.filter((f) => f.estadoPago === 2).length;
    const facturasRegistradas = facturas.filter(
      (f) => f.estadoPago === 3
    ).length;
    const totalImporteAPagar = facturas.reduce(
      (sum, f) => sum + (f.importeAPagar || 0),
      0
    );
    const totalPagado = facturas.reduce(
      (sum, f) => sum + (f.importePagado || 0),
      0
    );
    const totalSaldo = totalImporteAPagar - totalPagado;

    res.json({
      success: true,
      data: {
        totalFacturas,
        facturasCanceladas,
        facturasPendientes,
        facturasEnviadas,
        facturasPagadas,
        facturasRegistradas,
        totalImporteAPagar,
        totalPagado,
        totalSaldo,
      },
    });
  } catch (error) {
    console.error(
      "Error al obtener resumen de facturas por proveedor y razón social:",
      error
    );
    res
      .status(500)
      .json({ success: false, message: "Error interno del servidor" });
  }
};

// Actualizar factura como pagada completamente
export const markInvoiceAsFullyPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;

    // Buscar la factura
    const invoice = await ImportedInvoices.findById(id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Factura no encontrada" });
    }

    // Actualizar los campos correctamente
    invoice.descripcionPago = descripcion;
    invoice.pagado = 1;
    invoice.esCompleta = true;
    invoice.estadoPago = 2; // Pagado
    invoice.importePagado = invoice.importeAPagar;
    invoice.registrado = 1;
    invoice.fechaRevision = new Date();

    await invoice.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Factura actualizada correctamente",
        data: invoice,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markInvoiceAsPartiallyPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, monto } = req.body;

    if (!monto || monto <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "El monto debe ser mayor a 0" });
    }

    const invoice = await ImportedInvoices.findById(id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Factura no encontrada" });
    }

    // Calcular el nuevo importe pagado sumando al existente
    const nuevoImportePagado = (invoice.importePagado || 0) + monto;

    invoice.descripcionPago = descripcion;
    invoice.importePagado = nuevoImportePagado;
    invoice.fechaRevision = new Date();

    // Si el pago completo se alcanza, marcar como pendiente de autorización
    if (nuevoImportePagado >= invoice.importeAPagar) {
      invoice.importePagado = invoice.importeAPagar;
      invoice.estadoPago = null; // Pendiente de autorización
      invoice.esCompleta = false; // No está completamente pagada hasta que se autorice
      invoice.autorizada = false; // Pendiente de autorización
      invoice.estaRegistrada = true; // Marcar como registrada en paquete
    } else {
      // Si es pago parcial, también marcar como pendiente de autorización (como los pagos completos)
      invoice.estadoPago = null; // Pendiente de autorización
      invoice.esCompleta = false;
      invoice.autorizada = false; // Pendiente de autorización
      invoice.estaRegistrada = true; // Marcar como registrada en paquete
    }

    await invoice.save();

    res.status(200).json({
      success: true,
      message: nuevoImportePagado >= invoice.importeAPagar
        ? 'Pago completado. Pendiente de autorización.'
        : 'Pago parcial registrado. Pendiente de autorización.',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// TOGGLE - Cambiar el estado de 'autorizada' de una factura
export const toggleFacturaAutorizada = async (req, res) => {
  try {
    const { id } = req.params;
    const factura = await ImportedInvoices.findById(id);

    if (!factura) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada.' });
    }

    // Verificar que la factura esté registrada en un paquete
    if (!factura.estaRegistrada) {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden autorizar facturas que estén registradas en un paquete.'
      });
    }



    // Cambiar el estado de autorización
    factura.autorizada = !factura.autorizada;

    if (factura.autorizada) {
      // Si se está autorizando
      factura.estadoPago = 2; // Pagado
      factura.esCompleta = true;
      factura.pagado = 1;
      factura.pagoRechazado = false;
      factura.descripcionPago = 'Pago autorizado';
    } else {
      // Si se está rechazando la autorización
      factura.importePagado = 0;
      factura.estadoPago = 0; // Pendiente
      factura.esCompleta = false;
      factura.pagado = 0;
      factura.pagoRechazado = true;
      factura.estaRegistrada = true; // Mantener registrada en el paquete actual
      factura.descripcionPago = 'Pago rechazado - Factura no autorizada';
    }

    await factura.save();

    // Si se desautorizó la factura, actualizar los totales de los paquetes que la contengan
    if (!factura.autorizada) {
      await actualizarTotalesPaquetesPorFactura(factura._id);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: factura._id,
        autorizada: factura.autorizada,
        pagoRechazado: factura.pagoRechazado,
        importePagado: factura.importePagado,
        estadoPago: factura.estadoPago,
        esCompleta: factura.esCompleta
      },
      message: factura.autorizada
        ? 'Factura autorizada correctamente'
        : 'Factura rechazada. Los datos de pago se han reiniciado y puede ser pagada nuevamente en otro paquete.'
    });
  } catch (error) {
    console.error("Error toggling factura autorizada:", error);
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error interno del servidor.",
      });
  }
};

// Nuevo endpoint: actualizar importeAPagar de una factura
export const updateImporteAPagar = async (req, res) => {
  try {
    const { id } = req.params;
    const { importeAPagar, motivo, porcentaje } = req.body;
    if (!importeAPagar || importeAPagar <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "El importe a pagar debe ser mayor a 0",
        });
    }
    const invoice = await ImportedInvoices.findById(id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Factura no encontrada" });
    }
    invoice.importeAPagar = importeAPagar;
    invoice.motivoDescuento = motivo || "";
    invoice.descuento = porcentaje || 0;
    await invoice.save();
    res
      .status(200)
      .json({
        success: true,
        message: "Importe actualizado correctamente",
        data: invoice,
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Nueva función: Obtener una factura individual por ID
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el ID de la factura.",
      });
    }

    const invoice = await ImportedInvoices.findById(id)
      .populate("razonSocial", "name rfc")
      .lean({ getters: true });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada.",
      });
    }

    // Normalizar los datos numéricos
    const normalizedInvoice = {
      ...invoice,
      importeAPagar: invoice.importeAPagar
        ? parseFloat(invoice.importeAPagar.toString())
        : 0,
      importePagado: invoice.importePagado
        ? parseFloat(invoice.importePagado.toString())
        : 0,
    };

    res.status(200).json({
      success: true,
      data: normalizedInvoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
