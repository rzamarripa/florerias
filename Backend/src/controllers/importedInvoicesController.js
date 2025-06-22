import { ImportedInvoices } from "../models/ImportedInvoices.js";
import { Company } from "../models/Company.js";

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
          importe: parseFloat(String(invoice.Monto).replace(/[^0-9.-]+/g, "")) || 0,
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
      importe: invoice.importe ? parseFloat(invoice.importe.toString()) : 0,
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