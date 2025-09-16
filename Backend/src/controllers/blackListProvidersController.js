import { BlackListProviders } from "../models/BlackListProviders.js";
import XLSX from 'xlsx';

const parseDate = (dateString) => {
  if (
    !dateString ||
    !dateString.trim() ||
    dateString.trim() === "0000-00-00 00:00:00" ||
    dateString.trim().toLowerCase() === 'null' ||
    dateString.trim() === ''
  ) {
    return null;
  }
  
  // Handle Excel/Spanish date format like "01/01/2017 12:00:00 a. m."
  let cleanDateString = dateString.trim();
  
  // Remove time part if present (keep only the date part)
  if (cleanDateString.includes(' ')) {
    cleanDateString = cleanDateString.split(' ')[0];
  }
  
  // Try to parse the date
  const date = new Date(cleanDateString);
  
  // If still invalid, try different parsing approaches
  if (isNaN(date.getTime())) {
    // Try parsing as MM/dd/yyyy format
    const parts = cleanDateString.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1; // Month is 0-indexed
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      const parsedDate = new Date(year, month, day);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }
    return null;
  }
  
  return date;
};

export const bulkUpsertBlackListProviders = async (req, res) => {
  try {
    const { providers } = req.body;
    
    const providersArray = Array.isArray(req.body) ? req.body : providers;
    
    // Log para debug
    console.log('Backend - Datos recibidos:', {
      totalProviders: providersArray?.length,
      sampleProvider: providersArray?.[0]
    });
    
    if (!providersArray || !Array.isArray(providersArray)) {
      return res.status(400).json({
        success: false,
        message: "El cuerpo de la petición debe contener un arreglo de proveedores.",
      });
    }

    const operations = providersArray
      .map((provider) => {
        const providerData = {
          rfc: provider.RFC || provider.rfc,
          nombre: provider.Nombre || provider.nombre,
          situacion: provider.Situación || provider.situacion,
          numeroFechaOficioGlobalPresuncion: provider['Número y fecha de oficio global de presunción'] || provider.numeroFechaOficioGlobalPresuncion,
          publicacionPaginaSATPresuntos: parseDate(provider['Publicación página SAT presuntos'] || provider.publicacionPaginaSATPresuntos),
          publicacionDOFPresuntos: parseDate(provider['Publicación DOF presuntos'] || provider.publicacionDOFPresuntos),
          publicacionPaginaSATDesvirtuados: parseDate(provider['Publicación página SAT desvirtuados'] || provider.publicacionPaginaSATDesvirtuados),
          numeroFechaOficioGlobalDesvirtuados: provider['Número y fecha de oficio global de contribuyentes que desvirtuaron'] || provider.numeroFechaOficioGlobalDesvirtuados || null,
          publicacionDOFDesvirtuados: parseDate(provider['Publicación DOF desvirtuados'] || provider.publicacionDOFDesvirtuados),
          numeroFechaOficioGlobalDefinitivos: provider['Número y fecha de oficio global de definitivos'] || provider.numeroFechaOficioGlobalDefinitivos || null,
          publicacionPaginaSATDefinitivos: parseDate(provider['Publicación página SAT definitivos'] || provider.publicacionPaginaSATDefinitivos),
          publicacionDOFDefinitivos: parseDate(provider['Publicación DOF definitivos'] || provider.publicacionDOFDefinitivos)
        };

        // Log del primer proveedor procesado para debug
        if (provider === providersArray[0]) {
          console.log('Backend - Primer proveedor procesado:', providerData);
        }

        if (!providerData.rfc || !providerData.nombre) {
          return null;
        }

        return {
          updateOne: {
            filter: { rfc: providerData.rfc },
            update: { $set: providerData },
            upsert: true,
          },
        };
      })
      .filter((op) => op !== null);

    if (operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hay proveedores válidos para procesar.",
      });
    }

    const result = await BlackListProviders.bulkWrite(operations);

    res.status(201).json({
      success: true,
      message: `${result.upsertedCount + result.modifiedCount} proveedores procesados exitosamente.`,
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

export const getBlackListProviders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      rfc,
      nombre,
      situacion,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    let query = {};

    if (rfc) {
      query.rfc = { $regex: rfc.toUpperCase(), $options: 'i' };
    }

    if (nombre) {
      query.nombre = { $regex: nombre, $options: 'i' };
    }

    if (situacion) {
      query.situacion = { $regex: situacion, $options: 'i' };
    }

    const sortOptions = { [sortBy]: order === "asc" ? 1 : -1 };

    const providersPromise = BlackListProviders.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean()
      .exec();

    const countPromise = BlackListProviders.countDocuments(query);

    const [providers, count] = await Promise.all([
      providersPromise,
      countPromise,
    ]);

    res.status(200).json({
      success: true,
      data: providers,
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

export const getBlackListProvidersSummary = async (req, res) => {
  try {
    const [
      totalProviders,
      activeProviders,
      desvirtualizedProviders,
      definitiveProviders
    ] = await Promise.all([
      BlackListProviders.countDocuments({}),
      BlackListProviders.countDocuments({
        publicacionPaginaSATDesvirtuados: null,
        publicacionPaginaSATDefinitivos: null
      }),
      BlackListProviders.countDocuments({
        publicacionPaginaSATDesvirtuados: { $ne: null }
      }),
      BlackListProviders.countDocuments({
        publicacionPaginaSATDefinitivos: { $ne: null }
      })
    ]);

    const summaryData = {
      totalProviders,
      activeProviders,
      desvirtualizedProviders,
      definitiveProviders,
    };

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

export const getBlackListProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el ID del proveedor.",
      });
    }

    const provider = await BlackListProviders.findById(id).lean();

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Proveedor no encontrado.",
      });
    }

    res.status(200).json({
      success: true,
      data: provider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const checkProviderInBlackList = async (req, res) => {
  try {
    const { rfc } = req.params;

    if (!rfc) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el RFC del proveedor.",
      });
    }

    // Verificar si el proveedor está en lista negra con situación "definitivo"
    const provider = await BlackListProviders.findOne({ 
      rfc: rfc.toUpperCase(),
      situacion: { $regex: /definitivo/i }
    });

    res.status(200).json({
      success: true,
      data: {
        inBlackList: !!provider,
        provider: provider || null
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};