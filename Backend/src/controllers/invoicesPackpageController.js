import { InvoicesPackpage } from "../models/InvoicesPackpage.js";
import { ImportedInvoices } from "../models/ImportedInvoices.js";
import mongoose from "mongoose";

// CREATE - Crear un nuevo paquete de facturas
export const createInvoicesPackpage = async (req, res) => {
    try {
        const {
            facturas,
            usuario_id,
            departamento_id,
            departamento,
            comentario,
            fechaPago,
            totalImporteAPagar
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

        // Obtener el siguiente folio
        const siguienteFolio = await InvoicesPackpage.obtenerSiguienteFolio();

        // Convertir usuario_id a ObjectId
        const usuarioObjectId = new mongoose.Types.ObjectId(usuario_id);

        // Crear el paquete
        const nuevoPaquete = new InvoicesPackpage({
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

        // Marcar las facturas como registradas
        await ImportedInvoices.updateMany(
            { _id: { $in: facturas } },
            { $set: { estaRegistrada: true, autorizada: false } }
        );

        // Obtener el paquete con las facturas pobladas
        const paqueteCompleto = await InvoicesPackpage.findById(paqueteGuardado._id)
            .populate('facturas');

        res.status(201).json({
            success: true,
            message: 'Paquete de facturas creado exitosamente.',
            data: paqueteCompleto
        });

    } catch (error) {
        console.error('Error creating invoices packpage:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// READ - Obtener todos los paquetes con paginación
export const getInvoicesPackpages = async (req, res) => {
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
        const paquetesPromise = InvoicesPackpage.find(filtros)
            .populate('facturas')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean({ getters: true });

        const countPromise = InvoicesPackpage.countDocuments(filtros);

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
        console.error('Error getting invoices packpages:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// READ - Obtener un paquete específico por ID
export const getInvoicesPackpageById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Buscando paquete con ID:', id);

        const paquete = await InvoicesPackpage.findById(id)
            .populate('facturas');

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

        function normalizePackpage(paquete) {
            const toNumber = v => (typeof v === 'object' && v !== null && v._bsontype === 'Decimal128') ? parseFloat(v.toString()) : v;
            const toString = v => (typeof v === 'object' && v !== null && v._bsontype === 'ObjectId') ? v.toString() : v;
            return {
                ...paquete._doc,
                _id: toString(paquete._id),
                usuario_id: toString(paquete.usuario_id),
                departamento_id: toString(paquete.departamento_id),
                totalImporteAPagar: toNumber(paquete.totalImporteAPagar),
                totalPagado: toNumber(paquete.totalPagado),
                fechaPago: paquete.fechaPago ? new Date(paquete.fechaPago).toISOString() : null,
                fechaCreacion: paquete.fechaCreacion ? new Date(paquete.fechaCreacion).toISOString() : null,
                createdAt: paquete.createdAt ? new Date(paquete.createdAt).toISOString() : null,
                updatedAt: paquete.updatedAt ? new Date(paquete.updatedAt).toISOString() : null,
                facturas: (paquete.facturas || []).map(normalizeFactura)
            };
        }

        res.status(200).json({
            success: true,
            data: normalizePackpage(paquete),
            message: 'Paquete de facturas encontrado exitosamente.'
        });

    } catch (error) {
        console.error('Error getting invoices packpage by id:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// UPDATE - Actualizar un paquete de facturas
export const updateInvoicesPackpage = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            facturas,
            estatus,
            departamento_id,
            departamento,
            comentario,
            fechaPago,
            totalImporteAPagar
        } = req.body;

        // Buscar el paquete existente
        const paqueteExistente = await InvoicesPackpage.findById(id);
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

            // Actualizar las facturas que se removieron del paquete
            const facturasRemovidas = paqueteExistente.facturas.filter(
                facturaId => !facturas.includes(facturaId.toString())
            );

            if (facturasRemovidas.length > 0) {
                const datosRemocion = {
                    descripcionPago: 'Removida del paquete',
                    estadoPago: 0, // Pendiente
                    registrado: 0, // No registrado
                    estaRegistrada: false // Marcar como no registrada
                };

                await Promise.all(
                    facturasRemovidas.map(facturaId =>
                        ImportedInvoices.findByIdAndUpdate(facturaId, { $set: datosRemocion })
                    )
                );
            }

            // Actualizar las facturas que se agregaron al paquete
            const facturasNuevas = facturas.filter(
                facturaId => !paqueteExistente.facturas.includes(facturaId)
            );

            if (facturasNuevas.length > 0) {
                const datosAgregacion = {
                    descripcionPago: comentario || 'Agregada al paquete',
                    estadoPago: 1, // Enviado a pago
                    registrado: 1, // Registrado
                    fechaRevision: new Date(),
                    estaRegistrada: true // Marcar como registrada
                };

                await Promise.all(
                    facturasNuevas.map(facturaId =>
                        ImportedInvoices.findByIdAndUpdate(facturaId, { $set: datosAgregacion })
                    )
                );
            }
        }

        // Actualizar el paquete
        const datosActualizacion = {};
        if (facturas) datosActualizacion.facturas = facturas;
        if (estatus) datosActualizacion.estatus = estatus;
        if (departamento_id) datosActualizacion.departamento_id = departamento_id;
        if (departamento) datosActualizacion.departamento = departamento;
        if (comentario !== undefined) datosActualizacion.comentario = comentario;
        if (fechaPago) datosActualizacion.fechaPago = new Date(fechaPago);
        if (totalImporteAPagar !== undefined) datosActualizacion.totalImporteAPagar = totalImporteAPagar;

        const paqueteActualizado = await InvoicesPackpage.findByIdAndUpdate(
            id,
            { $set: datosActualizacion },
            { new: true, runValidators: true }
        );

        // Recalcular totales si se cambiaron las facturas
        if (facturas) {
            await paqueteActualizado.actualizarTotales();
        }

        // Obtener el paquete actualizado con las facturas pobladas
        const paqueteCompleto = await InvoicesPackpage.findById(id)
            .populate('facturas');

        res.status(200).json({
            success: true,
            message: 'Paquete de facturas actualizado exitosamente.',
            data: paqueteCompleto
        });

    } catch (error) {
        console.error('Error updating invoices packpage:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// DELETE - Eliminar un paquete de facturas
export const deleteInvoicesPackpage = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar el paquete
        const paquete = await InvoicesPackpage.findById(id);
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

        await Promise.all(
            paquete.facturas.map(facturaId =>
                ImportedInvoices.findByIdAndUpdate(facturaId, { $set: datosRemocion })
            )
        );

        // Eliminar el paquete
        await InvoicesPackpage.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Paquete de facturas eliminado exitosamente.'
        });

    } catch (error) {
        console.error('Error deleting invoices packpage:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// Función adicional: Obtener resumen de paquetes
export const getInvoicesPackpagesSummary = async (req, res) => {
    try {
        const { usuario_id } = req.query;

        // Convertir a ObjectId si se proporciona
        const usuarioObjectId = usuario_id ? new mongoose.Types.ObjectId(usuario_id) : null;
        const resumen = await InvoicesPackpage.obtenerResumen(usuarioObjectId);

        res.status(200).json({
            success: true,
            data: resumen
        });

    } catch (error) {
        console.error('Error getting invoices packpages summary:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// Función adicional: Buscar paquetes vencidos
export const getVencidosInvoicesPackpages = async (req, res) => {
    try {
        const paquetesVencidos = await InvoicesPackpage.buscarVencidos();

        res.status(200).json({
            success: true,
            data: paquetesVencidos
        });

    } catch (error) {
        console.error('Error getting vencidos invoices packpages:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// Función adicional: Cambiar estatus de un paquete
export const changeInvoicesPackpageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estatus } = req.body;

        if (!estatus) {
            return res.status(400).json({
                success: false,
                message: 'El estatus es requerido.'
            });
        }

        const paquete = await InvoicesPackpage.findById(id);
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

        const paqueteActualizado = await InvoicesPackpage.findById(id)
            .populate('facturas');

        res.status(200).json({
            success: true,
            message: 'Estatus del paquete actualizado exitosamente.',
            data: paqueteActualizado
        });

    } catch (error) {
        console.error('Error changing invoices packpage status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};

// GET - Obtener paquetes por usuario_id
export const getInvoicesPackpagesByUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.query;
        if (!usuario_id) {
            return res.status(400).json({ success: false, message: 'usuario_id es requerido' });
        }

        // Convertir a ObjectId
        const usuarioObjectId = new mongoose.Types.ObjectId(usuario_id);

        const paquetes = await InvoicesPackpage.find({ usuario_id: usuarioObjectId }).populate('facturas');

        // Agregar headers para evitar caché
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.status(200).json({ success: true, data: paquetes });
    } catch (error) {
        console.error('Error en getInvoicesPackpagesByUsuario:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}; 