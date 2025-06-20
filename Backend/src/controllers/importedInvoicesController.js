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
        message: 'Request body must be an array of invoices.'
      });
    }

    // 1. Find all relevant companies in one go
    const receiverRfcs = [...new Set(invoices.map(inv => inv.RfcReceptor.toUpperCase()))];
    const companies = await Company.find({ rfc: { $in: receiverRfcs } });
    
    // 2. Create a map for quick lookup
    const companyMap = new Map(companies.map(comp => [comp.rfc.toUpperCase(), comp._id]));

    const operations = invoices
      .map(invoice => {
        const receiverRfc = invoice.RfcReceptor.toUpperCase();
        const companyId = companyMap.get(receiverRfc);

        // 3. Skip invoice if its company doesn't exist in the DB
        if (!companyId) {
          return null; 
        }

        const invoiceData = {
          fiscalFolioId: invoice.Uuid,
          issuerTaxId: invoice.RfcEmisor,
          issuerName: invoice.NombreEmisor,
          receiverTaxId: invoice.RfcReceptor,
          certificationProviderId: invoice.RfcPac,
          issuanceDate: parseDate(invoice.FechaEmision),
          taxAuthorityCertificationDate: parseDate(invoice.FechaCertificacionSat),
          amount: parseFloat(String(invoice.Monto).replace(/[^0-9.-]+/g,"")) || 0,
          voucherType: invoice.EfectoComprobante,
          status: parseInt(invoice.Estatus, 10),
          cancellationDate: parseDate(invoice.FechaCancelacion),
          company: companyId, // 4. Assign the company ObjectId
        };
        
        if (!invoiceData.fiscalFolioId) {
          return null;
        }
        
        return {
          updateOne: {
            filter: { fiscalFolioId: invoiceData.fiscalFolioId },
            update: { $set: invoiceData },
            upsert: true,
          },
        };
      })
      .filter(op => op !== null);

    if (operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid invoices to process.'
      });
    }

    const result = await ImportedInvoices.bulkWrite(operations);

    res.status(201).json({
      success: true,
      message: `${result.upsertedCount + result.modifiedCount} invoices processed successfully.`,
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
    const { page = 1, limit = 15, receiverTaxId, status, sortBy = 'issuanceDate', order = 'desc' } = req.query;

    if (!receiverTaxId) {
      return res.status(400).json({
        success: false,
        message: 'A receiverTaxId is required.'
      });
    }

    const query = { receiverTaxId: receiverTaxId.toUpperCase() };
    if (status && ['0', '1'].includes(status)) {
      query.status = parseInt(status, 10);
    }

    const sortOptions = { [sortBy]: order === 'asc' ? 1 : -1 };
      
    const invoicesPromise = ImportedInvoices.find(query)
      .populate('company', 'name rfc') // Populate company data
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean({ getters: true }) // Use getters to apply schema transforms
      .exec();

    const countPromise = ImportedInvoices.countDocuments(query);

    const [invoicesFromDb, count] = await Promise.all([invoicesPromise, countPromise]);

    // Manually convert Decimal128 to float for each invoice
    const invoices = invoicesFromDb.map(invoice => ({
      ...invoice,
      amount: invoice.amount ? parseFloat(invoice.amount.toString()) : 0,
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
    const { receiverTaxId } = req.query;

    if (!receiverTaxId) {
      return res.status(400).json({
        success: false,
        message: 'A receiverTaxId is required.'
      });
    }

    const summaryData = await ImportedInvoices.getSummary(receiverTaxId);

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