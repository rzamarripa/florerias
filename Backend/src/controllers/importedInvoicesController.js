import { ImportedInvoices } from "../models/ImportedInvoices.js";
import { Company } from "../models/Company.js";
import { Provider } from "../models/Provider.js";

const parseDate = (dateString) => {
  if (!dateString || !dateString.trim() || dateString.trim() === '0000-00-00 00:00:00') {
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
        message: 'El cuerpo de la petición debe ser un arreglo de facturas.'
      });
    }

    const rfcReceptores = [...new Set(invoices.map(inv => inv.RfcReceptor.toUpperCase()))];
    const companies = await Company.find({ rfc: { $in: rfcReceptores } });

    const companyMap = new Map(companies.map(comp => [comp.rfc.toUpperCase(), comp._id]));

    const operations = invoices
      .map(invoice => {
        const rfcReceptor = invoice.RfcReceptor.toUpperCase();
        const companyId = companyMap.get(rfcReceptor);

        if (!companyId) {
          return null;
        }

        const invoiceData = {
          folioFiscalId: invoice.Uuid,
          rfcEmisor: invoice.RfcEmisor,
          nombreEmisor: invoice.NombreEmisor,
          rfcReceptor: invoice.RfcReceptor,
          nombreReceptor: invoice.NombreReceptor,
          rfcProveedorCertificacion: invoice.RfcPac,
          fechaEmision: parseDate(invoice.FechaEmision),
          fechaCertificacionSAT: parseDate(invoice.FechaCertificacionSat),
          importeAPagar: parseFloat(String(invoice.Monto).replace(/[^0-9.-]+/g, "")) || 0,
          tipoComprobante: invoice.EfectoComprobante,
          estatus: parseInt(invoice.Estatus, 10),
          fechaCancelacion: parseDate(invoice.FechaCancelacion),
          razonSocial: companyId,
        };

        if (!invoiceData.folioFiscalId) {
          return null;
        }

        return {
          updateOne: {
            filter: { folioFiscalId: invoiceData.folioFiscalId },
            update: { $set: invoiceData },
            upsert: true,
          },
        };
      })
      .filter(op => op !== null);

    if (operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay facturas válidas para procesar.'
      });
    }

    const result = await ImportedInvoices.bulkWrite(operations);

    res.status(201).json({
      success: true,
      message: `${result.upsertedCount + result.modifiedCount} facturas procesadas exitosamente.`,
      data: {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
      }
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
    const { page = 1, limit = 15, rfcReceptor, estatus, sortBy = 'fechaEmision', order = 'desc' } = req.query;

    if (!rfcReceptor) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un RFC del receptor.'
      });
    }

    const query = { rfcReceptor: rfcReceptor.toUpperCase() };
    if (estatus && ['0', '1'].includes(estatus)) {
      query.estatus = parseInt(estatus, 10);
    }

    const sortOptions = { [sortBy]: order === 'asc' ? 1 : -1 };

    const invoicesPromise = ImportedInvoices.find(query)
      .populate('razonSocial', 'name rfc')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean({ getters: true })
      .exec();

    const countPromise = ImportedInvoices.countDocuments(query);

    const [invoicesFromDb, count] = await Promise.all([invoicesPromise, countPromise]);

    const invoices = invoicesFromDb.map(invoice => ({
      ...invoice,
      importeAPagar: invoice.importeAPagar ? parseFloat(invoice.importeAPagar.toString()) : 0,
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
        message: 'Se requiere un RFC del receptor.'
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
      estatus,
      estadoPago,
      sortBy = 'fechaEmision',
      order = 'desc'
    } = req.query;

    // Validar que se proporcione al menos uno de los RFCs
    if (!rfcProvider && !rfcCompany) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un RFC de proveedor o empresa para filtrar.'
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

    // Filtros adicionales
    if (estatus && ['0', '1'].includes(estatus)) {
      query.estatus = parseInt(estatus, 10);
    }

    if (estadoPago && ['0', '1', '2', '3'].includes(estadoPago)) {
      query.estadoPago = parseInt(estadoPago, 10);
    }

    // Opciones de ordenamiento
    const sortOptions = { [sortBy]: order === 'asc' ? 1 : -1 };

    // Consulta con paginación
    const invoicesPromise = ImportedInvoices.find(query)
      .populate('razonSocial', 'name rfc')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean({ getters: true })
      .exec();

    const countPromise = ImportedInvoices.countDocuments(query);

    const [invoicesFromDb, count] = await Promise.all([invoicesPromise, countPromise]);

    // Procesar las facturas para asegurar que los campos decimales se conviertan correctamente
    const invoices = invoicesFromDb.map(invoice => ({
      ...invoice,
      importeAPagar: invoice.importeAPagar ? parseFloat(invoice.importeAPagar.toString()) : 0,
      importePagado: invoice.importePagado ? parseFloat(invoice.importePagado.toString()) : 0,
    }));

    // Obtener información adicional de proveedores y empresas si se solicitó
    let additionalInfo = {};

    if (rfcProvider) {
      const provider = await Provider.findOne({ rfc: rfcProvider.toUpperCase() });
      if (provider) {
        additionalInfo.provider = {
          name: provider.name,
          rfc: provider.rfc,
          email: provider.email
        };
      }
    }

    if (rfcCompany) {
      const company = await Company.findOne({ rfc: rfcCompany.toUpperCase() });
      if (company) {
        additionalInfo.company = {
          name: company.name,
          rfc: company.rfc
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
    console.error('Error getting invoices by provider and company:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor.',
    });
  }
};

// Función adicional: Obtener resumen de facturas por proveedor y empresa
export const getInvoicesSummaryByProviderAndCompany = async (req, res) => {
  try {
    const { rfcProvider, rfcCompany } = req.query;

    // Validar que se proporcione al menos uno de los RFCs
    if (!rfcProvider && !rfcCompany) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un RFC de proveedor o empresa para filtrar.'
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

    // Obtener estadísticas
    const [
      totalFacturas,
      facturasCanceladas,
      facturasPendientes,
      facturasEnviadas,
      facturasPagadas,
      facturasRegistradas,
      totalImporteAPagar,
      totalPagado
    ] = await Promise.all([
      ImportedInvoices.countDocuments(query),
      ImportedInvoices.countDocuments({ ...query, estatus: 0 }),
      ImportedInvoices.countDocuments({ ...query, estadoPago: 0 }),
      ImportedInvoices.countDocuments({ ...query, estadoPago: 1 }),
      ImportedInvoices.countDocuments({ ...query, estadoPago: 2 }),
      ImportedInvoices.countDocuments({ ...query, estadoPago: 3 }),
      ImportedInvoices.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$importeAPagar' } } }
      ]),
      ImportedInvoices.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$importePagado' } } }
      ])
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
      totalSaldo: (totalImporteAPagar[0]?.total || 0) - (totalPagado[0]?.total || 0)
    };

    res.status(200).json({
      success: true,
      data: summaryData,
    });

  } catch (error) {
    console.error('Error getting invoices summary by provider and company:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor.',
    });
  }
};

// Obtener facturas filtradas por proveedor y razón social (empresa)
export const getByProviderAndCompany = async (req, res) => {
  try {
    const { rfcProvider, rfcCompany, page = 1, limit = 15, sortBy = "fechaEmision", order = "desc" } = req.query;

    if (!rfcProvider && !rfcCompany) {
      return res.status(400).json({ success: false, message: "Se requiere al menos rfcProvider o rfcCompany" });
    }

    // Buscar compañía activa
    let company;
    if (rfcCompany) {
      company = await Company.findOne({ rfc: rfcCompany, isActive: true });
      if (!company) {
        return res.status(404).json({ success: false, message: "Razón social no encontrada o inactiva" });
      }
    }

    // Buscar proveedor activo
    let provider;
    if (rfcProvider) {
      provider = await Provider.findOne({ rfc: rfcProvider, isActive: true });
      if (!provider) {
        return res.status(404).json({ success: false, message: "Proveedor no encontrado o inactivo" });
      }
    }

    // Construir filtro de búsqueda
    const filter = {
      estatus: 1, // Vigente
      fechaCancelacion: null
    };

    if (company) {
      filter.razonSocial = company._id;
      filter.rfcReceptor = company.rfc;
    }
    if (provider) {
      filter.rfcEmisor = provider.rfc;
    }

    // Paginación y orden
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: order === "asc" ? 1 : -1 };

    // Consulta principal
    const [facturas, total] = await Promise.all([
      ImportedInvoices.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      ImportedInvoices.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: facturas
    });
  } catch (error) {
    console.error("Error al obtener facturas por proveedor y razón social:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
};

// Resumen filtrado por proveedor y razón social (empresa)
export const getSummaryByProviderAndCompany = async (req, res) => {
  try {
    const { rfcProvider, rfcCompany } = req.query;

    if (!rfcProvider && !rfcCompany) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un RFC de proveedor o empresa para filtrar.'
      });
    }

    // Buscar compañía activa
    let company;
    if (rfcCompany) {
      company = await Company.findOne({ rfc: rfcCompany, isActive: true });
      if (!company) {
        return res.status(404).json({ success: false, message: "Razón social no encontrada o inactiva" });
      }
    }

    // Buscar proveedor activo
    let provider;
    if (rfcProvider) {
      provider = await Provider.findOne({ rfc: rfcProvider, isActive: true });
      if (!provider) {
        return res.status(404).json({ success: false, message: "Proveedor no encontrado o inactivo" });
      }
    }

    // Construir filtro de búsqueda
    const filter = {
      estatus: 1,
      fechaCancelacion: null
    };

    if (company) {
      filter.razonSocial = company._id;
      filter.rfcReceptor = company.rfc;
    }
    if (provider) {
      filter.rfcEmisor = provider.rfc;
    }

    // Obtener facturas que cumplen el filtro
    const facturas = await ImportedInvoices.find(filter);

    // Calcular resumen
    const totalFacturas = facturas.length;
    const facturasCanceladas = facturas.filter(f => f.estatus === 0).length;
    const facturasPendientes = facturas.filter(f => f.estadoPago === 0).length;
    const facturasEnviadas = facturas.filter(f => f.estadoPago === 1).length;
    const facturasPagadas = facturas.filter(f => f.estadoPago === 2).length;
    const facturasRegistradas = facturas.filter(f => f.estadoPago === 3).length;
    const totalImporteAPagar = facturas.reduce((sum, f) => sum + (f.importeAPagar || 0), 0);
    const totalPagado = facturas.reduce((sum, f) => sum + (f.importePagado || 0), 0);
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
        totalSaldo
      }
    });
  } catch (error) {
    console.error("Error al obtener resumen de facturas por proveedor y razón social:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
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
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
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

    res.status(200).json({ success: true, message: 'Factura actualizada correctamente', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markInvoiceAsPartiallyPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, monto } = req.body;

    if (!monto || monto <= 0) {
      return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
    }

    const invoice = await ImportedInvoices.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }

    invoice.descripcionPago = descripcion;
    invoice.importePagado = (invoice.importePagado || 0) + monto;
    invoice.fechaRevision = new Date();

    if (invoice.importePagado >= invoice.importeAPagar) {
      invoice.importePagado = invoice.importeAPagar;
      invoice.estadoPago = 2; // Pagado
      invoice.esCompleta = true;
    } else {
      invoice.estadoPago = 1; // Enviado a pago (parcial)
      invoice.esCompleta = false;
    }

    await invoice.save();

    res.status(200).json({ success: true, message: 'Pago parcial registrado correctamente', data: invoice });
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

        factura.autorizada = !factura.autorizada;
        await factura.save();

        res.status(200).json({
            success: true,
            data: { _id: factura._id, autorizada: factura.autorizada },
            message: 'Estado de autorización actualizado correctamente'
        });
    } catch (error) {
        console.error('Error toggling factura autorizada:', error);
        res.status(500).json({ success: false, message: error.message || 'Error interno del servidor.' });
    }
};

// Nuevo endpoint: actualizar importeAPagar de una factura
export const updateImporteAPagar = async (req, res) => {
  try {
    const { id } = req.params;
    const { importeAPagar, motivo, porcentaje } = req.body;
    if (!importeAPagar || importeAPagar <= 0) {
      return res.status(400).json({ success: false, message: 'El importe a pagar debe ser mayor a 0' });
    }
    const invoice = await ImportedInvoices.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }
    invoice.importeAPagar = importeAPagar;
    invoice.motivoDescuento = motivo || '';
    invoice.descuento = porcentaje || 0;
    await invoice.save();
    res.status(200).json({ success: true, message: 'Importe actualizado correctamente', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 