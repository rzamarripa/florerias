import { InvoicesPackage } from "../models/InvoicesPackpage.js";
import { ImportedInvoices } from "../models/ImportedInvoices.js";
import { InvoicesPackageCompany } from "../models/InvoicesPackpageCompany.js";
import { ExpenseConcept } from "../models/ExpenseConcept.js";
import { RoleVisibility } from "../models/RoleVisibility.js";
import { CashPayment } from "../models/CashPayment.js";
import { Budget } from "../models/Budget.js";
import { Brand } from "../models/Brand.js";
import { Company } from "../models/Company.js";
import timelineService from "../services/timelineService.js";

import mongoose from "mongoose";

// CREATE - Crear un nuevo paquete de facturas
export const createInvoicesPackage = async (req, res) => {
  try {
    const {
      facturas,
      usuario_id,
      departamento_id,
      departamento,
      comentario,
      fechaPago,
      totalImporteAPagar,
      // Nuevos campos para la relación con Company, Brand, Branch
      companyId,
      brandId,
      branchId,
      // Nuevo campo para conceptos de gasto por factura
      conceptosGasto,
      pagosEfectivo,
      // Nuevo campo para montos específicos por factura (pagos parciales separados)
      montosEspecificos,
    } = req.body;

    // Validar datos requeridos - debe haber al menos facturas o pagos en efectivo
    const tieneFacturas =
      facturas && Array.isArray(facturas) && facturas.length > 0;
    const tienePagosEfectivo =
      pagosEfectivo && Array.isArray(pagosEfectivo) && pagosEfectivo.length > 0;

    if (!tieneFacturas && !tienePagosEfectivo) {
      return res.status(400).json({
        success: false,
        message:
          "Se requiere al menos una factura o un pago en efectivo para crear el paquete.",
      });
    }

    if (!usuario_id || !departamento_id || !departamento || !fechaPago) {
      return res.status(400).json({
        success: false,
        message:
          "Faltan datos requeridos: usuario_id, departamento_id, departamento, fechaPago.",
      });
    }

    // Verificar que las facturas existan y pertenezcan al mismo receptor (solo si hay facturas)
    let facturasExistentes = [];
    if (tieneFacturas) {
      facturasExistentes = await ImportedInvoices.find({
        _id: { $in: facturas },
      }).populate("razonSocial");

      if (facturasExistentes.length !== facturas.length) {
        return res.status(400).json({
          success: false,
          message: "Una o más facturas no existen.",
        });
      }

      // Verificar que todas las facturas pertenezcan al mismo receptor
      const rfcReceptor = facturasExistentes[0].rfcReceptor;
      const facturasConReceptorDiferente = facturasExistentes.filter(
        (factura) => factura.rfcReceptor !== rfcReceptor
      );

      if (facturasConReceptorDiferente.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Todas las facturas deben pertenecer al mismo receptor.",
        });
      }

      // Verificar que no haya facturas duplicadas en el mismo paquete
      const facturasDuplicadas = facturas.filter(
        (facturaId, index) => facturas.indexOf(facturaId) !== index
      );

      if (facturasDuplicadas.length > 0) {
        return res.status(400).json({
          success: false,
          message: "No se pueden agregar facturas duplicadas al mismo paquete.",
        });
      }

      // Actualizar las facturas agregadas al paquete con el nuevo estado
      await ImportedInvoices.updateMany(
        { _id: { $in: facturas } },
        {
          $set: {
            autorizada: null, // Pendiente de autorización
            pagoRechazado: false, // No rechazado inicialmente
            estaRegistrada: true, // Marcar como registrada en paquete
            estadoPago: 0, // Pendiente de autorización
            esCompleta: false, // No está completamente pagada hasta que se autorice
            registrado: 1, // Registrado
            fechaRevision: new Date(),
          },
        }
      );
    }

    // Obtener el siguiente folio
    const siguienteFolio = await InvoicesPackage.obtenerSiguienteFolio();

    // Convertir usuario_id a ObjectId
    const usuarioObjectId = new mongoose.Types.ObjectId(usuario_id);

    // La fechaPago ya viene calculada desde el frontend como el jueves de la semana siguiente
    // Ajustar la hora a las 12:00 UTC para evitar desfases de zona horaria
    const fechaPagoParaGuardar = new Date(fechaPago);
    fechaPagoParaGuardar.setUTCHours(12, 0, 0, 0);

    // Obtener todos los conceptos de gasto involucrados
    let conceptosGastoMap = {};
    if (conceptosGasto && Object.keys(conceptosGasto).length > 0) {
      const conceptosIds = Object.values(conceptosGasto).map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      const conceptosDocs = await ExpenseConcept.find({
        _id: { $in: conceptosIds },
      });
      conceptosGastoMap = conceptosDocs.reduce((acc, concepto) => {
        acc[concepto._id.toString()] = {
          id: concepto._id,
          name: concepto.name,
          descripcion: concepto.description,
        };
        return acc;
      }, {});
    }

    // Preparar las facturas embebidas con todos sus datos (solo si hay facturas)
    let facturasEmbebidas = [];
    if (tieneFacturas) {
      facturasEmbebidas = facturasExistentes.map((factura) => {
        const facturaData = factura.toObject();
        // Asegurar que el _id esté presente
        facturaData._id = factura._id;
        
        // NUEVA LÓGICA: Usar monto específico si se proporciona
        const facturaIdStr = factura._id.toString();
        const montoEspecificoEstesPago = montosEspecificos && montosEspecificos[facturaIdStr] 
          ? parseFloat(montosEspecificos[facturaIdStr]) 
          : facturaData.importePagado || 0;
          
        facturaData.importePagado = montoEspecificoEstesPago;

        // FORZAR que autorizada sea null (pendiente) al crear el paquete
        facturaData.autorizada = null;
        facturaData.estadoPago = 0;
        facturaData.esCompleta = montoEspecificoEstesPago >= facturaData.importeAPagar;
        facturaData.pagoRechazado = false;
        facturaData.estaRegistrada = true;
        facturaData.registrado = 1;
        facturaData.fechaRevision = new Date();

        // Asignar concepto de gasto si se proporciona para esta factura
        if (conceptosGasto && conceptosGasto[facturaIdStr]) {
          const conceptoId = conceptosGasto[facturaIdStr];
          if (conceptosGastoMap[conceptoId]) {
            facturaData.conceptoGasto = conceptosGastoMap[conceptoId];
          }
        }

        // Asegurar que razonSocial tenga la estructura correcta
        if (
          facturaData.razonSocial &&
          typeof facturaData.razonSocial === "object" &&
          facturaData.razonSocial._id
        ) {
          facturaData.razonSocial = {
            _id: facturaData.razonSocial._id,
            name: facturaData.razonSocial.name || "",
            rfc: facturaData.razonSocial.rfc || "",
          };
        }

        return facturaData;
      });
    }

    // Preparar los pagos en efectivo embebidos con todos sus datos
    let pagosEfectivoEmbebidos = [];
    if (Array.isArray(pagosEfectivo) && pagosEfectivo.length > 0) {
      pagosEfectivoEmbebidos = [];
      for (const pago of pagosEfectivo) {
        // Si el pago ya existe (tiene _id y no es temporal), lo buscamos, si no, lo creamos
        let pagoDoc;
        if (
          pago._id &&
          typeof pago._id === "string" &&
          !pago._id.startsWith("temp_")
        ) {
          pagoDoc = await CashPayment.findById(pago._id);
        } else {
          pagoDoc = await CashPayment.create({
            importeAPagar: pago.importeAPagar,
            expenseConcept: pago.expenseConcept,
            description: pago.description,
            importePagado: pago.importeAPagar, // Guardar como importeAPagar al crear
          });
        }
        if (!pagoDoc) continue;
        // Embebe todos los campos relevantes (igual que una factura)
        const pagoData = pagoDoc.toObject();
        // Forzar campos de estado iniciales
        pagoData.autorizada = null;
        pagoData.estadoPago = 0;
        pagoData.esCompleta = false;
        pagoData.pagoRechazado = false;
        pagoData.registrado = 0;
        pagoData.pagado = 0;
        pagoData.descripcionPago = "";
        pagoData.fechaRevision = new Date();
        pagoData.importePagado = pagoData.importeAPagar; // SIEMPRE igual al crear
        pagosEfectivoEmbebidos.push(pagoData);
      }
    }

    // Crear el paquete con las facturas y pagos en efectivo embebidos
    const nuevoPaquete = new InvoicesPackage({
      facturas: facturasEmbebidas,
      pagosEfectivo: pagosEfectivoEmbebidos,
      usuario_id: usuarioObjectId,
      departamento_id,
      departamento,
      comentario,
      fechaPago: fechaPagoParaGuardar,
      totalImporteAPagar: 0, // Se calculará automáticamente en actualizarTotales()
      folio: siguienteFolio,
      // createdAt se establecerá automáticamente con la fecha actual
    });

    // Calcular totales automáticamente
    await nuevoPaquete.actualizarTotales();

    // Guardar el paquete
    const paqueteGuardado = await nuevoPaquete.save();

    // Crear la relación con Company, Brand, Branch si se proporcionan
    let packageCompanyId = null;
    if (companyId) {
      const packageCompanyData = {
        packageId: paqueteGuardado._id,
        companyId: new mongoose.Types.ObjectId(companyId),
      };

      // Agregar brandId si se proporciona
      if (brandId) {
        packageCompanyData.brandId = new mongoose.Types.ObjectId(brandId);
      }

      // Agregar branchId si se proporciona
      if (branchId) {
        packageCompanyData.branchId = new mongoose.Types.ObjectId(branchId);
      }

      const packageCompany = new InvoicesPackageCompany(packageCompanyData);
      const packageCompanyGuardado = await packageCompany.save();
      packageCompanyId = packageCompanyGuardado._id;

      // Actualizar el paquete con la referencia a la relación
      paqueteGuardado.packageCompanyId = packageCompanyId;
      await paqueteGuardado.save();
    }

    // Registrar la creación del paquete en el timeline (estatus borrador)
    await timelineService.registerStatusChange(
      req.user._id, // userId del usuario autenticado
      paqueteGuardado._id, // packageId
      "borrador" // estatus inicial
    );

    // Obtener el paquete con las facturas embebidas
    const paqueteCompleto = await InvoicesPackage.findById(
      paqueteGuardado._id
    )
      .populate({
        path: "packageCompanyId",
        populate: ["companyId", "brandId", "branchId"],
      })
      .populate({
        path: "pagosEfectivo.expenseConcept",
        select: "name description",
        populate: {
          path: "categoryId",
          select: "name",
        },
      });

    res.status(201).json({
      success: true,
      message: "Paquete de facturas creado exitosamente.",
      data: paqueteCompleto,
    });
  } catch (error) {
    console.error("Error creating invoices package:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// READ - Obtener todos los paquetes con paginación
export const getInvoicesPackages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      estatus,
      usuario_id,
      departamento_id,
      sortBy = "fechaCreacion",
      order = "desc",
    } = req.query;

    // Construir filtros
    const filtros = {};
    if (estatus) filtros.estatus = estatus;
    if (usuario_id)
      filtros.usuario_id = new mongoose.Types.ObjectId(usuario_id);
    if (departamento_id) filtros.departamento_id = parseInt(departamento_id);

    // Opciones de ordenamiento
    const sortOptions = { [sortBy]: order === "asc" ? 1 : -1 };

    // Consulta con paginación
    const paquetesPromise = InvoicesPackage.find(filtros)
      .populate({
        path: "packageCompanyId",
        populate: ["companyId", "brandId", "branchId"],
      })
      .populate({
        path: "pagosEfectivo.expenseConcept",
        select: "name description",
        populate: {
          path: "categoryId",
          select: "name",
        },
      })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean({ getters: true });

    const countPromise = InvoicesPackage.countDocuments(filtros);

    const [paquetes, count] = await Promise.all([
      paquetesPromise,
      countPromise,
    ]);

    res.status(200).json({
      success: true,
      data: paquetes,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error("Error getting invoices packages:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// READ - Obtener un paquete específico por ID
export const getInvoicesPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Buscando paquete con ID:", id);

    const paquete = await InvoicesPackage.findById(id)
      .populate({
        path: "packageCompanyId",
        populate: ["companyId", "brandId", "branchId"],
      })
      .populate({
        path: "pagosEfectivo.expenseConcept",
        select: "name description",
        populate: {
          path: "categoryId",
          select: "name",
        },
      });

    if (!paquete) {
      return res.status(404).json({
        success: false,
        message: "Paquete de facturas no encontrado.",
      });
    }

    // Normalización de datos para el frontend
    function normalizeFactura(f) {
      const toNumber = (v) =>
        typeof v === "object" && v !== null && v._bsontype === "Decimal128"
          ? parseFloat(v.toString())
          : v;
      const toString = (v) =>
        typeof v === "object" && v !== null && v._bsontype === "ObjectId"
          ? v.toString()
          : v;

      // Normalizar razonSocial - puede ser un ObjectId o un objeto populado
      let razonSocialNormalizada;
      if (
        f.razonSocial &&
        typeof f.razonSocial === "object" &&
        f.razonSocial._id
      ) {
        // Si está populado, mantener la estructura
        razonSocialNormalizada = {
          _id: toString(f.razonSocial._id),
          name: f.razonSocial.name || "",
          rfc: f.razonSocial.rfc || "",
        };
      } else {
        // Si es solo un ObjectId, crear estructura básica
        razonSocialNormalizada = {
          _id: toString(f.razonSocial),
          name: "",
          rfc: "",
        };
      }

      return {
        ...f._doc,
        _id: toString(f._id),
        importeAPagar: toNumber(f.importeAPagar),
        importePagado: toNumber(f.importePagado),
        razonSocial: razonSocialNormalizada,
        fechaEmision: f.fechaEmision
          ? new Date(f.fechaEmision).toISOString()
          : null,
        fechaCertificacionSAT: f.fechaCertificacionSAT
          ? new Date(f.fechaCertificacionSAT).toISOString()
          : null,
        fechaCancelacion: f.fechaCancelacion
          ? new Date(f.fechaCancelacion).toISOString()
          : null,
        fechaRevision: f.fechaRevision
          ? new Date(f.fechaRevision).toISOString()
          : null,
      };
    }

    function normalizePackage(paquete) {
      const toNumber = (v) =>
        typeof v === "object" && v !== null && v._bsontype === "Decimal128"
          ? parseFloat(v.toString())
          : v;
      const toString = (v) =>
        typeof v === "object" && v !== null && v._bsontype === "ObjectId"
          ? v.toString()
          : v;
      return {
        ...paquete._doc,
        _id: toString(paquete._id),
        usuario_id: toString(paquete.usuario_id),
        departamento_id: toString(paquete.departamento_id),
        packageCompanyId: paquete.packageCompanyId
          ? toString(paquete.packageCompanyId._id)
          : null,
        totalImporteAPagar: toNumber(paquete.totalImporteAPagar),
        totalPagado: toNumber(paquete.totalPagado),
        fechaPago: paquete.fechaPago
          ? new Date(paquete.fechaPago).toISOString()
          : null,
        fechaCreacion: paquete.fechaCreacion
          ? new Date(paquete.fechaCreacion).toISOString()
          : null,
        createdAt: paquete.createdAt
          ? new Date(paquete.createdAt).toISOString()
          : null,
        updatedAt: paquete.updatedAt
          ? new Date(paquete.updatedAt).toISOString()
          : null,
        facturas: (paquete.facturas || []).map(normalizeFactura),
        // Agregar información de la relación Company, Brand, Branch
        companyInfo: paquete.packageCompanyId
          ? {
              companyId: paquete.packageCompanyId.companyId
                ? toString(paquete.packageCompanyId.companyId._id)
                : null,
              companyName: paquete.packageCompanyId.companyId
                ? paquete.packageCompanyId.companyId.name
                : null,
              brandId: paquete.packageCompanyId.brandId
                ? toString(paquete.packageCompanyId.brandId._id)
                : null,
              brandName: paquete.packageCompanyId.brandId
                ? paquete.packageCompanyId.brandId.name
                : null,
              branchId: paquete.packageCompanyId.branchId
                ? toString(paquete.packageCompanyId.branchId._id)
                : null,
              branchName: paquete.packageCompanyId.branchId
                ? paquete.packageCompanyId.branchId.name
                : null,
            }
          : null,
      };
    }

    res.status(200).json({
      success: true,
      data: normalizePackage(paquete),
      message: "Paquete de facturas encontrado exitosamente.",
    });
  } catch (error) {
    console.error("Error getting invoices package by id:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// UPDATE - Actualizar un paquete de facturas
export const updateInvoicesPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      facturas,
      estatus,
      departamento_id,
      departamento,
      comentario,
      fechaPago,
      totalImporteAPagar,
      // Nuevos campos para la relación con Company, Brand, Branch
      companyId,
      brandId,
      branchId,
      // Nuevo campo para conceptos de gasto por factura
      conceptosGasto,
      // Nuevo campo para pagos en efectivo
      pagosEfectivo,
      // Nuevo campo para montos específicos por factura (pagos parciales separados)
      montosEspecificos,
    } = req.body;

    // Buscar el paquete existente
    const paqueteExistente = await InvoicesPackage.findById(id);
    if (!paqueteExistente) {
      return res.status(404).json({
        success: false,
        message: "Paquete de facturas no encontrado.",
      });
    }

    // Si se están actualizando las facturas, validar
    let facturasExistentes = [];
    if (facturas && Array.isArray(facturas)) {
      if (facturas.length === 0) {
        return res.status(400).json({
          success: false,
          message: "El paquete debe contener al menos una factura.",
        });
      }

      // Verificar que las nuevas facturas existan
      facturasExistentes = await ImportedInvoices.find({
        _id: { $in: facturas },
      }).populate("razonSocial");

      if (facturasExistentes.length !== facturas.length) {
        return res.status(400).json({
          success: false,
          message: "Una o más facturas no existen.",
        });
      }

      // Verificar que no haya facturas duplicadas en el mismo paquete
      const facturasDuplicadas = facturas.filter(
        (facturaId, index) => facturas.indexOf(facturaId) !== index
      );

      if (facturasDuplicadas.length > 0) {
        return res.status(400).json({
          success: false,
          message: "No se pueden agregar facturas duplicadas al mismo paquete.",
        });
      }

      // Identificar facturas que se están agregando al paquete (nuevas)
      const facturasActualesIds = paqueteExistente.facturas.map((f) =>
        f._id.toString()
      );
      const facturasNuevas = facturas.filter(
        (facturaId) => !facturasActualesIds.includes(facturaId.toString())
      );

      // NUEVA LÓGICA: Permitir pagos parciales separados para la misma factura en diferentes paquetes
      // Solo validar duplicados exactos dentro del MISMO paquete
      const facturasYaEnPaqueteConMismoImporte = facturas.filter((facturaId) => {
        const facturaIdStr = facturaId.toString();
        const yaEstaEnPaquete = facturasActualesIds.includes(facturaIdStr);
        
        if (!yaEstaEnPaquete) return false;

        // Para pagos parciales en DIFERENTES paquetes: SIEMPRE permitir
        // Solo verificar duplicados exactos en el MISMO paquete
        const facturaEnPaquete = paqueteExistente.facturas.find(
          (f) => f._id.toString() === facturaIdStr
        );
        const facturaNueva = facturasExistentes.find(
          (f) => f._id.toString() === facturaIdStr
        );

        if (!facturaEnPaquete || !facturaNueva) return false;

        // CAMBIO CLAVE: Permitir siempre si es un nuevo pago parcial (diferente importe)
        // Solo rechazar si es exactamente el mismo monto (duplicado exacto)
        const importePagadoAnterior = parseFloat(facturaEnPaquete.importePagado) || 0;
        const importePagadoNuevo = parseFloat(facturaNueva.importePagado) || 0;
        
        console.log(`🔍 Validando factura ${facturaIdStr} para pago parcial separado:`, {
          importePagadoAnterior,
          importePagadoNuevo,
          esDuplicadoExacto: importePagadoNuevo === importePagadoAnterior,
          esNuevoPagoParcial: importePagadoNuevo !== importePagadoAnterior
        });

        // Solo rechazar duplicados exactos en el mismo paquete
        return importePagadoNuevo === importePagadoAnterior;
      });

      if (facturasYaEnPaqueteConMismoImporte.length > 0) {
        const facturasAfectadas = facturasYaEnPaqueteConMismoImporte.map(facturaId => {
          const facturaEnPaquete = paqueteExistente.facturas.find(f => f._id.toString() === facturaId.toString());
          return facturaEnPaquete?.uuid || facturaId;
        }).join(', ');
        
        return res.status(400).json({
          success: false,
          message: `No se pueden agregar facturas duplicadas con el mismo monto en el mismo paquete. Facturas afectadas: ${facturasAfectadas}`,
        });
      }

      // Procesar todas las facturas (nuevas y existentes con diferentes montos)
      const facturasAProcesar = facturas.filter(facturaId => {
        const facturaIdStr = facturaId.toString();
        const yaEstaEnPaquete = facturasActualesIds.includes(facturaIdStr);
        
        if (!yaEstaEnPaquete) {
          // Es una factura nueva, procesarla
          return true;
        }
        
        // Es una factura existente, verificar si tiene un monto diferente
        const facturaEnPaquete = paqueteExistente.facturas.find(
          (f) => f._id.toString() === facturaIdStr
        );
        const facturaNueva = facturasExistentes.find(
          (f) => f._id.toString() === facturaIdStr
        );
        
        if (!facturaEnPaquete || !facturaNueva) return false;
        
        const importePagadoAnterior = parseFloat(facturaEnPaquete.importePagado) || 0;
        const importePagadoNuevo = parseFloat(facturaNueva.importePagado) || 0;
        
        // Procesar si tiene un monto diferente (nuevo pago parcial)
        return importePagadoNuevo !== importePagadoAnterior;
      });

      if (facturasAProcesar.length > 0) {
        for (const facturaId of facturasAProcesar) {
          const factura = facturasExistentes.find(
            (f) => f._id.toString() === facturaId.toString()
          );

          if (factura) {
            const datosAgregacion = {
              descripcionPago: comentario || "Agregada al paquete",
              registrado: 1, // Registrado
              fechaRevision: new Date(),
              estaRegistrada: true, // Marcar como registrada en paquete
              pagoRechazado: false, // No rechazado inicialmente
            };

            // Tanto para pagos completos como parciales, marcar como pendiente de autorización
            if (factura.importePagado >= factura.importeAPagar) {
              // Pago completo - pendiente de autorización
              datosAgregacion.estadoPago = 0; // Pendiente de autorización
              datosAgregacion.autorizada = null; // Pendiente de autorización
              datosAgregacion.esCompleta = false; // No está completamente pagada hasta que se autorice
            } else if (factura.importePagado > 0) {
              // Pago parcial - también pendiente de autorización (como los completos)
              datosAgregacion.estadoPago = 0; // Pendiente de autorización
              datosAgregacion.autorizada = null; // Pendiente de autorización
              datosAgregacion.esCompleta = false;
            } else {
              // Sin pagos - estado inicial
              datosAgregacion.estadoPago = 1; // Enviado a pago
              datosAgregacion.autorizada = null;
              datosAgregacion.esCompleta = false;
            }

            await ImportedInvoices.findByIdAndUpdate(facturaId, {
              $set: datosAgregacion,
            });
          }
        }
      }
    }

    // Obtener todos los conceptos de gasto involucrados (si se proporcionan)
    let conceptosGastoMap = {};
    if (conceptosGasto && Object.keys(conceptosGasto).length > 0) {
      const conceptosIds = Object.values(conceptosGasto).map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      const conceptosDocs = await ExpenseConcept.find({
        _id: { $in: conceptosIds },
      });
      conceptosGastoMap = conceptosDocs.reduce((acc, concepto) => {
        acc[concepto._id.toString()] = {
          id: concepto._id,
          name: concepto.name,
          descripcion: concepto.description,
        };
        return acc;
      }, {});
    }

    // Preparar los pagos en efectivo embebidos con todos sus datos (si se proporcionan)
    let pagosEfectivoEmbebidos = [];
    if (Array.isArray(pagosEfectivo) && pagosEfectivo.length > 0) {
      pagosEfectivoEmbebidos = [];
      for (const pago of pagosEfectivo) {
        // Si el pago ya existe (tiene _id y no es temporal), lo buscamos, si no, lo creamos
        let pagoDoc;
        if (
          pago._id &&
          typeof pago._id === "string" &&
          !pago._id.startsWith("temp_")
        ) {
          pagoDoc = await CashPayment.findById(pago._id);
        } else {
          pagoDoc = await CashPayment.create({
            importeAPagar: pago.importeAPagar,
            expenseConcept: pago.expenseConcept,
            description: pago.description,
            importePagado: pago.importeAPagar, // Guardar como importeAPagar al crear
          });
        }
        if (!pagoDoc) continue;
        // Embebe todos los campos relevantes (igual que una factura)
        const pagoData = pagoDoc.toObject();
        // Forzar campos de estado iniciales
        pagoData.autorizada = null;
        pagoData.estadoPago = 0;
        pagoData.esCompleta = false;
        pagoData.pagoRechazado = false;
        pagoData.registrado = 0;
        pagoData.pagado = 0;
        pagoData.descripcionPago = "";
        pagoData.fechaRevision = new Date();
        pagoData.importePagado = pagoData.importeAPagar; // SIEMPRE igual al crear
        pagosEfectivoEmbebidos.push(pagoData);
      }
    }

    // Actualizar el paquete
    const datosActualizacion = {};
    
    // DEBUG: Ver qué datos están llegando
    console.log(`🔍 DATOS DE ENTRADA - updateInvoicesPackage:`, {
      facturas: facturas,
      facturasLength: facturas?.length || 0,
      montosEspecificos: montosEspecificos,
      paqueteExistenteId: paqueteExistente?._id,
      paqueteExistenteFacturasCount: paqueteExistente?.facturas?.length || 0
    });
    
    if (facturas) {
      // En lugar de reemplazar todas las facturas, agregar solo las nuevas
      const facturasActualesIds = paqueteExistente.facturas.map((f) =>
        f._id.toString()
      );
      const facturasNuevas = facturas.filter(
        (f) => !facturasActualesIds.includes(f.toString())
      );

      if (facturas && facturas.length > 0) {
        // En lugar de solo agregar facturas nuevas, manejar tanto actualizaciones como nuevas facturas
        const facturasActualizadas = [...paqueteExistente.facturas];

        // Procesar cada factura en la solicitud
        for (const facturaId of facturas) {
          const facturaIdStr = facturaId.toString();
          const facturaExistente = facturasExistentes.find(
            (f) => f._id.toString() === facturaIdStr
          );

          if (!facturaExistente) continue;

          // Verificar si la factura ya existe en el paquete
          const indiceFacturaEnPaquete = facturasActualizadas.findIndex(
            (f) => f._id.toString() === facturaIdStr
          );

          if (indiceFacturaEnPaquete >= 0) {
            // La factura ya existe en el paquete - LÓGICA DE PAGOS PARCIALES SEPARADOS
            const facturaEnPaquete = facturasActualizadas[indiceFacturaEnPaquete];
            const importeTotalFactura = parseFloat(facturaEnPaquete.importeAPagar || facturaExistente.importeAPagar) || 0;
            
            // NUEVA LÓGICA: Usar monto específico de este pago parcial en lugar del acumulativo
            const montoEspecificoEstesPago = montosEspecificos && montosEspecificos[facturaIdStr] 
              ? parseFloat(montosEspecificos[facturaIdStr]) 
              : parseFloat(facturaExistente.importePagado) || 0;

            // VALIDACIÓN: El monto específico no puede exceder el importe total
            if (montoEspecificoEstesPago > importeTotalFactura) {
              return res.status(400).json({
                success: false,
                message: `El monto del pago parcial ($${montoEspecificoEstesPago.toLocaleString('es-MX', {minimumFractionDigits: 2})}) no puede exceder el importe total de la factura ($${importeTotalFactura.toLocaleString('es-MX', {minimumFractionDigits: 2})}).`,
              });
            }

            console.log(`🔄 Agregando pago parcial separado para factura ${facturaIdStr}:`, {
              importeTotalFactura,
              montoEspecificoEstesPago,
              esPagoCompleto: montoEspecificoEstesPago >= importeTotalFactura,
              usandoMontoEspecifico: !!montosEspecificos && !!montosEspecificos[facturaIdStr],
              facturaExistenteImportePagado: facturaExistente.importePagado
            });

            // NUEVA LÓGICA: Crear nueva entrada con el monto específico de este pago parcial
            // En lugar de actualizar la existente, agregar como nueva entrada
            const nuevaEntradaPagoParcial = {
              ...facturaExistente.toObject(),
              importePagado: montoEspecificoEstesPago, // Monto específico de este pago parcial
              autorizada: null, // Pendiente de autorización
              estadoPago: 0,
              esCompleta: montoEspecificoEstesPago >= importeTotalFactura,
              pagoRechazado: false,
              fechaRevision: new Date(),
            };

            console.log(`📝 Nueva entrada creada con importePagado: ${nuevaEntradaPagoParcial.importePagado}`);

            // Asignar concepto de gasto si se proporciona para esta factura
            if (conceptosGasto && conceptosGasto[facturaIdStr]) {
              const conceptoId = conceptosGasto[facturaIdStr];
              if (conceptosGastoMap[conceptoId]) {
                nuevaEntradaPagoParcial.conceptoGasto = conceptosGastoMap[conceptoId];
              }
            }

            // Agregar como nueva entrada en lugar de actualizar la existente
            facturasActualizadas.push(nuevaEntradaPagoParcial);

            console.log(`✅ Nueva entrada de pago parcial agregada para factura ${facturaIdStr}:`, {
              importeTotalFactura,
              montoEspecificoEstesPago,
              saldoRestante: importeTotalFactura - montoEspecificoEstesPago,
              estaCompleta: montoEspecificoEstesPago >= importeTotalFactura,
              nuevaEntradaCreada: true
            });
          } else {
            // La factura es nueva - agregarla al paquete
            const facturaData = facturaExistente.toObject();
            facturaData._id = facturaExistente._id;
            
            // NUEVA LÓGICA: Usar monto específico si se proporciona
            const montoEspecificoEstesPago = montosEspecificos && montosEspecificos[facturaIdStr] 
              ? parseFloat(montosEspecificos[facturaIdStr]) 
              : facturaData.importePagado || 0;
              
            facturaData.importePagado = montoEspecificoEstesPago;

            // FORZAR que autorizada sea null (pendiente) al agregar al paquete
            facturaData.autorizada = null;
            facturaData.estadoPago = 0;
            facturaData.esCompleta = montoEspecificoEstesPago >= facturaData.importeAPagar;
            facturaData.pagoRechazado = false;
            facturaData.estaRegistrada = true;
            facturaData.registrado = 1;
            facturaData.fechaRevision = new Date();

            // Asignar concepto de gasto si se proporciona para esta factura
            if (conceptosGasto && conceptosGasto[facturaIdStr]) {
              const conceptoId = conceptosGasto[facturaIdStr];
              if (conceptosGastoMap[conceptoId]) {
                facturaData.conceptoGasto = conceptosGastoMap[conceptoId];
              }
            }

            // Asegurar que razonSocial tenga la estructura correcta
            if (
              facturaData.razonSocial &&
              typeof facturaData.razonSocial === "object" &&
              facturaData.razonSocial._id
            ) {
              facturaData.razonSocial = {
                _id: facturaData.razonSocial._id,
                name: facturaData.razonSocial.name || "",
                rfc: facturaData.razonSocial.rfc || "",
              };
            }

            facturasActualizadas.push(facturaData);
          }
        }

        // PASO 2.5: Actualizar importePagado de facturas embebidas para reflejar el acumulativo de la factura original
        // Esto es crítico para pagos parciales múltiples de la misma factura en el mismo paquete
        if (facturasActualizadas.length > 0) {
          console.log(`🔄 PASO 2.5: Actualizando importePagado acumulativo de facturas embebidas...`);
          console.log(`📊 Facturas a procesar: ${facturasActualizadas.length}`);
          
          // DEBUG: Mostrar estado inicial de facturas embebidas
          facturasActualizadas.forEach((f, index) => {
            console.log(`📋 Factura embebida ${index + 1}:`, {
              _id: f._id.toString(),
              importePagado: f.importePagado,
              importeAPagar: f.importeAPagar
            });
          });
          
          // Obtener importePagado actual de las facturas originales
          const facturaIds = [...new Set(facturasActualizadas.map(f => f._id.toString()))];
          console.log(`🔍 IDs únicos a buscar en ImportedInvoices:`, facturaIds);
          
          const facturasOriginales = await ImportedInvoices.find({
            _id: { $in: facturaIds }
          });
          
          console.log(`📦 Facturas originales encontradas: ${facturasOriginales.length}`);
          
          // Crear mapa de importePagado original por ID
          const importesPagadosOriginales = {};
          facturasOriginales.forEach(facturaOriginal => {
            const importePagado = parseFloat(facturaOriginal.importePagado) || 0;
            importesPagadosOriginales[facturaOriginal._id.toString()] = importePagado;
            console.log(`💰 Factura original ${facturaOriginal._id}: importePagado = ${importePagado}`);
          });
          
          // Actualizar todas las entradas embebidas de cada factura con el importePagado acumulativo
          // Esto asegura que todas las entradas de la misma factura en el paquete muestren el monto total acumulado
          let facturasActualizadasCount = 0;
          facturasActualizadas.forEach(facturaEmbebida => {
            const facturaIdStr = facturaEmbebida._id.toString();
            const importePagadoAcumulativo = importesPagadosOriginales[facturaIdStr];
            
            console.log(`🔧 Procesando factura embebida ${facturaIdStr}:`, {
              importePagadoAntes: facturaEmbebida.importePagado,
              importePagadoAcumulativo: importePagadoAcumulativo,
              tieneValorAcumulativo: importePagadoAcumulativo !== undefined
            });
            
            if (importePagadoAcumulativo !== undefined) {
              const importePagadoAnterior = facturaEmbebida.importePagado;
              facturaEmbebida.importePagado = importePagadoAcumulativo;
              facturasActualizadasCount++;
              
              console.log(`✅ Factura embebida ${facturaIdStr} ACTUALIZADA: ${importePagadoAnterior} → ${importePagadoAcumulativo}`);
            } else {
              console.log(`❌ No se encontró valor acumulativo para factura ${facturaIdStr}`);
            }
          });
          
          console.log(`✅ Actualización de importePagado embebido completada: ${facturasActualizadasCount}/${facturaIds.length} facturas actualizadas`);
          
          // DEBUG: Mostrar estado final de facturas embebidas
          console.log(`📊 Estado FINAL de facturas embebidas después de actualización:`);
          facturasActualizadas.forEach((f, index) => {
            console.log(`📋 Factura embebida ${index + 1} (FINAL):`, {
              _id: f._id.toString(),
              importePagado: f.importePagado,
              importeAPagar: f.importeAPagar
            });
          });
        }

        datosActualizacion.facturas = facturasActualizadas;
      } else {
        // CASO ESPECIAL: No hay facturas nuevas, pero puede haber pagos temporales que requieren 
        // actualización del importePagado embebido (pagos parciales adicionales de facturas existentes)
        console.log(`⚠️ No hay facturas nuevas para agregar, pero verificando si hay pagos temporales procesados...`);
      }
      
      // PASO 2.5 MEJORADO: Ejecutar SIEMPRE que haya montos específicos para actualizar facturas embebidas
      const hayMontosEspecificos = montosEspecificos && Object.keys(montosEspecificos).length > 0;
      console.log(`🔄 Verificando necesidad de actualizar importePagado embebido:`, {
        hayFacturasActualizadas: !!(datosActualizacion.facturas && datosActualizacion.facturas.length > 0),
        hayMontosEspecificos: hayMontosEspecificos,
        debeEjecutarPaso25: hayMontosEspecificos
      });
      
      if (hayMontosEspecificos) {
        // Usar las facturas del paquete existente para la actualización
        const facturasParaActualizar = paqueteExistente.facturas || [];
        
        console.log(`🔄 PASO 2.5 (MEJORADO): Actualizando importePagado acumulativo de facturas embebidas...`);
        console.log(`📊 Facturas a procesar: ${facturasParaActualizar.length}`);
        
        // DEBUG: Mostrar estado inicial de facturas embebidas
        facturasParaActualizar.forEach((f, index) => {
          // Validar que la factura tenga todos los campos necesarios antes de hacer console.log
          if (f && f._id) {
            console.log(`📋 Factura embebida ${index + 1}:`, {
              _id: f._id.toString(),
              importePagado: f.importePagado || 0,
              importeAPagar: f.importeAPagar || 0
            });
          } else {
            console.log(`⚠️ Factura embebida ${index + 1}: Factura inválida o sin _id`);
          }
        });
        
        // Obtener IDs únicos de facturas que tienen montos específicos
        const facturaIdsConMontosEspecificos = Object.keys(montosEspecificos || {});
        console.log(`🔍 Facturas con montos específicos:`, facturaIdsConMontosEspecificos);
        
        if (facturaIdsConMontosEspecificos.length > 0) {
          const facturasOriginales = await ImportedInvoices.find({
            _id: { $in: facturaIdsConMontosEspecificos }
          });
          
          console.log(`📦 Facturas originales encontradas: ${facturasOriginales.length}`);
          
          // Crear mapa de importePagado original por ID
          const importesPagadosOriginales = {};
          facturasOriginales.forEach(facturaOriginal => {
            if (facturaOriginal && facturaOriginal._id) {
              const importePagado = parseFloat(facturaOriginal.importePagado) || 0;
              importesPagadosOriginales[facturaOriginal._id.toString()] = importePagado;
              console.log(`💰 Factura original ${facturaOriginal._id}: importePagado = ${importePagado}`);
            }
          });
          
          // Actualizar las facturas embebidas del paquete existente
          const facturasActualizadasPaso25 = facturasParaActualizar.map(facturaEmbebida => {
            // Validar que la factura embebida tenga todos los campos necesarios
            if (!facturaEmbebida || !facturaEmbebida._id) {
              console.log(`⚠️ Factura embebida inválida, saltando...`);
              return facturaEmbebida; // Devolver sin cambios si es inválida
            }
            
            const facturaIdStr = facturaEmbebida._id.toString();
            const importePagadoAcumulativo = importesPagadosOriginales[facturaIdStr];
            
            console.log(`🔧 Procesando factura embebida ${facturaIdStr}:`, {
              importePagadoAntes: facturaEmbebida.importePagado || 0,
              importePagadoAcumulativo: importePagadoAcumulativo || 0,
              tieneValorAcumulativo: importePagadoAcumulativo !== undefined,
              tieneMontoEspecifico: facturaIdsConMontosEspecificos.includes(facturaIdStr)
            });
            
            if (importePagadoAcumulativo !== undefined) {
              const importePagadoAnterior = facturaEmbebida.importePagado || 0;
              
              console.log(`✅ Factura embebida ${facturaIdStr} ACTUALIZADA: ${importePagadoAnterior} → ${importePagadoAcumulativo}`);
              
              // Crear una nueva versión de la factura embebida con el importePagado actualizado
              return {
                ...facturaEmbebida,
                importePagado: importePagadoAcumulativo
              };
            }
            
            // Si no tiene valor acumulativo, devolver la factura sin cambios
            return facturaEmbebida;
          });
          
          // Actualizar las facturas en datosActualizacion
          datosActualizacion.facturas = facturasActualizadasPaso25;
          
          console.log(`✅ PASO 2.5 (MEJORADO) completado: facturas embebidas actualizadas`);
          
          // DEBUG: Mostrar estado final de facturas embebidas
          console.log(`📊 Estado FINAL de facturas embebidas después de actualización:`);
          facturasActualizadasPaso25.forEach((f, index) => {
            // Validar que la factura tenga todos los campos necesarios antes de hacer console.log
            if (f && f._id) {
              console.log(`📋 Factura embebida ${index + 1} (FINAL):`, {
                _id: f._id.toString(),
                importePagado: f.importePagado || 0,
                importeAPagar: f.importeAPagar || 0
              });
            } else {
              console.log(`⚠️ Factura embebida ${index + 1} (FINAL): Factura inválida o sin _id`);
            }
          });
        }
      }
    }
    if (estatus) datosActualizacion.estatus = estatus;
    if (departamento_id) datosActualizacion.departamento_id = departamento_id;
    if (departamento) datosActualizacion.departamento = departamento;
    if (comentario !== undefined) datosActualizacion.comentario = comentario;
    if (fechaPago) {
      const fechaPagoParaGuardar = new Date(fechaPago);
      fechaPagoParaGuardar.setUTCHours(12, 0, 0, 0);
      datosActualizacion.fechaPago = fechaPagoParaGuardar;
    }
    // NO establecer totalImporteAPagar desde frontend - se calculará automáticamente

    // Agregar pagos en efectivo si se proporcionan
    if (pagosEfectivoEmbebidos.length > 0) {
      // Agregar los nuevos pagos en efectivo al array existente
      const pagosEfectivoExistentes = paqueteExistente.pagosEfectivo || [];
      datosActualizacion.pagosEfectivo = [
        ...pagosEfectivoExistentes,
        ...pagosEfectivoEmbebidos,
      ];
    }

    console.log(`💾 Guardando paquete con ${datosActualizacion.facturas?.length || 0} facturas embebidas`);
    
    const paqueteActualizado = await InvoicesPackage.findByIdAndUpdate(
      id,
      { $set: datosActualizacion },
      { new: true, runValidators: true }
    );

    console.log(`✅ Paquete guardado. Verificando facturas embebidas después del guardado:`);
    if (paqueteActualizado.facturas) {
      paqueteActualizado.facturas.forEach((f, index) => {
        console.log(`📋 Factura guardada ${index + 1}:`, {
          _id: f._id.toString(),
          importePagado: f.importePagado,
          importeAPagar: f.importeAPagar
        });
      });
    }

    await paqueteActualizado.actualizarTotales();

    if (companyId !== undefined) {
      if (paqueteExistente.packageCompanyId) {
        // Actualizar relación existente
        const packageCompanyData = {
          companyId: new mongoose.Types.ObjectId(companyId),
        };

        if (brandId !== undefined) {
          packageCompanyData.brandId = brandId
            ? new mongoose.Types.ObjectId(brandId)
            : null;
        }

        if (branchId !== undefined) {
          packageCompanyData.branchId = branchId
            ? new mongoose.Types.ObjectId(branchId)
            : null;
        }

        await InvoicesPackageCompany.findByIdAndUpdate(
          paqueteExistente.packageCompanyId,
          { $set: packageCompanyData }
        );
      } else if (companyId) {
        // Crear nueva relación
        const packageCompanyData = {
          packageId: id,
          companyId: new mongoose.Types.ObjectId(companyId),
        };

        if (brandId) {
          packageCompanyData.brandId = new mongoose.Types.ObjectId(brandId);
        }

        if (branchId) {
          packageCompanyData.branchId = new mongoose.Types.ObjectId(branchId);
        }

        const packageCompany = new InvoicesPackageCompany(packageCompanyData);
        const packageCompanyGuardado = await packageCompany.save();

        // Actualizar el paquete con la referencia
        paqueteActualizado.packageCompanyId = packageCompanyGuardado._id;
        await paqueteActualizado.save();
      }
    }

    // Obtener el paquete actualizado con las facturas embebidas
    const paqueteCompleto = await InvoicesPackage.findById(id)
      .populate({
        path: "packageCompanyId",
        populate: ["companyId", "brandId", "branchId"],
      })
      .populate({
        path: "pagosEfectivo.expenseConcept",
        select: "name description",
        populate: {
          path: "categoryId",
          select: "name",
        },
      });

    res.status(200).json({
      success: true,
      message: "Paquete de facturas actualizado exitosamente.",
      data: paqueteCompleto,
    });
  } catch (error) {
    console.error("Error updating invoices package:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// DELETE - Eliminar un paquete de facturas
export const deleteInvoicesPackage = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el paquete
    const paquete = await InvoicesPackage.findById(id);
    if (!paquete) {
      return res.status(404).json({
        success: false,
        message: "Paquete de facturas no encontrado.",
      });
    }

    // Verificar que el paquete no esté pagado
    if (paquete.estatus === "Pagado") {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar un paquete que ya ha sido pagado.",
      });
    }

    // Actualizar las facturas para removerlas del paquete
    const datosRemocion = {
      descripcionPago: "Paquete eliminado",
      estadoPago: 0, // Pendiente
      registrado: 0, // No registrado
      fechaRevision: new Date(),
    };

    // Extraer los IDs de las facturas embebidas
    const facturaIds = paquete.facturas.map((f) => f._id);

    await Promise.all([
      // Actualizar facturas
      ImportedInvoices.updateMany(
        { _id: { $in: facturaIds } },
        { $set: datosRemocion }
      ),
      // Eliminar la relación con Company, Brand, Branch si existe
      paquete.packageCompanyId
        ? InvoicesPackageCompany.findByIdAndDelete(paquete.packageCompanyId)
        : Promise.resolve(),
    ]);

    // Eliminar el paquete
    await InvoicesPackage.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Paquete de facturas eliminado exitosamente.",
    });
  } catch (error) {
    console.error("Error deleting invoices package:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// Función adicional: Obtener resumen de paquetes
export const getInvoicesPackagesSummary = async (req, res) => {
  try {
    const { usuario_id } = req.query;

    // Convertir a ObjectId si se proporciona
    const usuarioObjectId = usuario_id
      ? new mongoose.Types.ObjectId(usuario_id)
      : null;
    const resumen = await InvoicesPackage.obtenerResumen(usuarioObjectId);

    res.status(200).json({
      success: true,
      data: resumen,
    });
  } catch (error) {
    console.error("Error getting invoices packages summary:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// Función adicional: Buscar paquetes vencidos
export const getVencidosInvoicesPackages = async (req, res) => {
  try {
    const paquetesVencidos = await InvoicesPackage.buscarVencidos();

    res.status(200).json({
      success: true,
      data: paquetesVencidos,
    });
  } catch (error) {
    console.error("Error getting vencidos invoices packages:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// Función adicional: Cambiar estatus de un paquete
export const changeInvoicesPackageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estatus } = req.body;

    if (!estatus) {
      return res.status(400).json({
        success: false,
        message: "El estatus es requerido.",
      });
    }

    const paquete = await InvoicesPackage.findById(id);
    if (!paquete) {
      return res.status(404).json({
        success: false,
        message: "Paquete de facturas no encontrado.",
      });
    }

    // Si se marca como pagado, actualizar las facturas
    if (estatus === "Pagado") {
      const datosPago = {
        importePagado: 0, // Se mantiene el valor actual
        esCompleta: true,
        estadoPago: 2, // Pagado
        fechaRevision: new Date(),
      };

      // Extraer los IDs de las facturas embebidas
      const facturaIds = paquete.facturas.map((f) => f._id);

      await Promise.all(
        facturaIds.map((facturaId) =>
          ImportedInvoices.findByIdAndUpdate(facturaId, { $set: datosPago })
        )
      );
    }

    // Cambiar el estatus
    await paquete.cambiarEstatus(estatus);

    const paqueteActualizado = await InvoicesPackage.findById(id);

    res.status(200).json({
      success: true,
      message: "Estatus del paquete actualizado exitosamente.",
      data: paqueteActualizado,
    });
  } catch (error) {
    console.error("Error changing invoices package status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// GET - Obtener paquetes por usuario_id con filtrado por departamento y visibilidad
export const getInvoicesPackagesByUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.query;
    if (!usuario_id) {
      return res
        .status(400)
        .json({ success: false, message: "usuario_id es requerido" });
    }

    // Convertir a ObjectId
    const usuarioObjectId = new mongoose.Types.ObjectId(usuario_id);

    // Obtener el usuario con su departamento
    const User = mongoose.model("cs_user");
    const user = await User.findById(usuarioObjectId).populate("departmentId");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    // Obtener el nombre del departamento
    const departmentName = user.departmentId?.name || "";
    const isTesoreria = departmentName.toLowerCase() === "tesorería";

    let paquetesQuery = InvoicesPackage.find();

    if (isTesoreria) {
      // Si el departamento es "Tesorería", mostrar paquetes según la visibilidad del usuario
      const userVisibility = await RoleVisibility.findOne({
        userId: usuarioObjectId,
      });

      if (userVisibility) {
        // Si el usuario tiene visibilidad configurada, filtrar por sus permisos
        const { companies, brands, branches } = userVisibility;

        // Construir filtros para la tabla relacional
        const filterConditions = [];

        // Si tiene acceso a compañías específicas
        if (companies && companies.length > 0) {
          filterConditions.push({ companyId: { $in: companies } });
        }

        // Si tiene acceso a marcas específicas
        if (brands && brands.length > 0) {
          const brandConditions = brands.map((brand) => ({
            companyId: brand.companyId,
            brandId: brand.brandId,
          }));
          filterConditions.push({ $or: brandConditions });
        }

        // Si tiene acceso a sucursales específicas
        if (branches && branches.length > 0) {
          const branchConditions = branches.map((branch) => ({
            companyId: branch.companyId,
            brandId: branch.brandId,
            branchId: branch.branchId,
          }));
          filterConditions.push({ $or: branchConditions });
        }

        // Si no hay filtros específicos, el usuario no tiene acceso a nada
        if (filterConditions.length === 0) {
          return res.status(200).json({ success: true, data: [] });
        }

        // Buscar paquetes en la tabla relacional que coincidan con la visibilidad
        const packageRelations = await InvoicesPackageCompany.find({
          $or: filterConditions,
        });

        const packageIds = packageRelations.map((rel) => rel.packageId);

        // Si no hay paquetes relacionados, devolver array vacío
        if (packageIds.length === 0) {
          return res.status(200).json({ success: true, data: [] });
        }

        // Filtrar por los paquetes que el usuario puede ver
        paquetesQuery = paquetesQuery.find({
          _id: { $in: packageIds },
        });
      } else {
        // Si no hay visibilidad configurada para Tesorería, no mostrar nada
        return res.status(200).json({ success: true, data: [] });
      }
    } else {
      // Si el departamento es diferente a "Tesorería", mostrar solo paquetes del departamento del usuario
      paquetesQuery = paquetesQuery.find({
        departamento_id: user.departmentId._id,
      });
    }

    const paquetes = await paquetesQuery
      .populate({
        path: "packageCompanyId",
        populate: ["companyId", "brandId", "branchId"],
      })
      .populate({
        path: "pagosEfectivo.expenseConcept",
        select: "name description",
        populate: {
          path: "categoryId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 }); // Ordenar por fecha de creación descendente

    // Agregar headers para evitar caché
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.status(200).json({ success: true, data: paquetes });
  } catch (error) {
    console.error("Error en getInvoicesPackagesByUsuario:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET - Obtener paquetes creados por el usuario (sin filtrado de visibilidad)
export const getInvoicesPackagesCreatedByUsuario = async (req, res) => {
  try {
    const { usuario_id } = req.query;
    if (!usuario_id) {
      return res
        .status(400)
        .json({ success: false, message: "usuario_id es requerido" });
    }

    // Convertir a ObjectId
    const usuarioObjectId = new mongoose.Types.ObjectId(usuario_id);

    // Obtener solo los paquetes creados por el usuario (sin filtrado de visibilidad)
    const paquetes = await InvoicesPackage.find({ usuario_id: usuarioObjectId })
      .populate({
        path: "packageCompanyId",
        populate: ["companyId", "brandId", "branchId"],
      })
      .populate({
        path: "pagosEfectivo.expenseConcept",
        select: "name description",
        populate: {
          path: "categoryId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 }); // Ordenar por fecha de creación descendente

    // Agregar headers para evitar caché
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.status(200).json({ success: true, data: paquetes });
  } catch (error) {
    console.error("Error en getInvoicesPackagesCreatedByUsuario:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Función para actualizar totales de paquetes cuando se desautoriza una factura
export const actualizarTotalesPaquetesPorFactura = async (facturaId) => {
  try {
    // Buscar todos los paquetes que contengan esta factura por _id
    const paquetes = await InvoicesPackage.find({
      "facturas._id": facturaId,
    });

    // Actualizar los totales de cada paquete
    for (const paquete of paquetes) {
      await paquete.actualizarTotales();
    }

    console.log(
      `Totales actualizados para ${paquetes.length} paquetes que contienen la factura ${facturaId}`
    );
  } catch (error) {
    console.error("Error actualizando totales de paquetes:", error);
  }
};

// Función para actualizar una factura embebida en todos los paquetes que la contengan
export const actualizarFacturaEnPaquetes = async (
  facturaId,
  datosActualizados
) => {
  try {
    // Preparar los campos a actualizar
    const camposActualizacion = {
      "facturas.$.autorizada": datosActualizados.autorizada,
      "facturas.$.pagoRechazado": datosActualizados.pagoRechazado,
      "facturas.$.estadoPago": datosActualizados.estadoPago,
      "facturas.$.esCompleta": datosActualizados.esCompleta,
      "facturas.$.pagado": datosActualizados.pagado || 0,
      "facturas.$.descripcionPago": datosActualizados.descripcionPago || "",
    };

    // Solo actualizar importePagado si se está autorizando (no si se está rechazando)
    if (datosActualizados.importePagado !== undefined) {
      camposActualizacion["facturas.$.importePagado"] =
        datosActualizados.importePagado;
    }

    // También actualizar importeAPagar si está presente
    if (datosActualizados.importeAPagar !== undefined) {
      camposActualizacion["facturas.$.importeAPagar"] =
        datosActualizados.importeAPagar;
    }

    // Otros campos necesarios para la acumulación de pagos parciales
    if (datosActualizados.fechaRevision !== undefined) {
      camposActualizacion["facturas.$.fechaRevision"] =
        datosActualizados.fechaRevision;
    }

    if (datosActualizados.estaRegistrada !== undefined) {
      camposActualizacion["facturas.$.estaRegistrada"] =
        datosActualizados.estaRegistrada;
    }

    // Actualizar directamente en la base de datos usando $set
    const result = await InvoicesPackage.updateMany(
      { "facturas._id": facturaId },
      { $set: camposActualizacion }
    );

    console.log(
      `Factura embebida actualizada en ${result.modifiedCount} paquetes para la factura ${facturaId}`
    );
  } catch (error) {
    console.error("Error actualizando factura embebida en paquetes:", error);
  }
};

// Función para enviar paquete a dirección (actualizar facturas originales con datos finales)
export const enviarPaqueteADireccion = async (req, res) => {
  try {
    const { id } = req.params;

    const paquete = await InvoicesPackage.findById(id);
    if (!paquete) {
      return res.status(404).json({
        success: false,
        message: "Paquete de facturas no encontrado.",
      });
    }

    // Verificar que todas las facturas estén procesadas (sin pendientes)
    const facturasPendientes = paquete.facturas.filter(
      (f) => f.autorizada === null
    );
    if (facturasPendientes.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede enviar el paquete. Hay facturas pendientes de procesar.",
      });
    }

    // NUEVA LÓGICA: Actualizar las facturas originales según su estado
    const facturasAutorizadas = paquete.facturas.filter(
      (f) => f.autorizada === true
    );
    const facturasRechazadas = paquete.facturas.filter(
      (f) => f.autorizada === false
    );

    // Actualizar facturas autorizadas (como antes)
    for (const facturaEmbebida of facturasAutorizadas) {
      const datosActualizacion = {
        autorizada: facturaEmbebida.autorizada,
        pagoRechazado: facturaEmbebida.pagoRechazado,
        importePagado: facturaEmbebida.importePagado,
        estadoPago: facturaEmbebida.estadoPago,
        esCompleta: facturaEmbebida.esCompleta,
        pagado: facturaEmbebida.pagado,
        descripcionPago: facturaEmbebida.descripcionPago,
        fechaRevision: new Date(),
      };

      await ImportedInvoices.findByIdAndUpdate(facturaEmbebida._id, {
        $set: datosActualizacion,
      });
    }

    // NUEVA FUNCIONALIDAD: Resetear facturas rechazadas a su estado original
    for (const facturaEmbebida of facturasRechazadas) {
      const datosReseteo = {
        importePagado: 0,
        estadoPago: 0, // Pendiente
        esCompleta: false,
        descripcionPago: null,
        autorizada: null,
        pagoRechazado: false,
        fechaRevision: null,
        registrado: 0,
        pagado: 0,
        estaRegistrada: false,
        conceptoGasto: null,
      };

      await ImportedInvoices.findByIdAndUpdate(facturaEmbebida._id, {
        $set: datosReseteo,
      });
    }

    // Cambiar el estatus del paquete a "Enviado"
    paquete.estatus = "Enviado";
    await paquete.save();

    // Registrar el cambio de estatus en el timeline
    console.log('🔄 Registrando cambio de estatus a "enviado":', {
      userId: req.user._id,
      packageId: paquete._id,
      status: "enviado",
    });

    await timelineService.registerStatusChange(
      req.user._id, // userId del usuario autenticado
      paquete._id, // packageId
      "enviado" // nuevo status
    );

    res.status(200).json({
      success: true,
      message: `Paquete enviado a dirección correctamente. ${facturasAutorizadas.length} facturas autorizadas procesadas. ${facturasRechazadas.length} facturas rechazadas reseteadas a su estado original.`,
      data: paquete,
    });
  } catch (error) {
    console.error("Error enviando paquete a dirección:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// GET - Obtener presupuesto por compañía, marca, sucursal y mes (original)
export const getBudgetByCompanyBrandBranch = async (req, res) => {
  try {
    const { companyId, brandId, branchId, month } = req.query;

    // Validar parámetros requeridos
    if (!companyId || !brandId || !branchId || !month) {
      return res.status(400).json({
        success: false,
        message:
          "Los parámetros companyId, brandId, branchId y month son requeridos.",
      });
    }

    // Validar formato del mes (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({
        success: false,
        message: "El formato del mes debe ser YYYY-MM.",
      });
    }

    // Convertir los IDs a ObjectId
    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const brandObjectId = new mongoose.Types.ObjectId(brandId);
    const branchObjectId = new mongoose.Types.ObjectId(branchId);

    // Buscar la marca para obtener su categoryId
    const brand = await Brand.findById(brandObjectId);
    console.log("getBudgetByCompanyBrandBranch - Marca encontrada:", brand);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Marca no encontrada.",
      });
    }

    console.log(
      "getBudgetByCompanyBrandBranch - CategoryId de la marca:",
      brand.categoryId
    );

    if (!brand.categoryId) {
      return res.status(400).json({
        success: false,
        message: "La marca seleccionada no tiene una categoría asignada.",
      });
    }

    // Obtener la categoría para saber si maneja rutas
    const Category = mongoose.model("cc_category");
    const category = await Category.findById(brand.categoryId);

    console.log(
      "getBudgetByCompanyBrandBranch - Categoría encontrada:",
      category
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada.",
      });
    }

    // Construir el filtro base - Primero sin categoryId para ver todos los presupuestos
    let filtro = {
      companyId: companyObjectId,
      brandId: brandObjectId,
      branchId: branchObjectId,
      month: month,
    };

    console.log("getBudgetByCompanyBrandBranch - Filtro aplicado:", {
      companyId: companyObjectId.toString(),
      brandId: brandObjectId.toString(),
      branchId: branchObjectId.toString(),
      month: month,
      categoryId: brand.categoryId?.toString() || "No definido",
    });

    // Primero, buscar TODOS los presupuestos para esta combinación (sin filtrar por routeId)
    // para entender qué presupuestos existen
    console.log(
      "getBudgetByCompanyBrandBranch - Buscando TODOS los presupuestos para la combinación..."
    );
    const todosLosPresupuestos = await Budget.find(filtro)
      .populate("routeId")
      .populate("brandId")
      .populate("companyId")
      .populate("branchId")
      .populate("categoryId");

    console.log(
      "getBudgetByCompanyBrandBranch - TODOS los presupuestos encontrados:",
      todosLosPresupuestos.map((p) => ({
        _id: p._id,
        routeId: p.routeId,
        branchId: p.branchId?._id,
        categoryId: p.categoryId?._id,
        expenseConceptId: p.expenseConceptId?._id,
        assignedAmount: p.assignedAmount,
        month: p.month,
        hasRoute: !!p.routeId,
      }))
    );

    // Mostrar también la suma total para verificar
    const sumaTotal = todosLosPresupuestos.reduce(
      (sum, p) => sum + (p.assignedAmount || 0),
      0
    );
    console.log(
      "getBudgetByCompanyBrandBranch - Suma total de presupuestos:",
      sumaTotal
    );

    // Devolver TODOS los presupuestos encontrados para esta sucursal, mes y año
    // sin consolidar, para mostrar todos los conceptos de gasto individuales
    let presupuestosRespuesta = todosLosPresupuestos;

    console.log(
      "getBudgetByCompanyBrandBranch - Devolviendo TODOS los presupuestos encontrados:",
      presupuestosRespuesta.length
    );

    console.log(
      "getBudgetByCompanyBrandBranch - Cantidad de presupuestos a devolver:",
      presupuestosRespuesta.length
    );

    // Agregar headers para evitar caché
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    console.log("getBudgetByCompanyBrandBranch - Respuesta a enviar:", {
      success: true,
      data: presupuestosRespuesta,
      message: `Se encontraron ${presupuestosRespuesta.length} presupuestos para los filtros especificados.`,
    });

    res.status(200).json({
      success: true,
      data: presupuestosRespuesta,
      message: `Se encontraron ${presupuestosRespuesta.length} presupuestos para los filtros especificados.`,
    });
  } catch (error) {
    console.error("Error en getBudgetByCompanyBrandBranch:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// GET - Obtener presupuesto por compañía y mes (específico para dashboard de pagos)
export const getBudgetByCompanyForDashboard = async (req, res) => {
  try {
    const { companyId, month } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "El parámetro companyId es requerido.",
      });
    }

    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    let filtro = { companyId: companyObjectId };
    if (month) {
      filtro.month = month;
    }

    // Buscar todos los presupuestos de la compañía (y mes si aplica)
    const presupuestos = await Budget.find(filtro);
    const totalAssignedAmount = presupuestos.reduce(
      (sum, presupuesto) => sum + (presupuesto.assignedAmount || 0),
      0
    );

    // Retornar un presupuesto consolidado
    const presupuestoConsolidado = {
      _id: "consolidado_compania",
      companyId: companyObjectId,
      assignedAmount: totalAssignedAmount,
      month: month || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.status(200).json({
      success: true,
      data: [presupuestoConsolidado],
      message: "Presupuesto consolidado por compañía.",
    });
  } catch (error) {
    console.error("Error en getBudgetByCompanyForDashboard:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// GET - Obtener paquetes enviados para dashboard de pagos con filtros adicionales
export const getPaquetesEnviadosParaDashboard = async (req, res) => {
  try {
    const { companyId, year, month } = req.query;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "El parámetro companyId es requerido.",
      });
    }
    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    // Buscar relaciones en la tabla relacional para obtener los packageId de la compañía
    const relations = await InvoicesPackageCompany.find({
      companyId: companyObjectId,
    });
    const packageIds = relations.map((rel) => rel.packageId);
    if (packageIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { totalPaquetes: 0, totalPagado: 0, paquetes: [] },
      });
    }
    // Filtro base
    let filtro = { _id: { $in: packageIds } };
    // Filtro por año y mes sobre fechaPago
    if (year && month !== undefined) {
      const startDate = new Date(parseInt(year), parseInt(month), 1);
      const endDate = new Date(
        parseInt(year),
        parseInt(month) + 1,
        0,
        23,
        59,
        59,
        999
      );
      filtro.fechaPago = { $gte: startDate, $lte: endDate };
    }
    const paquetes = await InvoicesPackage.find(filtro)
      .populate({
        path: "packageCompanyId",
        populate: ["companyId", "brandId", "branchId"],
      })
      .sort({ createdAt: -1 });
    const totalPaquetes = paquetes.length;
    const totalPagado = paquetes.reduce(
      (sum, paquete) => sum + (paquete.totalPagado || 0),
      0
    );
    res.status(200).json({
      success: true,
      data: {
        totalPaquetes,
        totalPagado,
        paquetes,
      },
    });
  } catch (error) {
    console.error("Error en getPaquetesEnviadosParaDashboard:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST - Generar reporte (cambiar estatus a PorFondear)
export const generatePackageReport = async (req, res) => {
  try {
    const { id } = req.params;

    const paquete = await InvoicesPackage.findById(id);
    if (!paquete) {
      return res.status(404).json({
        success: false,
        message: "Paquete de facturas no encontrado.",
      });
    }

    // Verificar que el paquete esté en estatus "Programado"
    if (paquete.estatus !== "Programado") {
      return res.status(400).json({
        success: false,
        message:
          'Solo se pueden generar reportes para paquetes con estatus "Programado".',
      });
    }

    // Cambiar el estatus a "PorFondear"
    paquete.estatus = "PorFondear";
    await paquete.save();

    // Registrar el cambio de estatus en el timeline
    if (req.user && req.user._id) {
      await timelineService.registerStatusChange(
        req.user._id, // userId del usuario autenticado
        paquete._id, // packageId
        "PorFondear" // nuevo estatus
      );
    }

    // Obtener el paquete actualizado
    const paqueteActualizado = await InvoicesPackage.findById(id).populate({
      path: "packageCompanyId",
      populate: ["companyId", "brandId", "branchId"],
    });

    res.status(200).json({
      success: true,
      message: "Reporte generado correctamente. Paquete listo para fondear.",
      data: paqueteActualizado,
    });
  } catch (error) {
    console.error("Error generating package report:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// POST - Solicitar fondeo para paquetes de una razón social y cuenta bancaria
export const requestFunding = async (req, res) => {
  try {
    const { companyId, bankAccountId, packageIds } = req.body;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "companyId y bankAccountId son requeridos.",
      });
    }

    // Importar modelos necesarios
    const { ScheduledPayment } = await import("../models/ScheduledPayment.js");
    const { BankAccount } = await import("../models/BankAccount.js");

    // Buscar todos los pagos programados para esta combinación
    const scheduledPayments = await ScheduledPayment.find({
      companyId,
      bankAccountId,
    }).populate("packageId");

    // Filtrar los paquetes según los criterios
    let packagesToFund;
    if (packageIds && Array.isArray(packageIds) && packageIds.length > 0) {
      // Si se especifican packageIds, usar solo esos
      packagesToFund = scheduledPayments.filter(
        (sp) =>
          sp.packageId &&
          sp.packageId.estatus === "PorFondear" &&
          packageIds.includes(sp.packageId._id.toString())
      );
    } else {
      // Si no se especifican, usar todos los "PorFondear" (comportamiento anterior)
      packagesToFund = scheduledPayments.filter(
        (sp) => sp.packageId && sp.packageId.estatus === "PorFondear"
      );
    }

    if (packagesToFund.length === 0) {
      const message =
        packageIds && packageIds.length > 0
          ? "No se encontraron paquetes válidos para fondear con los IDs especificados."
          : "No hay paquetes por fondear para esta razón social y cuenta bancaria.";
      return res.status(400).json({
        success: false,
        message: message,
      });
    }

    // Calcular el total a fondear
    const totalToFund = packagesToFund.reduce((sum, sp) => {
      return sum + (sp.packageId.totalPagado || 0);
    }, 0);

    // Obtener la cuenta bancaria
    const bankAccount = await BankAccount.findById(bankAccountId);
    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: "Cuenta bancaria no encontrada.",
      });
    }

    // Verificar que hay suficiente saldo inicial
    // Actualizar solo el currentBalance de la cuenta bancaria
    bankAccount.currentBalance -= totalToFund;
    await bankAccount.save();

    // Cambiar el estatus de todos los paquetes a "Fondeado" y registrar en timeline
    for (const sp of packagesToFund) {
      const packageId = sp.packageId._id;

      // Cambiar estatus del paquete
      await InvoicesPackage.findByIdAndUpdate(packageId, {
        estatus: "Fondeado",
      });

      // Registrar en timeline
      if (req.user && req.user._id) {
        await timelineService.registerStatusChange(
          req.user._id,
          packageId,
          "Fondeado"
        );
      }

      packageIds.push(packageId);
    }

    res.status(200).json({
      success: true,
      message: `Fondeo completado exitosamente. ${packagesToFund.length} paquetes fondeados.`,
      data: {
        totalFunded: totalToFund,
        packagesCount: packagesToFund.length,
        packageIds: packageIds,
        newCurrentBalance: bankAccount.currentBalance,
        initialBalance: bankAccount.initialBalance,
      },
    });
  } catch (error) {
    console.error("Error requesting funding:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// GET - Obtener paquetes por fondear para preview
export const getPackagesToFund = async (req, res) => {
  try {
    const { companyId, bankAccountId } = req.query;

    if (!companyId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: "companyId y bankAccountId son requeridos.",
      });
    }

    // Importar modelo necesario
    const { ScheduledPayment } = await import("../models/ScheduledPayment.js");

    // Buscar todos los pagos programados para esta combinación
    const scheduledPayments = await ScheduledPayment.find({
      companyId,
      bankAccountId,
    }).populate("packageId");

    // Filtrar solo los paquetes con estatus "Programado"
    const packagesToFund = scheduledPayments.filter(
      (sp) => sp.packageId && sp.packageId.estatus === "Programado"
    );

    // Calcular el total
    const total = packagesToFund.reduce((sum, sp) => {
      return sum + (sp.packageId.totalPagado || 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        packages: packagesToFund.map((sp) => ({
          _id: sp.packageId._id,
          folio: sp.packageId.folio,
          totalPagado: sp.packageId.totalPagado,
          departamento: sp.packageId.departamento,
          fechaPago: sp.packageId.fechaPago,
          facturas: sp.packageId.facturas || [],
        })),
        total: total,
        count: packagesToFund.length,
      },
    });
  } catch (error) {
    console.error("Error getting packages to fund:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// GET - Obtener relaciones paquete-sucursal/marca
export const getPackageCompanyRelations = async (req, res) => {
  try {
    const { packageIds } = req.query;

    if (!packageIds) {
      return res.status(400).json({
        success: false,
        message: "packageIds es requerido.",
      });
    }

    // Convertir packageIds de string a array
    const packageIdsArray = packageIds.split(",");

    // Validar que todos los IDs sean ObjectIds válidos
    const validPackageIds = packageIdsArray.filter((id) => {
      return mongoose.Types.ObjectId.isValid(id);
    });

    if (validPackageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron IDs de paquetes válidos.",
      });
    }

    // Buscar las relaciones en la colección rs_invoices_packages_companies
    const relations = await InvoicesPackageCompany.find({
      packageId: { $in: validPackageIds },
    }).populate([
      {
        path: "companyId",
        select: "_id name",
      },
      {
        path: "brandId",
        select: "_id name",
      },
      {
        path: "branchId",
        select: "_id name",
      },
    ]);

    res.status(200).json({
      success: true,
      data: relations,
    });
  } catch (error) {
    console.error("Error getting package company relations:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// POST - Actualizar estatus de múltiples paquetes a "Generado"
export const updatePackagesToGenerated = async (req, res) => {
  try {
    const { packageIds } = req.body;

    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "packageIds es requerido y debe ser un array no vacío.",
      });
    }

    // Validar que todos los IDs sean ObjectIds válidos
    const validPackageIds = packageIds.filter((id) => {
      return mongoose.Types.ObjectId.isValid(id);
    });

    if (validPackageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron IDs de paquetes válidos.",
      });
    }

    // Buscar los paquetes existentes
    const packages = await InvoicesPackage.find({
      _id: { $in: validPackageIds },
    });

    if (packages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron paquetes con los IDs proporcionados.",
      });
    }

    // Actualizar el estatus de todos los paquetes a "Generado"
    const updatePromises = packages.map(async (paquete) => {
      paquete.estatus = "Generado";
      await paquete.save();

      // Registrar el cambio de estatus en el timeline
      if (req.user && req.user._id) {
        await timelineService.registerStatusChange(
          req.user._id,
          paquete._id,
          "Generado"
        );
      }

      return paquete._id;
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `${packages.length} paquetes actualizados a estatus "Generado" exitosamente.`,
      data: {
        updatedCount: packages.length,
        packageIds: packages.map((p) => p._id),
      },
    });
  } catch (error) {
    console.error("Error updating packages to generated status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// DELETE - Eliminar factura específica del arreglo embebido en el paquete
export const removeInvoiceFromPackage = async (req, res) => {
  try {
    const { packageId, invoiceId } = req.params;

    // Validar que los IDs sean ObjectIds válidos
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        message: "ID de paquete inválido.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "ID de factura inválido.",
      });
    }

    // Buscar el paquete
    const paquete = await InvoicesPackage.findById(packageId);
    if (!paquete) {
      return res.status(404).json({
        success: false,
        message: "Paquete no encontrado.",
      });
    }

    // Solo permitir eliminación en paquetes con estatus "Borrador"
    if (paquete.estatus !== "Borrador") {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar facturas de paquetes en estatus "Borrador".',
      });
    }

    // Verificar que la factura existe en el paquete
    const facturaIndex = paquete.facturas.findIndex(
      (f) => f._id.toString() === invoiceId
    );

    if (facturaIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada en el paquete.",
      });
    }

    // Obtener la factura embebida antes de eliminarla para calcular el monto a restar
    const facturaEmbebida = paquete.facturas[facturaIndex];
    const importePagadoEmbebido = parseFloat(facturaEmbebida.importePagado) || 0;

    // Eliminar la factura del arreglo
    paquete.facturas.splice(facturaIndex, 1);

    // Actualizar totales y guardar
    await paquete.actualizarTotales();
    await paquete.save();

    // Actualizar la factura original: solo restar el importePagado del pago parcial eliminado
    // NO resetear completamente para no afectar otros paquetes
    const facturaOriginal = await ImportedInvoices.findById(invoiceId);
    if (facturaOriginal) {
      const importePagadoActual = parseFloat(facturaOriginal.importePagado) || 0;
      const nuevoImportePagado = Math.max(0, importePagadoActual - importePagadoEmbebido);
      
      // Solo actualizar campos relacionados con el pago, NO resetear completamente
      const datosActualizacion = {
        importePagado: nuevoImportePagado,
        esCompleta: nuevoImportePagado >= facturaOriginal.importeAPagar,
        estadoPago: nuevoImportePagado > 0 ? 1 : 0, // 1 si tiene pagos, 0 si no
        fechaRevision: new Date(),
      };

      // Solo resetear autorización si ya no hay pagos
      if (nuevoImportePagado === 0) {
        datosActualizacion.autorizada = null;
        datosActualizacion.pagoRechazado = false;
        datosActualizacion.registrado = 0;
        datosActualizacion.pagado = 0;
        datosActualizacion.estaRegistrada = false;
      }

      await ImportedInvoices.findByIdAndUpdate(invoiceId, {
        $set: datosActualizacion,
      });

      console.log(`✅ Factura original actualizada: importePagado ${importePagadoActual} → ${nuevoImportePagado} (restado ${importePagadoEmbebido})`);
    }

    res.status(200).json({
      success: true,
      message: "Factura eliminada del paquete exitosamente.",
      data: {
        packageId: paquete._id,
        removedInvoiceId: invoiceId,
        remainingInvoicesCount: paquete.facturas.length,
        newTotalImporte: paquete.totalImporteAPagar,
        newTotalPagado: paquete.totalPagado,
      },
    });
  } catch (error) {
    console.error("Error removing invoice from package:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// DELETE - Eliminar pago en efectivo específico del arreglo embebido en el paquete
export const removeCashPaymentFromPackage = async (req, res) => {
  try {
    const { packageId, cashPaymentId } = req.params;

    // Validar que los IDs sean ObjectIds válidos
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        success: false,
        message: "ID de paquete inválido.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(cashPaymentId)) {
      return res.status(400).json({
        success: false,
        message: "ID de pago en efectivo inválido.",
      });
    }

    // Buscar el paquete
    const paquete = await InvoicesPackage.findById(packageId);
    if (!paquete) {
      return res.status(404).json({
        success: false,
        message: "Paquete no encontrado.",
      });
    }

    // Solo permitir eliminación en paquetes con estatus "Borrador"
    if (paquete.estatus !== "Borrador") {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar pagos en efectivo de paquetes en estatus "Borrador".',
      });
    }

    // Verificar que el pago en efectivo existe en el paquete
    const pagoIndex = paquete.pagosEfectivo.findIndex(
      (p) => p._id.toString() === cashPaymentId
    );

    if (pagoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Pago en efectivo no encontrado en el paquete.",
      });
    }

    // Eliminar el pago del arreglo
    paquete.pagosEfectivo.splice(pagoIndex, 1);

    // Actualizar totales y guardar
    await paquete.actualizarTotales();
    await paquete.save();

    res.status(200).json({
      success: true,
      message: "Pago en efectivo eliminado del paquete exitosamente.",
      data: {
        packageId: paquete._id,
        removedCashPaymentId: cashPaymentId,
        remainingCashPaymentsCount: paquete.pagosEfectivo.length,
        newTotalImporte: paquete.totalImporteAPagar,
        newTotalPagado: paquete.totalPagado,
      },
    });
  } catch (error) {
    console.error("Error removing cash payment from package:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};

// PATCH - Cambiar estado activo de un paquete
export const toggleInvoicesPackageActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de paquete inválido.",
      });
    }

    const paquete = await InvoicesPackage.findById(id);

    if (!paquete) {
      return res.status(404).json({
        success: false,
        message: "Paquete no encontrado.",
      });
    }

    // Validar que no se pueda desactivar paquetes con estatus "Generado" o "Programado"
    if (
      active === false &&
      (paquete.estatus === "Generado" || paquete.estatus === "Programado")
    ) {
      return res.status(400).json({
        success: false,
        message:
          'No se puede desactivar un paquete con estatus "Generado" o "Programado".',
      });
    }

    paquete.active = active;
    await paquete.save();

    // Registrar el cambio en el timeline
    if (req.user && req.user._id) {
      await timelineService.registerStatusChange(
        req.user._id,
        paquete._id,
        active ? "Activado" : "Desactivado"
      );
    }

    res.status(200).json({
      success: true,
      message: `Paquete ${active ? "activado" : "desactivado"} exitosamente.`,
      data: {
        _id: paquete._id,
        active: paquete.active,
        estatus: paquete.estatus,
      },
    });
  } catch (error) {
    console.error("Error toggling package active status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor.",
    });
  }
};
