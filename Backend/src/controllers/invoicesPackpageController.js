import { InvoicesPackage } from "../models/InvoicesPackpage.js";
import { ImportedInvoices } from "../models/ImportedInvoices.js";
import { InvoicesPackageCompany } from "../models/InvoicesPackpageCompany.js";
import { ExpenseConcept } from "../models/ExpenseConcept.js";
import { RoleVisibility } from "../models/RoleVisibility.js";
import { CashPayment } from "../models/CashPayment.js";
import { Budget } from "../models/Budget.js";
import { Brand } from "../models/Brand.js";
import { Company } from "../models/Company.js";

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
            pagosEfectivo
        } = req.body;

        // Validar datos requeridos - debe haber al menos facturas o pagos en efectivo
        const tieneFacturas = facturas && Array.isArray(facturas) && facturas.length > 0;
        const tienePagosEfectivo = pagosEfectivo && Array.isArray(pagosEfectivo) && pagosEfectivo.length > 0;

        if (!tieneFacturas && !tienePagosEfectivo) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere al menos una factura o un pago en efectivo para crear el paquete.'
            });
        }

        if (!usuario_id || !departamento_id || !departamento || !fechaPago) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos: usuario_id, departamento_id, departamento, fechaPago.'
            });
        }

        // Verificar que las facturas existan y pertenezcan al mismo receptor (solo si hay facturas)
        let facturasExistentes = [];
        if (tieneFacturas) {
            facturasExistentes = await ImportedInvoices.find({
                _id: { $in: facturas }
            }).populate('razonSocial');

            if (facturasExistentes.length !== facturas.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Una o más facturas no existen.'
                });
            }

            // Verificar que todas las facturas pertenezcan al mismo receptor
            const rfcReceptor = facturasExistentes[0].rfcReceptor;
            const facturasConReceptorDiferente = facturasExistentes.filter(
                factura => factura.rfcReceptor !== rfcReceptor
            );

            if (facturasConReceptorDiferente.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Todas las facturas deben pertenecer al mismo receptor.'
                });
            }

            // Verificar que no haya facturas duplicadas en el mismo paquete
            const facturasDuplicadas = facturas.filter((facturaId, index) =>
                facturas.indexOf(facturaId) !== index
            );

            if (facturasDuplicadas.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pueden agregar facturas duplicadas al mismo paquete.'
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
                        fechaRevision: new Date()
                    }
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
            const conceptosIds = Object.values(conceptosGasto).map(id => new mongoose.Types.ObjectId(id));
            const conceptosDocs = await ExpenseConcept.find({ _id: { $in: conceptosIds } });
            conceptosGastoMap = conceptosDocs.reduce((acc, concepto) => {
                acc[concepto._id.toString()] = {
                    id: concepto._id,
                    name: concepto.name,
                    descripcion: concepto.description
                };
                return acc;
            }, {});
        }

        // Preparar las facturas embebidas con todos sus datos (solo si hay facturas)
        let facturasEmbebidas = [];
        if (tieneFacturas) {
            facturasEmbebidas = facturasExistentes.map(factura => {
                const facturaData = factura.toObject();
                // Asegurar que el _id esté presente
                facturaData._id = factura._id;

                // FORZAR que autorizada sea null (pendiente) al crear el paquete
                facturaData.autorizada = null;
                facturaData.estadoPago = 0;
                facturaData.esCompleta = false;
                facturaData.pagoRechazado = false;
                facturaData.estaRegistrada = true;
                facturaData.registrado = 1;
                facturaData.fechaRevision = new Date();

                // Asignar concepto de gasto si se proporciona para esta factura
                if (conceptosGasto && conceptosGasto[factura._id.toString()]) {
                    const conceptoId = conceptosGasto[factura._id.toString()];
                    if (conceptosGastoMap[conceptoId]) {
                        facturaData.conceptoGasto = conceptosGastoMap[conceptoId];
                    }
                }

                // Asegurar que razonSocial tenga la estructura correcta
                if (facturaData.razonSocial && typeof facturaData.razonSocial === 'object' && facturaData.razonSocial._id) {
                    facturaData.razonSocial = {
                        _id: facturaData.razonSocial._id,
                        name: facturaData.razonSocial.name || '',
                        rfc: facturaData.razonSocial.rfc || ''
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
                // Si el pago ya existe (tiene _id), lo buscamos, si no, lo creamos
                let pagoDoc;
                if (pago._id) {
                    pagoDoc = await CashPayment.findById(pago._id);
                } else {
                    pagoDoc = await CashPayment.create({
                        importeAPagar: pago.importeAPagar,
                        expenseConcept: pago.expenseConcept,
                        description: pago.description,
                        importePagado: pago.importeAPagar // Guardar como importeAPagar al crear
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
                pagoData.descripcionPago = '';
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
            folio: siguienteFolio
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
                companyId: new mongoose.Types.ObjectId(companyId)
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

        // Obtener el paquete con las facturas embebidas
        const paqueteCompleto = await InvoicesPackage.findById(paqueteGuardado._id)
            .populate({
                path: 'packageCompanyId',
                populate: ['companyId', 'brandId', 'branchId']
            });

        res.status(201).json({
            success: true,
            message: 'Paquete de facturas creado exitosamente.',
            data: paqueteCompleto
        });

    } catch (error) {
        console.error('Error creating invoices package:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
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
            sortBy = 'fechaCreacion',
            order = 'desc'
        } = req.query;

        // Construir filtros
        const filtros = {};
        if (estatus) filtros.estatus = estatus;
        if (usuario_id) filtros.usuario_id = new mongoose.Types.ObjectId(usuario_id);
        if (departamento_id) filtros.departamento_id = parseInt(departamento_id);

        // Opciones de ordenamiento
        const sortOptions = { [sortBy]: order === 'asc' ? 1 : -1 };

        // Consulta con paginación
        const paquetesPromise = InvoicesPackage.find(filtros)
            .populate({
                path: 'packageCompanyId',
                populate: ['companyId', 'brandId', 'branchId']
            })
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean({ getters: true });

        const countPromise = InvoicesPackage.countDocuments(filtros);

        const [paquetes, count] = await Promise.all([paquetesPromise, countPromise]);

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
        console.error('Error getting invoices packages:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// READ - Obtener un paquete específico por ID
export const getInvoicesPackageById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Buscando paquete con ID:', id);

        const paquete = await InvoicesPackage.findById(id)
            .populate({
                path: 'packageCompanyId',
                populate: ['companyId', 'brandId', 'branchId']
            });

        if (!paquete) {
            return res.status(404).json({
                success: false,
                message: 'Paquete de facturas no encontrado.'
            });
        }

        // Normalización de datos para el frontend
        function normalizeFactura(f) {
            const toNumber = v => (typeof v === 'object' && v !== null && v._bsontype === 'Decimal128') ? parseFloat(v.toString()) : v;
            const toString = v => (typeof v === 'object' && v !== null && v._bsontype === 'ObjectId') ? v.toString() : v;

            // Normalizar razonSocial - puede ser un ObjectId o un objeto populado
            let razonSocialNormalizada;
            if (f.razonSocial && typeof f.razonSocial === 'object' && f.razonSocial._id) {
                // Si está populado, mantener la estructura
                razonSocialNormalizada = {
                    _id: toString(f.razonSocial._id),
                    name: f.razonSocial.name || '',
                    rfc: f.razonSocial.rfc || ''
                };
            } else {
                // Si es solo un ObjectId, crear estructura básica
                razonSocialNormalizada = {
                    _id: toString(f.razonSocial),
                    name: '',
                    rfc: ''
                };
            }

            return {
                ...f._doc,
                _id: toString(f._id),
                importeAPagar: toNumber(f.importeAPagar),
                importePagado: toNumber(f.importePagado),
                razonSocial: razonSocialNormalizada,
                fechaEmision: f.fechaEmision ? new Date(f.fechaEmision).toISOString() : null,
                fechaCertificacionSAT: f.fechaCertificacionSAT ? new Date(f.fechaCertificacionSAT).toISOString() : null,
                fechaCancelacion: f.fechaCancelacion ? new Date(f.fechaCancelacion).toISOString() : null,
                fechaRevision: f.fechaRevision ? new Date(f.fechaRevision).toISOString() : null,
            };
        }

        function normalizePackage(paquete) {
            const toNumber = v => (typeof v === 'object' && v !== null && v._bsontype === 'Decimal128') ? parseFloat(v.toString()) : v;
            const toString = v => (typeof v === 'object' && v !== null && v._bsontype === 'ObjectId') ? v.toString() : v;
            return {
                ...paquete._doc,
                _id: toString(paquete._id),
                usuario_id: toString(paquete.usuario_id),
                departamento_id: toString(paquete.departamento_id),
                packageCompanyId: paquete.packageCompanyId ? toString(paquete.packageCompanyId._id) : null,
                totalImporteAPagar: toNumber(paquete.totalImporteAPagar),
                totalPagado: toNumber(paquete.totalPagado),
                fechaPago: paquete.fechaPago ? new Date(paquete.fechaPago).toISOString() : null,
                fechaCreacion: paquete.fechaCreacion ? new Date(paquete.fechaCreacion).toISOString() : null,
                createdAt: paquete.createdAt ? new Date(paquete.createdAt).toISOString() : null,
                updatedAt: paquete.updatedAt ? new Date(paquete.updatedAt).toISOString() : null,
                facturas: (paquete.facturas || []).map(normalizeFactura),
                // Agregar información de la relación Company, Brand, Branch
                companyInfo: paquete.packageCompanyId ? {
                    companyId: paquete.packageCompanyId.companyId ? toString(paquete.packageCompanyId.companyId._id) : null,
                    companyName: paquete.packageCompanyId.companyId ? paquete.packageCompanyId.companyId.name : null,
                    brandId: paquete.packageCompanyId.brandId ? toString(paquete.packageCompanyId.brandId._id) : null,
                    brandName: paquete.packageCompanyId.brandId ? paquete.packageCompanyId.brandId.name : null,
                    branchId: paquete.packageCompanyId.branchId ? toString(paquete.packageCompanyId.branchId._id) : null,
                    branchName: paquete.packageCompanyId.branchId ? paquete.packageCompanyId.branchId.name : null,
                } : null
            };
        }

        res.status(200).json({
            success: true,
            data: normalizePackage(paquete),
            message: 'Paquete de facturas encontrado exitosamente.'
        });

    } catch (error) {
        console.error('Error getting invoices package by id:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
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
            branchId
        } = req.body;

        // Buscar el paquete existente
        const paqueteExistente = await InvoicesPackage.findById(id);
        if (!paqueteExistente) {
            return res.status(404).json({
                success: false,
                message: 'Paquete de facturas no encontrado.'
            });
        }

        // Si se están actualizando las facturas, validar
        let facturasExistentes = [];
        if (facturas && Array.isArray(facturas)) {
            if (facturas.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El paquete debe contener al menos una factura.'
                });
            }

            // Verificar que las nuevas facturas existan
            facturasExistentes = await ImportedInvoices.find({
                _id: { $in: facturas }
            }).populate('razonSocial');

            if (facturasExistentes.length !== facturas.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Una o más facturas no existen.'
                });
            }

            // Verificar que no haya facturas duplicadas en el mismo paquete
            const facturasDuplicadas = facturas.filter((facturaId, index) =>
                facturas.indexOf(facturaId) !== index
            );

            if (facturasDuplicadas.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pueden agregar facturas duplicadas al mismo paquete.'
                });
            }

            // Identificar facturas que se están agregando al paquete (nuevas)
            const facturasActualesIds = paqueteExistente.facturas.map(f => f._id.toString());
            const facturasNuevas = facturas.filter(facturaId =>
                !facturasActualesIds.includes(facturaId.toString())
            );

            // Verificar que las facturas completamente pagadas no estén ya en el paquete
            const facturasCompletamentePagadas = facturasExistentes.filter(f =>
                f.importePagado >= f.importeAPagar
            );
            const facturasCompletamentePagadasEnPaquete = paqueteExistente.facturas.filter(facturaEmbebida => {
                const factura = facturasExistentes.find(f => f._id.toString() === facturaEmbebida._id.toString());
                return factura && factura.importePagado >= factura.importeAPagar;
            });

            const facturasCompletamentePagadasDuplicadas = facturasCompletamentePagadas.filter(f =>
                facturasCompletamentePagadasEnPaquete.some(fe => fe._id.toString() === f._id.toString())
            );

            if (facturasCompletamentePagadasDuplicadas.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pueden agregar facturas completamente pagadas que ya están en el paquete.'
                });
            }

            // Procesar solo las facturas nuevas que se están agregando al paquete
            if (facturasNuevas.length > 0) {
                for (const facturaId of facturasNuevas) {
                    const factura = facturasExistentes.find(f => f._id.toString() === facturaId.toString());

                    if (factura) {
                        const datosAgregacion = {
                            descripcionPago: comentario || 'Agregada al paquete',
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

                        await ImportedInvoices.findByIdAndUpdate(facturaId, { $set: datosAgregacion });
                    }
                }
            }
        }

        // Actualizar el paquete
        const datosActualizacion = {};
        if (facturas) {
            // En lugar de reemplazar todas las facturas, agregar solo las nuevas
            const facturasActualesIds = paqueteExistente.facturas.map(f => f._id.toString());
            const facturasNuevas = facturas.filter(f => !facturasActualesIds.includes(f.toString()));

            if (facturasNuevas.length > 0) {
                // Obtener los datos completos de las nuevas facturas
                const nuevasFacturasEmbebidas = facturasExistentes
                    .filter(f => facturasNuevas.includes(f._id.toString()))
                    .map(factura => {
                        const facturaData = factura.toObject();
                        facturaData._id = factura._id;

                        // FORZAR que autorizada sea null (pendiente) al agregar al paquete
                        facturaData.autorizada = null;
                        facturaData.estadoPago = 0;
                        facturaData.esCompleta = false;
                        facturaData.pagoRechazado = false;
                        facturaData.estaRegistrada = true;
                        facturaData.registrado = 1;
                        facturaData.fechaRevision = new Date();

                        // Asegurar que razonSocial tenga la estructura correcta
                        if (facturaData.razonSocial && typeof facturaData.razonSocial === 'object' && facturaData.razonSocial._id) {
                            facturaData.razonSocial = {
                                _id: facturaData.razonSocial._id,
                                name: facturaData.razonSocial.name || '',
                                rfc: facturaData.razonSocial.rfc || ''
                            };
                        }

                        return facturaData;
                    });

                // Agregar las nuevas facturas embebidas al array existente
                datosActualizacion.facturas = [...paqueteExistente.facturas, ...nuevasFacturasEmbebidas];
            }
        }
        if (estatus) datosActualizacion.estatus = estatus;
        if (departamento_id) datosActualizacion.departamento_id = departamento_id;
        if (departamento) datosActualizacion.departamento = departamento;
        if (comentario !== undefined) datosActualizacion.comentario = comentario;
        if (fechaPago) {
            // La fechaPago ya viene calculada desde el frontend como el jueves de la semana siguiente
            // Ajustar la hora a las 12:00 UTC para evitar desfases de zona horaria
            const fechaPagoParaGuardar = new Date(fechaPago);
            fechaPagoParaGuardar.setUTCHours(12, 0, 0, 0);
            datosActualizacion.fechaPago = fechaPagoParaGuardar;
        }
        // NO establecer totalImporteAPagar desde frontend - se calculará automáticamente

        const paqueteActualizado = await InvoicesPackage.findByIdAndUpdate(
            id,
            { $set: datosActualizacion },
            { new: true, runValidators: true }
        );

        // Siempre recalcular totales para asegurar consistencia
        await paqueteActualizado.actualizarTotales();

        // Actualizar la relación con Company, Brand, Branch si se proporcionan
        if (companyId !== undefined) {
            if (paqueteExistente.packageCompanyId) {
                // Actualizar relación existente
                const packageCompanyData = {
                    companyId: new mongoose.Types.ObjectId(companyId)
                };

                if (brandId !== undefined) {
                    packageCompanyData.brandId = brandId ? new mongoose.Types.ObjectId(brandId) : null;
                }

                if (branchId !== undefined) {
                    packageCompanyData.branchId = branchId ? new mongoose.Types.ObjectId(branchId) : null;
                }

                await InvoicesPackageCompany.findByIdAndUpdate(
                    paqueteExistente.packageCompanyId,
                    { $set: packageCompanyData }
                );
            } else if (companyId) {
                // Crear nueva relación
                const packageCompanyData = {
                    packageId: id,
                    companyId: new mongoose.Types.ObjectId(companyId)
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
                path: 'packageCompanyId',
                populate: ['companyId', 'brandId', 'branchId']
            });

        res.status(200).json({
            success: true,
            message: 'Paquete de facturas actualizado exitosamente.',
            data: paqueteCompleto
        });

    } catch (error) {
        console.error('Error updating invoices package:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
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
                message: 'Paquete de facturas no encontrado.'
            });
        }

        // Verificar que el paquete no esté pagado
        if (paquete.estatus === 'Pagado') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar un paquete que ya ha sido pagado.'
            });
        }

        // Actualizar las facturas para removerlas del paquete
        const datosRemocion = {
            descripcionPago: 'Paquete eliminado',
            estadoPago: 0, // Pendiente
            registrado: 0, // No registrado
            fechaRevision: new Date()
        };

        // Extraer los IDs de las facturas embebidas
        const facturaIds = paquete.facturas.map(f => f._id);

        await Promise.all([
            // Actualizar facturas
            ImportedInvoices.updateMany(
                { _id: { $in: facturaIds } },
                { $set: datosRemocion }
            ),
            // Eliminar la relación con Company, Brand, Branch si existe
            paquete.packageCompanyId ? InvoicesPackageCompany.findByIdAndDelete(paquete.packageCompanyId) : Promise.resolve()
        ]);

        // Eliminar el paquete
        await InvoicesPackage.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Paquete de facturas eliminado exitosamente.'
        });

    } catch (error) {
        console.error('Error deleting invoices package:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// Función adicional: Obtener resumen de paquetes
export const getInvoicesPackagesSummary = async (req, res) => {
    try {
        const { usuario_id } = req.query;

        // Convertir a ObjectId si se proporciona
        const usuarioObjectId = usuario_id ? new mongoose.Types.ObjectId(usuario_id) : null;
        const resumen = await InvoicesPackage.obtenerResumen(usuarioObjectId);

        res.status(200).json({
            success: true,
            data: resumen
        });

    } catch (error) {
        console.error('Error getting invoices packages summary:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// Función adicional: Buscar paquetes vencidos
export const getVencidosInvoicesPackages = async (req, res) => {
    try {
        const paquetesVencidos = await InvoicesPackage.buscarVencidos();

        res.status(200).json({
            success: true,
            data: paquetesVencidos
        });

    } catch (error) {
        console.error('Error getting vencidos invoices packages:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
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
                message: 'El estatus es requerido.'
            });
        }

        const paquete = await InvoicesPackage.findById(id);
        if (!paquete) {
            return res.status(404).json({
                success: false,
                message: 'Paquete de facturas no encontrado.'
            });
        }

        // Si se marca como pagado, actualizar las facturas
        if (estatus === 'Pagado') {
            const datosPago = {
                importePagado: 0, // Se mantiene el valor actual
                esCompleta: true,
                estadoPago: 2, // Pagado
                fechaRevision: new Date()
            };

            // Extraer los IDs de las facturas embebidas
            const facturaIds = paquete.facturas.map(f => f._id);

            await Promise.all(
                facturaIds.map(facturaId =>
                    ImportedInvoices.findByIdAndUpdate(facturaId, { $set: datosPago })
                )
            );
        }

        // Cambiar el estatus
        await paquete.cambiarEstatus(estatus);

        const paqueteActualizado = await InvoicesPackage.findById(id);

        res.status(200).json({
            success: true,
            message: 'Estatus del paquete actualizado exitosamente.',
            data: paqueteActualizado
        });

    } catch (error) {
        console.error('Error changing invoices package status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// GET - Obtener paquetes por usuario_id con filtrado por visibilidad
export const getInvoicesPackagesByUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.query;
        if (!usuario_id) {
            return res.status(400).json({ success: false, message: 'usuario_id es requerido' });
        }

        // Convertir a ObjectId
        const usuarioObjectId = new mongoose.Types.ObjectId(usuario_id);



        // Obtener la visibilidad del usuario
        const userVisibility = await RoleVisibility.findOne({ userId: usuarioObjectId });

        let packageIds = [];

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
                const brandConditions = brands.map(brand => ({
                    companyId: brand.companyId,
                    brandId: brand.brandId
                }));
                filterConditions.push({ $or: brandConditions });
            }

            // Si tiene acceso a sucursales específicas
            if (branches && branches.length > 0) {
                const branchConditions = branches.map(branch => ({
                    companyId: branch.companyId,
                    brandId: branch.brandId,
                    branchId: branch.branchId
                }));
                filterConditions.push({ $or: branchConditions });
            }

            // Si no hay filtros específicos, el usuario no tiene acceso a nada
            if (filterConditions.length === 0) {
                return res.status(200).json({ success: true, data: [] });
            }

            // Buscar paquetes en la tabla relacional que coincidan con la visibilidad
            const packageRelations = await InvoicesPackageCompany.find({
                $or: filterConditions
            });

            packageIds = packageRelations.map(rel => rel.packageId);

            // Si no hay paquetes relacionados, devolver array vacío
            if (packageIds.length === 0) {
                return res.status(200).json({ success: true, data: [] });
            }
        }

        // Construir la consulta de paquetes
        let paquetesQuery = InvoicesPackage.find();

        if (userVisibility && packageIds.length > 0) {
            // Filtrar por los paquetes que el usuario puede ver
            paquetesQuery = paquetesQuery.find({
                $or: [
                    { _id: { $in: packageIds } },
                    { usuario_id: usuarioObjectId } // También incluir paquetes creados por el usuario
                ]
            });
        } else {
            // Si no hay visibilidad configurada, mostrar todos los paquetes del usuario
            paquetesQuery = paquetesQuery.find({ usuario_id: usuarioObjectId });
        }

        const paquetes = await paquetesQuery
            .populate({
                path: 'packageCompanyId',
                populate: ['companyId', 'brandId', 'branchId']
            });

        // Agregar headers para evitar caché
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.status(200).json({ success: true, data: paquetes });
    } catch (error) {
        console.error('Error en getInvoicesPackagesByUsuario:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET - Obtener paquetes creados por el usuario (sin filtrado de visibilidad)
export const getInvoicesPackagesCreatedByUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.query;
        if (!usuario_id) {
            return res.status(400).json({ success: false, message: 'usuario_id es requerido' });
        }

        // Convertir a ObjectId
        const usuarioObjectId = new mongoose.Types.ObjectId(usuario_id);

        // Obtener solo los paquetes creados por el usuario (sin filtrado de visibilidad)
        const paquetes = await InvoicesPackage.find({ usuario_id: usuarioObjectId })
            .populate({
                path: 'packageCompanyId',
                populate: ['companyId', 'brandId', 'branchId']
            })
            .sort({ createdAt: -1 }); // Ordenar por fecha de creación descendente

        // Agregar headers para evitar caché
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.status(200).json({ success: true, data: paquetes });
    } catch (error) {
        console.error('Error en getInvoicesPackagesCreatedByUsuario:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Función para actualizar totales de paquetes cuando se desautoriza una factura
export const actualizarTotalesPaquetesPorFactura = async (facturaId) => {
    try {
        // Buscar todos los paquetes que contengan esta factura por _id
        const paquetes = await InvoicesPackage.find({
            'facturas._id': facturaId
        });

        // Actualizar los totales de cada paquete
        for (const paquete of paquetes) {
            await paquete.actualizarTotales();
        }

        console.log(`Totales actualizados para ${paquetes.length} paquetes que contienen la factura ${facturaId}`);
    } catch (error) {
        console.error('Error actualizando totales de paquetes:', error);
    }
};

// Función para actualizar una factura embebida en todos los paquetes que la contengan
export const actualizarFacturaEnPaquetes = async (facturaId, datosActualizados) => {
    try {
        // Preparar los campos a actualizar
        const camposActualizacion = {
            'facturas.$.autorizada': datosActualizados.autorizada,
            'facturas.$.pagoRechazado': datosActualizados.pagoRechazado,
            'facturas.$.estadoPago': datosActualizados.estadoPago,
            'facturas.$.esCompleta': datosActualizados.esCompleta,
            'facturas.$.pagado': datosActualizados.pagado || 0,
            'facturas.$.descripcionPago': datosActualizados.descripcionPago || ''
        };

        // Solo actualizar importePagado si se está autorizando (no si se está rechazando)
        if (datosActualizados.importePagado !== undefined) {
            camposActualizacion['facturas.$.importePagado'] = datosActualizados.importePagado;
        }

        // Actualizar directamente en la base de datos usando $set
        const result = await InvoicesPackage.updateMany(
            { 'facturas._id': facturaId },
            { $set: camposActualizacion }
        );

        console.log(`Factura embebida actualizada en ${result.modifiedCount} paquetes para la factura ${facturaId}`);
    } catch (error) {
        console.error('Error actualizando factura embebida en paquetes:', error);
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
                message: 'Paquete de facturas no encontrado.'
            });
        }

        // Verificar que todas las facturas estén procesadas (sin pendientes)
        const facturasPendientes = paquete.facturas.filter(f => f.autorizada === null);
        if (facturasPendientes.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede enviar el paquete. Hay facturas pendientes de procesar.'
            });
        }

        // NUEVA LÓGICA: Actualizar las facturas originales según su estado
        const facturasAutorizadas = paquete.facturas.filter(f => f.autorizada === true);
        const facturasRechazadas = paquete.facturas.filter(f => f.autorizada === false);

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
                fechaRevision: new Date()
            };

            await ImportedInvoices.findByIdAndUpdate(
                facturaEmbebida._id,
                { $set: datosActualizacion }
            );
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
                conceptoGasto: null
            };

            await ImportedInvoices.findByIdAndUpdate(
                facturaEmbebida._id,
                { $set: datosReseteo }
            );
        }

        // Cambiar el estatus del paquete a "Enviado"
        paquete.estatus = 'Enviado';
        await paquete.save();

        res.status(200).json({
            success: true,
            message: `Paquete enviado a dirección correctamente. ${facturasAutorizadas.length} facturas autorizadas procesadas. ${facturasRechazadas.length} facturas rechazadas reseteadas a su estado original.`,
            data: paquete
        });

    } catch (error) {
        console.error('Error enviando paquete a dirección:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// GET - Obtener presupuesto por compañía, marca, sucursal y mes
export const getBudgetByCompanyBrandBranch = async (req, res) => {
    try {
        const { companyId, brandId, branchId, month } = req.query;

        // Validar parámetros requeridos
        if (!companyId || !brandId || !branchId || !month) {
            return res.status(400).json({
                success: false,
                message: 'Los parámetros companyId, brandId, branchId y month son requeridos.'
            });
        }

        // Validar formato del mes (YYYY-MM)
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(month)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del mes debe ser YYYY-MM.'
            });
        }

        // Convertir los IDs a ObjectId
        const companyObjectId = new mongoose.Types.ObjectId(companyId);
        const brandObjectId = new mongoose.Types.ObjectId(brandId);
        const branchObjectId = new mongoose.Types.ObjectId(branchId);

        // Buscar la marca para obtener su categoryId
        const brand = await Brand.findById(brandObjectId);
        console.log('getBudgetByCompanyBrandBranch - Marca encontrada:', brand);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Marca no encontrada.'
            });
        }

        console.log('getBudgetByCompanyBrandBranch - CategoryId de la marca:', brand.categoryId);

        if (!brand.categoryId) {
            return res.status(400).json({
                success: false,
                message: 'La marca seleccionada no tiene una categoría asignada.'
            });
        }

        // Obtener la categoría para saber si maneja rutas
        const Category = mongoose.model('cc_category');
        const category = await Category.findById(brand.categoryId);

        console.log('getBudgetByCompanyBrandBranch - Categoría encontrada:', category);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada.'
            });
        }

        // Construir el filtro base
        let filtro = {
            companyId: companyObjectId,
            brandId: brandObjectId,
            branchId: branchObjectId,
            categoryId: brand.categoryId,
            month: month
        };

        // Primero, buscar TODOS los presupuestos para esta combinación (sin filtrar por routeId)
        // para entender qué presupuestos existen
        console.log('getBudgetByCompanyBrandBranch - Buscando TODOS los presupuestos para la combinación...');
        const todosLosPresupuestos = await Budget.find(filtro)
            .populate('routeId')
            .populate('brandId')
            .populate('companyId')
            .populate('branchId')
            .populate('categoryId');

        console.log('getBudgetByCompanyBrandBranch - TODOS los presupuestos encontrados:', todosLosPresupuestos.map(p => ({
            _id: p._id,
            routeId: p.routeId,
            assignedAmount: p.assignedAmount,
            hasRoute: !!p.routeId
        })));

        // Determinar qué presupuesto devolver
        let presupuestoSeleccionado = null;

        if (!category.hasRoutes) {
            // Si la categoría NO maneja rutas, buscar el presupuesto sin routeId
            presupuestoSeleccionado = todosLosPresupuestos.find(p => p.routeId === null);
            console.log('getBudgetByCompanyBrandBranch - Categoría SIN rutas, buscando presupuesto sin routeId');
        } else {
            // Si la categoría SÍ maneja rutas, tenemos opciones:
            // 1. Presupuesto general (routeId null) - presupuesto base
            // 2. Presupuestos específicos por ruta
            // Por ahora, preferir el presupuesto general si existe, sino tomar el primero
            presupuestoSeleccionado = todosLosPresupuestos.find(p => p.routeId === null) || todosLosPresupuestos[0];
            console.log('getBudgetByCompanyBrandBranch - Categoría CON rutas, seleccionando presupuesto:', presupuestoSeleccionado ? (presupuestoSeleccionado.routeId ? 'con ruta específica' : 'general') : 'ninguno');
        }

        // Devolver el presupuesto seleccionado como array (para mantener compatibilidad con frontend)
        const presupuestosRespuesta = presupuestoSeleccionado ? [presupuestoSeleccionado] : [];

        console.log('getBudgetByCompanyBrandBranch - Presupuesto final seleccionado:', presupuestoSeleccionado);
        console.log('getBudgetByCompanyBrandBranch - Cantidad de presupuestos a devolver:', presupuestosRespuesta.length);

        // Agregar headers para evitar caché
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        console.log('getBudgetByCompanyBrandBranch - Respuesta a enviar:', {
            success: true,
            data: presupuestosRespuesta,
            message: `Se encontró ${presupuestosRespuesta.length} presupuesto para los filtros especificados.`
        });

        res.status(200).json({
            success: true,
            data: presupuestosRespuesta,
            message: `Se encontró ${presupuestosRespuesta.length} presupuesto para los filtros especificados.`
        });

    } catch (error) {
        console.error('Error en getBudgetByCompanyBrandBranch:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
}; 