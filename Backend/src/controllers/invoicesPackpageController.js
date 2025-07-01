import { InvoicesPackage } from "../models/InvoicesPackpage.js";
import { ImportedInvoices } from "../models/ImportedInvoices.js";
import { InvoicesPackageCompany } from "../models/InvoicesPackpageCompany.js";
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
            branchId
        } = req.body;

        // Validar datos requeridos
        if (!facturas || !Array.isArray(facturas) || facturas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere al menos una factura para crear el paquete.'
            });
        }

        if (!usuario_id || !departamento_id || !departamento || !fechaPago) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos: usuario_id, departamento_id, departamento, fechaPago.'
            });
        }

        // Verificar que las facturas existan y pertenezcan al mismo receptor
        const facturasExistentes = await ImportedInvoices.find({
            _id: { $in: facturas }
        });

        if (facturasExistentes.length !== facturas.length) {
            return res.status(400).json({
                success: false,
                message: 'Una o más facturas no existen.'
            });
        }

        // Verificar que todas las facturas pertenezcan al mismo receptor
        const rfcReceptor = facturasExistentes[0].rfcReceptor;
        const mismasFacturas = facturasExistentes.every(factura =>
            factura.rfcReceptor === rfcReceptor
        );

        if (!mismasFacturas) {
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
                    autorizada: false, // Pendiente de autorización
                    pagoRechazado: false, // No rechazado inicialmente
                    estaRegistrada: true, // Marcar como registrada en paquete
                    estadoPago: null, // Pendiente de autorización
                    esCompleta: false, // No está completamente pagada hasta que se autorice
                    registrado: 1, // Registrado
                    fechaRevision: new Date()
                }
            }
        );

        // Obtener el siguiente folio
        const siguienteFolio = await InvoicesPackage.obtenerSiguienteFolio();

        // Convertir usuario_id a ObjectId
        const usuarioObjectId = new mongoose.Types.ObjectId(usuario_id);

        // Crear el paquete
        const nuevoPaquete = new InvoicesPackage({
            facturas,
            usuario_id: usuarioObjectId,
            departamento_id,
            departamento,
            comentario,
            fechaPago: new Date(fechaPago),
            totalImporteAPagar: totalImporteAPagar || 0,
            folio: siguienteFolio
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

        // Obtener el paquete con las facturas pobladas
        const paqueteCompleto = await InvoicesPackage.findById(paqueteGuardado._id)
            .populate('facturas')
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
            .populate('facturas')
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
            .populate('facturas')
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
            return {
                ...f._doc,
                _id: toString(f._id),
                importeAPagar: toNumber(f.importeAPagar),
                importePagado: toNumber(f.importePagado),
                razonSocial: toString(f.razonSocial),
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
        if (facturas && Array.isArray(facturas)) {
            if (facturas.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El paquete debe contener al menos una factura.'
                });
            }

            // Verificar que las nuevas facturas existan
            const facturasExistentes = await ImportedInvoices.find({
                _id: { $in: facturas }
            });

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
            const facturasNuevas = facturas.filter(facturaId =>
                !paqueteExistente.facturas.includes(facturaId.toString())
            );

            // Verificar que las facturas completamente pagadas no estén ya en el paquete
            const facturasCompletamentePagadas = facturasExistentes.filter(f =>
                f.importePagado >= f.importeAPagar
            );
            const facturasCompletamentePagadasEnPaquete = paqueteExistente.facturas.filter(facturaId => {
                const factura = facturasExistentes.find(f => f._id.toString() === facturaId.toString());
                return factura && factura.importePagado >= factura.importeAPagar;
            });

            const facturasCompletamentePagadasDuplicadas = facturasCompletamentePagadas.filter(f =>
                facturasCompletamentePagadasEnPaquete.includes(f._id)
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
                            datosAgregacion.estadoPago = null; // Pendiente de autorización
                            datosAgregacion.autorizada = false; // Pendiente de autorización
                            datosAgregacion.esCompleta = false; // No está completamente pagada hasta que se autorice
                        } else if (factura.importePagado > 0) {
                            // Pago parcial - también pendiente de autorización (como los completos)
                            datosAgregacion.estadoPago = null; // Pendiente de autorización
                            datosAgregacion.autorizada = false; // Pendiente de autorización
                            datosAgregacion.esCompleta = false;
                        } else {
                            // Sin pagos - estado inicial
                            datosAgregacion.estadoPago = 1; // Enviado a pago
                            datosAgregacion.autorizada = false;
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
            const facturasActuales = paqueteExistente.facturas.map(f => f.toString());
            const facturasNuevas = facturas.filter(f => !facturasActuales.includes(f.toString()));

            if (facturasNuevas.length > 0) {
                // Agregar las nuevas facturas al array existente
                datosActualizacion.facturas = [...paqueteExistente.facturas, ...facturasNuevas];
            }
        }
        if (estatus) datosActualizacion.estatus = estatus;
        if (departamento_id) datosActualizacion.departamento_id = departamento_id;
        if (departamento) datosActualizacion.departamento = departamento;
        if (comentario !== undefined) datosActualizacion.comentario = comentario;
        if (fechaPago) datosActualizacion.fechaPago = new Date(fechaPago);
        if (totalImporteAPagar !== undefined) datosActualizacion.totalImporteAPagar = totalImporteAPagar;

        const paqueteActualizado = await InvoicesPackage.findByIdAndUpdate(
            id,
            { $set: datosActualizacion },
            { new: true, runValidators: true }
        );

        // Recalcular totales si se cambiaron las facturas
        if (facturas) {
            await paqueteActualizado.actualizarTotales();
        }

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

        // Obtener el paquete actualizado con las facturas pobladas
        const paqueteCompleto = await InvoicesPackage.findById(id)
            .populate('facturas')
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

        await Promise.all([
            // Actualizar facturas
            ImportedInvoices.updateMany(
                { _id: { $in: paquete.facturas } },
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

            await Promise.all(
                paquete.facturas.map(facturaId =>
                    ImportedInvoices.findByIdAndUpdate(facturaId, { $set: datosPago })
                )
            );
        }

        // Cambiar el estatus
        await paquete.cambiarEstatus(estatus);

        const paqueteActualizado = await InvoicesPackage.findById(id)
            .populate('facturas');

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

// GET - Obtener paquetes por usuario_id
export const getInvoicesPackagesByUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.query;
        if (!usuario_id) {
            return res.status(400).json({ success: false, message: 'usuario_id es requerido' });
        }

        // Convertir a ObjectId
        const usuarioObjectId = new mongoose.Types.ObjectId(usuario_id);

        const paquetes = await InvoicesPackage.find({ usuario_id: usuarioObjectId })
            .populate('facturas')
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

// Función para actualizar totales de paquetes cuando se desautoriza una factura
export const actualizarTotalesPaquetesPorFactura = async (facturaId) => {
    try {
        // Buscar todos los paquetes que contengan esta factura
        const paquetes = await InvoicesPackage.find({
            facturas: facturaId
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