import mongoose from 'mongoose';
import { Counter } from "./Counter.js";
import { ImportedInvoices } from './ImportedInvoices.js';

const InvoicesPackageSchema = new mongoose.Schema({
    // Arreglo de facturas importadas con todos sus datos embebidos
    facturas: [{
        // ID original de la factura (para compatibilidad)
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        // UUID del folio fiscal (identificador único del CFDI)
        uuid: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            match: [/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i, 'Formato de UUID inválido']
        },

        // RFC del emisor de la factura
        rfcEmisor: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            match: [/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Formato de RFC inválido']
        },

        // Razón social o nombre del emisor
        nombreEmisor: {
            type: String,
            required: true,
            trim: true,
            maxLength: 254
        },

        // Referencia a la empresa en el sistema
        razonSocial: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'cc_companies',
            required: true
        },

        // RFC del receptor de la factura
        rfcReceptor: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            match: [/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Formato de RFC inválido']
        },

        // Razón social o nombre del receptor
        nombreReceptor: {
            type: String,
            required: true,
            trim: true,
            maxLength: 254
        },

        // RFC del Proveedor Autorizado de Certificación (PAC)
        rfcProveedorCertificacion: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            match: [/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/, 'Formato de RFC del PAC inválido']
        },

        // Fecha de emisión del comprobante
        fechaEmision: {
            type: Date,
            required: true
        },

        // Fecha de timbrado/certificación por el SAT
        fechaCertificacionSAT: {
            type: Date,
            required: true
        },

        // Fecha de cancelación del comprobante
        fechaCancelacion: {
            type: Date,
            default: null
        },

        // Importe a pagar (monto original de la factura)
        importeAPagar: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0,
            get: function (value) {
                return value ? parseFloat(value.toString()) : 0;
            }
        },

        // Tipo de comprobante fiscal
        tipoComprobante: {
            type: String,
            required: true,
            enum: {
                values: ['I', 'E', 'P'],
                message: 'El tipo de comprobante debe ser I (Ingreso), E (Egreso), o P (Pago)'
            }
        },

        // Estatus del comprobante
        estatus: {
            type: Number,
            required: true,
            enum: {
                values: [0, 1],
                message: 'El estatus debe ser 0 (Cancelado) o 1 (Vigente)'
            },
            default: 1
        },

        // Folio del comprobante
        folio: {
            type: String,
            trim: true,
            maxLength: 50
        },

        // Serie del comprobante
        serie: {
            type: String,
            trim: true,
            maxLength: 50
        },

        // Forma de pago (código SAT)
        formaPago: {
            type: String,
            trim: true,
            maxLength: 10
        },

        // Método de pago (PUE, PPD, etc.)
        metodoPago: {
            type: String,
            trim: true,
            maxLength: 10
        },

        // Importe ya pagado
        importePagado: {
            type: mongoose.Schema.Types.Decimal128,
            min: 0,
            default: 0,
            get: function (value) {
                return value ? parseFloat(value.toString()) : 0;
            }
        },

        // Estado del pago (null=Pendiente de autorización, 0=Pendiente, 1=Enviado a pago, 2=Pagado, 3=Registrado)
        estadoPago: {
            type: Number,
            enum: {
                values: [null, 0, 1, 2, 3],
                message: 'El estado de pago debe ser null (Pendiente de autorización), 0 (Pendiente), 1 (Enviado), 2 (Pagado), o 3 (Registrado)'
            },
            default: 0
        },

        // Si la factura está completa
        esCompleta: {
            type: Boolean,
            default: false
        },

        // Descripción del pago
        descripcionPago: {
            type: String,
            trim: true,
            maxLength: 500
        },

        // Si está autorizada
        autorizada: {
            type: Boolean,
            default: true
        },

        // Si el pago fue rechazado (no se puede volver a autorizar hasta que se vuelva a pagar)
        pagoRechazado: {
            type: Boolean,
            default: false
        },

        // Fecha de revisión
        fechaRevision: {
            type: Date,
            default: null
        },

        // Si está registrado (0 = No, 1 = Sí)
        registrado: {
            type: Number,
            enum: {
                values: [0, 1],
                message: 'El valor debe ser 0 (No) o 1 (Sí)'
            },
            default: 0
        },

        // Si está pagado (0 = No, 1 = Sí)
        pagado: {
            type: Number,
            enum: {
                values: [0, 1],
                message: 'El valor debe ser 0 (No) o 1 (Sí)'
            },
            default: 0
        },

        // Estatus de la factura (texto descriptivo)
        fiestatus: {
            type: String,
            trim: true,
            maxLength: 50,
            default: 'Activo'
        },

        // Si la factura está registrada en un paquete
        estaRegistrada: {
            type: Boolean,
            default: false
        },

        // Motivo del descuento
        motivoDescuento: {
            type: String,
            trim: true,
            maxLength: 500,
            default: ''
        },

        // Porcentaje de descuento aplicado
        descuento: {
            type: Number,
            default: 0
        },

        // Referencia al concepto de gasto (objeto con id, name, descripcion)
        conceptoGasto: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'cc_expense_concept',
                required: false
            },
            name: {
                type: String,
                required: false
            },
            descripcion: {
                type: String,
                required: false
            }
        },

        // Timestamps de la factura original
        createdAt: {
            type: Date,
            default: Date.now
        },

        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Referencia a la relación con Company, Brand, Branch
    packageCompanyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'rs_invoices_packages_companies',
        required: false, // Opcional para mantener compatibilidad con registros existentes
        index: true
    },

    // Estatus del paquete de facturas
    estatus: {
        type: String,
        required: true,
        enum: {
            values: ['Borrador', 'Enviado', 'Aprobado', 'Rechazado', 'Pagado', 'Cancelado'],
            message: 'El estatus debe ser uno de: Borrador, Enviado, Aprobado, Rechazado, Pagado, Cancelado'
        },
        default: 'Borrador',
        index: true
    },

    // Usuario que creó el paquete
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cs_user',
        required: true,
        index: true
    },

    // ID del departamento
    departamento_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'cc_department',
        required: true,
        index: true
    },

    // Nombre del departamento
    departamento: {
        type: String,
        required: true,
        trim: true,
        maxLength: 100
    },

    // Total del importe a pagar de todas las facturas
    totalImporteAPagar: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        min: 0,
        default: 0,
        get: function (value) {
            return value ? parseFloat(value.toString()) : 0;
        }
    },

    // Total pagado de todas las facturas
    totalPagado: {
        type: mongoose.Schema.Types.Decimal128,
        required: true,
        min: 0,
        default: 0,
        get: function (value) {
            return value ? parseFloat(value.toString()) : 0;
        }
    },

    // Comentario del paquete
    comentario: {
        type: String,
        trim: true,
        maxLength: 1000
    },

    // Fecha de pago programada
    fechaPago: {
        type: Date,
        required: true,
        index: true
    },

    // Folio del paquete
    folio: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },

    // Total de facturas en el paquete
    totalFacturas: {
        type: Number,
        required: true,
        min: 1,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'cc_invoices_package',

    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            if (ret.totalImporteAPagar && typeof ret.totalImporteAPagar.toString === 'function') {
                ret.totalImporteAPagar = parseFloat(ret.totalImporteAPagar.toString());
            }
            if (ret.totalPagado && typeof ret.totalPagado.toString === 'function') {
                ret.totalPagado = parseFloat(ret.totalPagado.toString());
            }

            // Transformar campos Decimal128 de las facturas embebidas
            if (ret.facturas && Array.isArray(ret.facturas)) {
                ret.facturas = ret.facturas.map(factura => {
                    const facturaTransformed = { ...factura };

                    if (factura.importeAPagar && typeof factura.importeAPagar.toString === 'function') {
                        facturaTransformed.importeAPagar = parseFloat(factura.importeAPagar.toString());
                    }
                    if (factura.importePagado && typeof factura.importePagado.toString === 'function') {
                        facturaTransformed.importePagado = parseFloat(factura.importePagado.toString());
                    }

                    // Normalizar razonSocial si es un ObjectId
                    if (factura.razonSocial && typeof factura.razonSocial === 'object' && factura.razonSocial._bsontype === 'ObjectId') {
                        facturaTransformed.razonSocial = {
                            _id: factura.razonSocial.toString(),
                            name: '',
                            rfc: ''
                        };
                    }

                    return facturaTransformed;
                });
            }

            return ret;
        }
    }
});

// Índices compuestos para optimizar consultas
InvoicesPackageSchema.index({ usuario_id: 1, estatus: 1 });
InvoicesPackageSchema.index({ departamento_id: 1, estatus: 1 });
InvoicesPackageSchema.index({ fechaPago: 1, estatus: 1 });
InvoicesPackageSchema.index({ fechaCreacion: -1, estatus: 1 });

// Métodos virtuales actualizados
InvoicesPackageSchema.virtual('estaCompleto').get(function () {
    return this.totalPagado >= this.totalImporteAPagar;
});

InvoicesPackageSchema.virtual('porcentajePagado').get(function () {
    if (this.totalImporteAPagar <= 0) return 0;
    return Math.round((this.totalPagado / this.totalImporteAPagar) * 100);
});

InvoicesPackageSchema.virtual('tieneSaldoPendiente').get(function () {
    return this.totalPagado < this.totalImporteAPagar;
});

InvoicesPackageSchema.virtual('saldo').get(function () {
    return this.totalImporteAPagar - this.totalPagado;
});

InvoicesPackageSchema.virtual('estaVencido').get(function () {
    return new Date() > this.fechaPago;
});

InvoicesPackageSchema.virtual('diasParaVencimiento').get(function () {
    const hoy = new Date();
    const vencimiento = new Date(this.fechaPago);
    const diffTime = vencimiento - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Métodos de instancia actualizados para trabajar con datos embebidos
InvoicesPackageSchema.methods.actualizarTotales = async function () {
    // Calcular totales usando los datos embebidos de las facturas
    this.totalImporteAPagar = this.facturas.reduce((sum, factura) => {
        const importe = typeof factura.importeAPagar === 'object' && factura.importeAPagar !== null && factura.importeAPagar._bsontype === 'Decimal128'
            ? parseFloat(factura.importeAPagar.toString())
            : factura.importeAPagar || 0;
        return sum + importe;
    }, 0);

    this.totalPagado = this.facturas.reduce((sum, factura) => {
        const importe = typeof factura.importePagado === 'object' && factura.importePagado !== null && factura.importePagado._bsontype === 'Decimal128'
            ? parseFloat(factura.importePagado.toString())
            : factura.importePagado || 0;
        return sum + importe;
    }, 0);

    this.totalFacturas = this.facturas.length;

    return this.save();
};

InvoicesPackageSchema.methods.agregarFactura = async function (facturaData) {
    // Verificar que la factura no esté ya en el paquete por UUID o _id
    const facturaExistente = this.facturas.find(f =>
        f.uuid === facturaData.uuid || f._id.toString() === facturaData._id.toString()
    );
    if (!facturaExistente) {
        this.facturas.push(facturaData);
        await this.actualizarTotales();
    }
    return this;
};

InvoicesPackageSchema.methods.removerFactura = async function (identificador) {
    // Puede ser UUID o _id
    this.facturas = this.facturas.filter(factura =>
        factura.uuid !== identificador && factura._id.toString() !== identificador.toString()
    );
    await this.actualizarTotales();
    return this;
};

InvoicesPackageSchema.methods.actualizarFactura = async function (uuid, datosActualizados) {
    const index = this.facturas.findIndex(factura => factura.uuid === uuid);
    if (index !== -1) {
        this.facturas[index] = { ...this.facturas[index], ...datosActualizados };
        await this.actualizarTotales();
    }
    return this;
};

InvoicesPackageSchema.methods.buscarFacturaPorUUID = function (uuid) {
    return this.facturas.find(factura => factura.uuid === uuid);
};

InvoicesPackageSchema.methods.cambiarEstatus = function (nuevoEstatus) {
    this.estatus = nuevoEstatus;
    return this.save();
};

// Métodos estáticos
InvoicesPackageSchema.statics.obtenerSiguienteFolio = async function () {
    const result = await Counter.findByIdAndUpdate(
        { _id: "invoicesPackageFolio" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return result.seq;
};

InvoicesPackageSchema.statics.buscarPorDepartamento = function (departamentoId) {
    return this.find({ departamento_id: departamentoId });
};

InvoicesPackageSchema.statics.buscarPorUsuario = function (usuarioId) {
    return this.find({ usuario_id: usuarioId });
};

InvoicesPackageSchema.statics.buscarVencidos = function () {
    return this.find({
        fechaPago: { $lt: new Date() },
        estatus: { $in: ['Borrador', 'Enviado', 'Aprobado'] }
    });
};

InvoicesPackageSchema.statics.obtenerResumen = async function (usuarioId = null) {
    const filtro = usuarioId ? { usuario_id: usuarioId } : {};

    const promesaTotal = this.countDocuments(filtro);
    const promesaBorradores = this.countDocuments({ ...filtro, estatus: 'Borrador' });
    const promesaEnviados = this.countDocuments({ ...filtro, estatus: 'Enviado' });
    const promesaAprobados = this.countDocuments({ ...filtro, estatus: 'Aprobado' });
    const promesaPagados = this.countDocuments({ ...filtro, estatus: 'Pagado' });
    const promesaVencidos = this.countDocuments({
        ...filtro,
        fechaPago: { $lt: new Date() },
        estatus: { $in: ['Borrador', 'Enviado', 'Aprobado'] }
    });

    const [total, borradores, enviados, aprobados, pagados, vencidos] = await Promise.all([
        promesaTotal,
        promesaBorradores,
        promesaEnviados,
        promesaAprobados,
        promesaPagados,
        promesaVencidos
    ]);

    return {
        total,
        borradores,
        enviados,
        aprobados,
        pagados,
        vencidos
    };
};

// Middleware pre-save para validaciones actualizado
InvoicesPackageSchema.pre('save', function (next) {
    // Validar que totalPagado no exceda totalImporteAPagar
    if (this.totalPagado > this.totalImporteAPagar) {
        this.totalPagado = this.totalImporteAPagar;
    }

    // Validar que haya al menos una factura
    if (this.facturas.length === 0) {
        return next(new Error('El paquete debe contener al menos una factura'));
    }

    // Validar que no haya facturas duplicadas por UUID o _id
    const uuids = this.facturas.map(factura => factura.uuid);
    const ids = this.facturas.map(factura => factura._id.toString());
    const uuidsUnicos = [...new Set(uuids)];
    const idsUnicos = [...new Set(ids)];

    if (uuidsUnicos.length !== uuids.length) {
        return next(new Error('No se pueden agregar facturas duplicadas al mismo paquete (UUID duplicado)'));
    }

    if (idsUnicos.length !== ids.length) {
        return next(new Error('No se pueden agregar facturas duplicadas al mismo paquete (ID duplicado)'));
    }

    next();
});

const InvoicesPackage = mongoose.model('cc_invoices_package', InvoicesPackageSchema);

export { InvoicesPackage }; 